export const ANDROID_APK_URL =
  "https://github.com/alexgrist14/MoonCellar/releases/latest";

type IInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let installPrompt: IInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

export const listenInstallPrompt = () => {
  window.addEventListener("beforeinstallprompt", (event) => {
    installPrompt = event as IInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    notify();
  });
};

export const subscribeInstallPrompt = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const canPromptInstall = () => !!installPrompt;

export const promptInstall = async () => {
  if (!installPrompt) return;

  const event = installPrompt;

  await event.prompt();
  await event.userChoice.catch(() => undefined);
  installPrompt = null;
  notify();
};

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches;
