import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { IGameResponse } from "@mooncellar/schemas";
import { GameButtons } from "./GameButtons";

const hollowKnight = {
  _id: "64f0c0ffee0000000000001",
  name: "Hollow Knight",
  slug: "hollow-knight",
  externalPages: [
    { name: "Steam", url: "https://store.steampowered.com/app/367520" },
  ],
  igdb: { gameId: 14593, url: "https://www.igdb.com/games/hollow-knight" },
  hltb: { hltbId: "26286" },
  vndb: { vnId: "v17" },
} as unknown as IGameResponse;

const unknownGame = {
  _id: "64f0c0ffee0000000000002",
  name: "Moonlit Cellar Tales",
  slug: "moonlit-cellar-tales",
} as unknown as IGameResponse;

const meta = {
  title: "Shared/GameButtons",
  component: GameButtons,
  args: { game: hollowKnight },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameButtons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllSources: Story = {};

export const SearchOnly: Story = { args: { game: unknownGame } };
