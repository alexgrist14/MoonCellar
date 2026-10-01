import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VideosRow } from "./VideosRow";

const meta = {
  title: "Shared/VideosRow",
  component: VideosRow,
  args: {
    videos: [
      "dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      "M7lc1UVf-VE",
      "aqz-KE-bpKQ",
      "ScMzIvxBSi4",
      "9bZkp7q19f0",
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VideosRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleVideo: Story = { args: { videos: ["M7lc1UVf-VE"] } };
