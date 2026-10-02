import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type FilterQuery, Model } from "mongoose";
import {
  type ICommunityAuthor,
  type IGetNotificationsQuery,
  type IGetNotificationsResponse,
  type IMarkNotificationsReadRequest,
  type INotification,
  type INotificationPayload,
  type INotificationType,
  getNotificationHref,
  getNotificationSentence,
  isAlertNotification,
  NOTIFICATION_ACTORS_SHOWN,
} from "@mooncellar/schemas";
import { User } from "../../user/schemas/user.schema";
import { NotificationsGateway } from "../gateways/notifications.gateway";
import { PushService } from "./push.service";
import {
  Notification,
  type NotificationDocument,
} from "../schemas/notification.schema";

type IIdLike = mongoose.Types.ObjectId | string;

type ILeanNotification = Notification & { _id: mongoose.Types.ObjectId };

export type INotifyParams = {
  userId: IIdLike;
  actorId?: IIdLike | null;
  type: INotificationType;
  subjectId: IIdLike;
  payload?: INotificationPayload;
};

export type IRetractParams = {
  userId: IIdLike;
  actorId: IIdLike;
  type: INotificationType;
  subjectId: IIdLike;
};

const toId = (id: IIdLike) => new mongoose.Types.ObjectId(String(id));

const getGroupKey = (type: INotificationType, subjectId: IIdLike) =>
  `${type}:${String(subjectId)}`;

