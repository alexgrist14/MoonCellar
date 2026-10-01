import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";
import { Button, ButtonColor } from "../Button";
import { ExpandMenu } from "./ExpandMenu";

const MenuContent = () => (
  <div
    style={{
      display: "grid",
      gap: "var(--gap-x3)",
      padding: "var(--padding-x4)",
    }}
  >
    <h3>Filters</h3>
    <p>Platforms: PlayStation 5, Nintendo Switch</p>
    <p>Genres: Metroidvania, Roguelike</p>
    <Button type="button" color={ButtonColor.ACCENT}>
      Apply
    </Button>
  </div>
);

const meta = {
  title: "Shared/ExpandMenu",
  component: ExpandMenu,
  parameters: { layout: "fullscreen" },
  args: { position: "left", titleOpen: "Filters", children: <MenuContent /> },
  decorators: [
    (Story) => {
      useExpandStore.setState({ expanded: [] });
      return <Story />;
    },
  ],
} satisfies Meta<typeof ExpandMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  decorators: [
    (Story) => {
      useExpandStore.setState({ expanded: ["left"] });
      return <Story />;
    },
  ],
};

export const BottomRight: Story = {
  args: { position: "bottom-right", titleOpen: "Admin", titleClose: "Hide" },
};
