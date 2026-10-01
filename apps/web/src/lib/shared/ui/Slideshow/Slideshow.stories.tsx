import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Slideshow } from "./Slideshow";

const pictures = [
  "/images/moon.jpg",
  "/images/moon2.jpg",
  "/images/moon3.jpg",
  "/images/peakpx.jpg",
  "/images/wp1979091-retro-games-wallpapers.jpg",
];

const meta = {
  title: "Shared/Slideshow",
  component: Slideshow,
  args: { pictures },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slideshow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SinglePicture: Story = { args: { pictures: [pictures[0]] } };

export const ManyPictures: Story = {
  args: { pictures: [...pictures, ...pictures, ...pictures] },
};
