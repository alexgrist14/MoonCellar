import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { IGameResponse } from "@mooncellar/schemas";
import { BGImage } from "./BGImage";

const game = {
  _id: "6650f1c2a1b2c3d4e5f60718",
  name: "Hollow Knight",
  artworks: ["/images/moon2.jpg", "/images/moon3.jpg"],
  screenshots: ["/images/peakpx.jpg"],
} as unknown as IGameResponse;

const meta = {
  title: "Shared/BGImage",
  component: BGImage,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", zIndex: 0, minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BGImage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const GameArtwork: Story = { args: { game } };

export const UserBackground: Story = {
  args: { userImage: "/images/wp1979091-retro-games-wallpapers.jpg" },
};
