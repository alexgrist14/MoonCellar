import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import webpush from "web-push";
import type {
  IPushPayload,
  IPushSubscriptionRequest,
} from "@mooncellar/schemas";
import {
  PushSubscription,
  type PushSubscriptionDocument,
} from "../schemas/push-subscription.schema";

const PUSH_TTL_SECONDS = 24 * 60 * 60;
const GONE_STATUSES = [404, 410];

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly publicKey = process.env.VAPID_PUBLIC_KEY || null;
  private readonly isEnabled: boolean;

  constructor(
    @InjectModel(PushSubscription.name)
    private readonly subscriptions: Model<PushSubscriptionDocument>
  ) {
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    this.isEnabled = !!this.publicKey && !!privateKey;

    if (this.isEnabled) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:admin@mooncellar.space",
        this.publicKey!,
        privateKey!
      );
    }
  }

  getPublicKey() {
    return { publicKey: this.isEnabled ? this.publicKey : null };
  }

  async subscribe(
    userId: string,
    { endpoint, keys }: IPushSubscriptionRequest
  ) {
    await this.subscriptions.updateOne(
      { endpoint },
      { $set: { userId: new mongoose.Types.ObjectId(userId), keys } },
      { upsert: true }
    );
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.subscriptions.deleteOne({
      endpoint,
      userId: new mongoose.Types.ObjectId(userId),
    });
  }

  async sendToUser(userId: string, payload: IPushPayload) {
    if (!this.isEnabled) return;

    try {
      const subscriptions = await this.subscriptions
        .find({ userId: new mongoose.Types.ObjectId(userId) })
        .lean();

      await Promise.all(
        subscriptions.map(({ _id, endpoint, keys }) =>
          webpush
            .sendNotification({ endpoint, keys }, JSON.stringify(payload), {
              TTL: PUSH_TTL_SECONDS,
            })
            .catch(async (error: { statusCode?: number }) => {
              if (GONE_STATUSES.includes(error.statusCode ?? 0)) {
                await this.subscriptions.deleteOne({ _id });
                return;
              }

              this.logger.warn(
                `Push to ${new URL(endpoint).host} failed: ${error.statusCode ?? error}`
              );
            })
        )
      );
    } catch (error) {
      this.logger.error(error, `Failed to send push to ${userId}`);
    }
  }
}
