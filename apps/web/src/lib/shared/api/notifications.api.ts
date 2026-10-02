import {
  IGetNotificationsRequest,
  IGetNotificationsResponse,
  IMarkNotificationsReadRequest,
  IPushPublicKeyResponse,
  IPushSubscriptionRequest,
  IUnreadNotificationsResponse,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const NOTIFICATIONS_URL = `${API_URL}/notifications`;

export const notificationsApi = {
  getList: (params: IGetNotificationsRequest) =>
    agent.get<IGetNotificationsResponse>(NOTIFICATIONS_URL, { params }),
  getUnreadCount: () =>
    agent.get<IUnreadNotificationsResponse>(
      `${NOTIFICATIONS_URL}/unread-count`
    ),
  markRead: (body: IMarkNotificationsReadRequest) =>
    agent.patch<IUnreadNotificationsResponse>(
      `${NOTIFICATIONS_URL}/read`,
      body
    ),
  getPushPublicKey: () =>
    agent.get<IPushPublicKeyResponse>(`${NOTIFICATIONS_URL}/push/public-key`),
  subscribePush: (body: IPushSubscriptionRequest) =>
    agent.post(`${NOTIFICATIONS_URL}/push/subscriptions`, body),
  unsubscribePush: (endpoint: string) =>
    agent.delete(`${NOTIFICATIONS_URL}/push/subscriptions`, {
      data: { endpoint },
    }),
  remove: (id: string) =>
    agent.delete<IUnreadNotificationsResponse>(`${NOTIFICATIONS_URL}/${id}`),
};
