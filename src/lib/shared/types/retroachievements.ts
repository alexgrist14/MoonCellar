type AwardType =
  | "Achievement Points Yield"
  | "Achievement Unlocks Yield"
  | "Certified Legend"
  | "Game Beaten"
  | "Invalid or deprecated award type"
  | "Mastery/Completion"
  | "Patreon Supporter";

export interface IRAAward {
  awardedAt: string;
  awardType: AwardType;
  awardData: number;
  awardDataExtra: number;
  displayOrder: number;
  title: string;
  consoleName: string;
  flags: number;
  imageIcon: string;
}
