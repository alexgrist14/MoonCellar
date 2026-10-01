import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Box } from "../Box";
import { Button, ButtonColor } from "../Button";
import { modal } from "./ModalsConnector";

const meta = {
  title: "Shared/Modal",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const GameInfo = () => (
  <Box title="Hollow Knight" isTitleStart>
    <p>Released 24.02.2017 · Team Cherry</p>
    <p>Average completion time: 27 hours.</p>
  </Box>
);

const Outer = () => (
  <Box title="Edit playthrough" isTitleStart>
    <p>Celeste · Nintendo Switch · Completed</p>
    <Button
      color={ButtonColor.RED}
      onClick={() =>
        modal.open(
          <Box title="Delete playthrough?">
            <Button onClick={() => modal.close("inner")}>Cancel</Button>
          </Box>,
          { id: "inner" }
        )
      }
    >
      Delete
    </Button>
  </Box>
);

export const Default: Story = {
  render: () => (
    <Button onClick={() => modal.open(<GameInfo />)}>Open modal</Button>
  ),
};

export const Stacked: Story = {
  render: () => (
    <Button onClick={() => modal.open(<Outer />, { id: "outer" })}>
      Open stacked modals
    </Button>
  ),
};

export const Resizable: Story = {
  render: () => (
    <Button onClick={() => modal.open(<GameInfo />, { isResizable: true })}>
      Open resizable modal
    </Button>
  ),
};
