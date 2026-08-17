import { IMultiplayerModeField } from "../lib/schemas/games.schema";

export const formatMultiplayerMode = (mode: IMultiplayerModeField): string[] => {
  const labels: string[] = [];

  if (mode.campaignCoop) labels.push("Campaign Co-op");
  if (mode.dropIn) labels.push("Drop-in Co-op");
  if (mode.lanCoop) labels.push("LAN Co-op");
  if (mode.offlineCoop) {
    labels.push(
      mode.offlineCoopMax
        ? `Offline Co-op (up to ${mode.offlineCoopMax})`
        : "Offline Co-op"
    );
  }
  if (mode.onlineCoop) {
    labels.push(
      mode.onlineCoopMax
        ? `Online Co-op (up to ${mode.onlineCoopMax})`
        : "Online Co-op"
    );
  }
  if (mode.splitscreen) labels.push("Splitscreen");
  if (mode.splitscreenOnline) labels.push("Splitscreen Online");
  if (mode.offlineMax) labels.push(`Offline players: ${mode.offlineMax}`);
  if (mode.onlineMax) labels.push(`Online players: ${mode.onlineMax}`);

  return labels;
};
