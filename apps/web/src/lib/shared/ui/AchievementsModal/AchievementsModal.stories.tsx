import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IGameResponse, IPlatform } from "@mooncellar/schemas";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { IRAAward } from "@/src/lib/shared/types/retroachievements.type";
import { AchievementsModal } from "./AchievementsModal";
import { asModal } from "@/.storybook/decorators";

const RA_GAME_ID = 228;

const game = {
  _id: "game-1",
  name: "Super Metroid",
  retroachievements: [{ gameId: RA_GAME_ID, consoleId: 3 }],
} as IGameResponse;

const createAward = (
  awardType: IRAAward["awardType"],
  awardedAt: string
): IRAAward => ({
  awardedAt,
  awardType,
  awardData: RA_GAME_ID,
  awardDataExtra: 1,
  displayOrder: 0,
  title: "Super Metroid",
  consoleName: "SNES/Super Famicom",
  flags: 0,
  imageIcon: `${window.location.origin}/images/logo-icon.png`,
});

const setStores = (raAwards: IRAAward[]) => {
  useAuthStore.setState({
    profile: { _id: "1", userName: "MoonWalker", raAwards } as IUser,
  });
  useCommonStore.setState({
    systems: [
      { name: "SNES/Super Famicom", raId: 3 } as IPlatform,
      { name: "Wii U", raId: 76 } as IPlatform,
    ],
  });
};

const meta = {
  title: "Shared/AchievementsModal",
  component: AchievementsModal,
  args: { game },
  decorators: [asModal],
} satisfies Meta<typeof AchievementsModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithAwards: Story = {
  beforeEach: () => {
    setStores([
      createAward("Mastery/Completion", "2026-03-14T18:20:00Z"),
      createAward("Game Beaten", "2026-03-02T21:05:00Z"),
    ]);
  },
};

export const AwardOnOneOfSeveralConsoles: Story = {
  args: {
    game: {
      ...game,
      retroachievements: [
        { gameId: RA_GAME_ID, consoleId: 3 },
        { gameId: 26000, consoleId: 76 },
      ],
    },
  },
  beforeEach: () => {
    setStores([createAward("Game Beaten", "2026-03-02T21:05:00Z")]);
  },
};

export const NoAwards: Story = {
  beforeEach: () => {
    setStores([]);
  },
};

export const NoRetroAchievementsId: Story = {
  args: { game: { ...game, retroachievements: [] } },
  beforeEach: () => {
    setStores([]);
  },
};