const isDuplicateKeyError = (error: unknown) =>
  (error as { code?: number } | null)?.code === 11000;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notifications: Model<NotificationDocument>,
    @InjectModel(User.name)
    private readonly users: Model<User>,
    private readonly gateway: NotificationsGateway,
    private readonly push: PushService
  ) {}

  async notify(params: INotifyParams) {
    if (params.actorId && String(params.actorId) === String(params.userId)) {
      return;
    }

    try {
      if (await this.isMuted(params.userId, params.type)) return;

      const doc = await this.upsert(params).catch((error: unknown) => {
        if (!isDuplicateKeyError(error)) throw error;

        return this.upsert(params);
      });

      if (!doc) return;

      const userId = String(params.userId);
      const [notification] = await this.decorate([doc]);

      this.gateway.notificationCreated(userId, {
        notification,
        unreadCount: await this.countUnread(userId),
      });

      if (isAlertNotification(notification)) {
        await this.push.sendToUser(userId, {
          title: "MoonCellar",
          body: getNotificationSentence(notification),
          url: getNotificationHref(notification),
          tag: notification._id,
        });
      }
    } catch (error) {
      this.logger.error(
        error,
        `Failed to notify ${String(params.userId)}: ${params.type}`
      );
    }
  }

  async retract({ userId, actorId, type, subjectId }: IRetractParams) {
    try {
      const doc = await this.notifications
        .findOneAndUpdate(
          {
            userId: toId(userId),
            groupKey: getGroupKey(type, subjectId),
            isRead: false,
          },
          { $pull: { actorIds: toId(actorId) } },
          { new: true, timestamps: false }
        )
        .lean<ILeanNotification>();

      if (!doc) return;

      if (!doc.actorIds.length) {
        await this.notifications.deleteOne({ _id: doc._id });
      }

      await this.pushUnreadCount(String(userId));
    } catch (error) {
      this.logger.error(
        error,
        `Failed to retract ${type} from ${String(userId)}`
      );
    }
  }

  async removeBySubject(subjectId: IIdLike) {
    try {
      const filter = { subjectId: toId(subjectId) };
      const userIds = await this.notifications.distinct("userId", {
        ...filter,
        isRead: false,
      });

      await this.notifications.deleteMany(filter);
      await Promise.all(
        userIds.map((userId) => this.pushUnreadCount(String(userId)))
      );
    } catch (error) {
      this.logger.error(
        error,
        `Failed to remove notifications about ${String(subjectId)}`
      );
    }
  }

  async getList(
    userId: string,
    { before, take, unread }: IGetNotificationsQuery
  ): Promise<IGetNotificationsResponse> {
    const filter: FilterQuery<NotificationDocument> = {
      userId: toId(userId),
      ...(unread && { isRead: false }),
      ...(before && { updatedAt: { $lt: new Date(before) } }),
    };

    const [docs, unreadCount] = await Promise.all([
      this.notifications
        .find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .limit(take + 1)
        .lean<ILeanNotification[]>(),
      this.countUnread(userId),
    ]);

    const page = docs.slice(0, take);

    return {
      items: await this.decorate(page),
      unreadCount,
      nextCursor:
        docs.length > take
          ? new Date(page[page.length - 1].updatedAt).toISOString()
          : null,
    };
  }

  async getUnreadCount(userId: string) {
    return { unreadCount: await this.countUnread(userId) };
  }

  async markRead(userId: string, { ids, all }: IMarkNotificationsReadRequest) {
    await this.notifications.updateMany(
      {
        userId: toId(userId),
        isRead: false,
        ...(!all && { _id: { $in: (ids ?? []).map(toId) } }),
      },
      { $set: { isRead: true, readAt: new Date() } },
      { timestamps: false }
    );

    return { unreadCount: await this.pushUnreadCount(userId) };
  }

  async remove(userId: string, id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new NotFoundException("Notification not found");
    }

    const { deletedCount } = await this.notifications.deleteOne({
      _id: toId(id),
      userId: toId(userId),
    });

    if (!deletedCount) throw new NotFoundException("Notification not found");

    return { unreadCount: await this.pushUnreadCount(userId) };
  }

  private upsert({ userId, actorId, type, subjectId, payload }: INotifyParams) {
    const recipient = toId(userId);
    const actor = actorId ? toId(actorId) : null;
    const actorIds = { $ifNull: ["$actorIds", []] };

    return this.notifications
      .findOneAndUpdate(
        {
          userId: recipient,
          groupKey: getGroupKey(type, subjectId),
          isRead: false,
        },
        [
          {
            $set: {
              userId: recipient,
              type: { $literal: type },
              subjectId: toId(subjectId),
              groupKey: { $literal: getGroupKey(type, subjectId) },
              payload: { $literal: payload ?? {} },
              isRead: false,
              readAt: null,
              actorIds: actor
                ? {
                    $concatArrays: [
                      [actor],
                      {
                        $filter: {
                          input: actorIds,
                          cond: { $ne: ["$$this", actor] },
                        },
                      },
                    ],
                  }
                : actorIds,
              createdAt: { $ifNull: ["$createdAt", "$$NOW"] },
              updatedAt: "$$NOW",
            },
          },
        ],
        { upsert: true, new: true, timestamps: false }
      )
      .lean<ILeanNotification>();
  }

  private async isMuted(userId: IIdLike, type: INotificationType) {
    return !!(await this.users.exists({
      _id: toId(userId),
      "settings.mutedNotifications": type,
    }));
  }

  private countUnread(userId: string) {
    return this.notifications.countDocuments({
      userId: toId(userId),
      isRead: false,
    });
  }

  private async pushUnreadCount(userId: string) {
    const unreadCount = await this.countUnread(userId);

    this.gateway.unreadCountChanged(userId, unreadCount);

    return unreadCount;
  }

  private async decorate(docs: ILeanNotification[]): Promise<INotification[]> {
    const shownIds = docs.flatMap((doc) =>
      doc.actorIds.slice(0, NOTIFICATION_ACTORS_SHOWN)
    );
    const users = shownIds.length
      ? await this.users
          .find({ _id: { $in: shownIds } }, { userName: 1, avatar: 1 })
          .lean()
      : [];
    const authors = new Map<string, ICommunityAuthor>(
      users.map((user) => [
        String(user._id),
        {
          _id: String(user._id),
          userName: user.userName,
          ...(!!user.avatar && { avatar: user.avatar }),
        },
      ])
    );

    return docs.map((doc) => ({
      _id: String(doc._id),
      type: doc.type,
      actors: doc.actorIds
        .slice(0, NOTIFICATION_ACTORS_SHOWN)
        .map((id) => authors.get(String(id)))
        .filter((author): author is ICommunityAuthor => !!author),
      actorsCount: doc.actorIds.length,
      payload: doc.payload ?? {},
      isRead: doc.isRead,
      createdAt: new Date(doc.createdAt).toISOString(),
      updatedAt: new Date(doc.updatedAt).toISOString(),
    }));
  }
}
