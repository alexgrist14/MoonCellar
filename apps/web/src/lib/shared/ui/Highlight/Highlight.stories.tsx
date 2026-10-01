import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Highlight } from "./Highlight";

const meta = {
  title: "Shared/Highlight",
  component: Highlight,
  args: { text: "The Legend of Zelda: A Link to the Past", query: "link" },
} satisfies Meta<typeof Highlight>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MultipleMatches: Story = {
  args: {
    text: "Final Fantasy, Final Fantasy II, Final Fantasy III",
    query: "fantasy",
  },
};

export const NoQuery: Story = { args: { query: "" } };

export const NoMatch: Story = { args: { query: "metroid" } };
