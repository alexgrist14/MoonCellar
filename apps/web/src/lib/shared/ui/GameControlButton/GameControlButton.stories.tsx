import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SvgHeart, SvgHeartFilled, SvgListBullet, SvgPlay } from "../svg";
import { GameControlButton } from "./GameControlButton";
import { IGameControlTone } from "./gameControls.utils";

const tones: IGameControlTone[] = [
  "playing",
  "completed",
  "mastered",
  "played",
  "dropped",
  "wishlist",
  "backlog",
];

const meta = {
  title: "Shared/GameControlButton",
  component: GameControlButton,
  args: {
    icon: <SvgPlay size="16" />,
    label: "Add playthrough",
    tooltip: "Add playthrough",
  },
  argTypes: {
    tone: {
      control: "select",
      options: [...tones, "favorite", "list"],
    },
  },
} satisfies Meta<typeof GameControlButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Favorite: Story = {
  args: {
    icon: <SvgHeartFilled size="16" />,
    label: "Remove from favourites",
    tooltip: "Remove from favourites",
    tone: "favorite",
    isActive: true,
    isPressed: true,
  },
};

export const FavoriteInactive: Story = {
  args: {
    icon: <SvgHeart size="16" />,
    label: "Add to favourites",
    tooltip: "Add to favourites",
    tone: "favorite",
    isPressed: false,
  },
};

export const ListWithBadge: Story = {
  args: {
    icon: <SvgListBullet size="16" />,
    label: "In 3 lists",
    tooltip: "In 3 lists",
    tone: "list",
    isActive: true,
    badge: 3,
    isExpanded: false,
  },
};

export const PlaythroughTones: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--gap-x4)" }}>
      {tones.map((tone) => (
        <GameControlButton
          key={tone}
          {...args}
          tone={tone}
          label={tone}
          tooltip={tone}
          isActive
        />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    tooltip: "Sign in to track your playthroughs",
    isDisabled: true,
  },
};
