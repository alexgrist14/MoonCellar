import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/src/lib/shared/api";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  decodeVapidKey,
  getPushSubscription,
  isNotificationSupported,
  isPushSupported,
  isTabNotificationsOn,
  SERVICE_WORKER_URL,
  setTabNotifications,
  unsubscribePush,
} from "@/src/lib/shared/utils/push.utils";
import { notificationQueryKeys } from "../api/notification.query-keys";

export type IPushState =
  "checking" | "unavailable" | "denied" | "off" | "on" | "tab" | "busy";

const subscribe = async (publicKey: string) => {
  await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/" });

  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(publicKey),
    }));
  const { endpoint, keys } = subscription.toJSON();

  await notificationsApi.subscribePush({
    endpoint: endpoint ?? subscription.endpoint,
    keys: { p256dh: keys?.p256dh ?? "", auth: keys?.auth ?? "" },
  });
};

export const usePushSubscription = () => {
  const [state, setState] = useState<IPushState>("checking");
  const { data: publicKey, isFetched } = useQuery({
    queryKey: notificationQueryKeys.pushKey(),
    queryFn: () =>
      notificationsApi.getPushPublicKey().then(({ data }) => data.publicKey),
    staleTime: Infinity,
    enabled: isPushSupported(),
  });

  useEffect(() => {
    if (!isNotificationSupported()) {
      setState("unavailable");
      return;
    }

    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    if (isTabNotificationsOn()) {
      setState("tab");
      return;
    }

    if (!isPushSupported()) {
      setState("off");
      return;
    }

    if (!isFetched) return;

    getPushSubscription()
      .then((subscription) => setState(subscription ? "on" : "off"))
      .catch(() => setState("off"));
  }, [isFetched]);

  const enable = useCallback(async () => {
    const permissionRequest = Notification.requestPermission();

    setState("busy");

    const permission = await permissionRequest.catch(() => "default");

    if (permission !== "granted") {
      setState(permission === "denied" ? "denied" : "off");
      toast.error({
        title: "Notifications are not allowed",
        description:
          permission === "denied"
            ? "Allow notifications for this site in the browser settings."
            : "The browser did not show the permission prompt. Try again.",
      });
      return;
    }

    try {
      if (!isPushSupported() || !publicKey) throw new Error("push service");

      await subscribe(publicKey);
      setState("on");
    } catch {
      setTabNotifications(true);
      setState("tab");
      toast.success({
        title: "Notifications are on while MoonCellar is open",
        description:
          "This browser has no push service, so they arrive only while a MoonCellar tab is open.",
      });
    }
  }, [publicKey]);

  const disable = useCallback(async () => {
    setState("busy");
    await unsubscribePush();
    setState("off");
  }, []);

  return { state, enable, disable };
};
