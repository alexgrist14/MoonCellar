import { notificationsApi } from "@/src/lib/shared/api";

export const PUSH_WORKER_URL = "/worker.js";

const TAB_NOTIFICATIONS_KEY = "tab-notifications";

export const isNotificationSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export const isTabNotificationsOn = () => {
  try {
    return (
      isNotificationSupported() &&
      Notification.permission === "granted" &&
      localStorage.getItem(TAB_NOTIFICATIONS_KEY) === "on"
    );
  } catch {
    return false;
  }
};

export const setTabNotifications = (isOn: boolean) => {
  try {
    if (isOn) localStorage.setItem(TAB_NOTIFICATIONS_KEY, "on");
    else localStorage.removeItem(TAB_NOTIFICATIONS_KEY);
  } catch {
    return;
  }
};

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const getPushSubscription = async () => {
  if (!isPushSupported()) return null;

  const registration = await navigator.serviceWorker.getRegistration("/");

  return (await registration?.pushManager.getSubscription()) ?? null;
};

export const unsubscribePush = async () => {
  setTabNotifications(false);

  const subscription = await getPushSubscription().catch(() => null);

  if (!subscription) return;

  await notificationsApi
    .unsubscribePush(subscription.endpoint)
    .catch(() => undefined);
  await subscription.unsubscribe().catch(() => undefined);
};

export const decodeVapidKey = (key: string) => {
  const base64 = (key + "=".repeat((4 - (key.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
};
