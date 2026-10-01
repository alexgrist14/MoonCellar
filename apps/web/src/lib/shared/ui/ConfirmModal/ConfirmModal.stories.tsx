import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../Button";
import { modal } from "../Modal";
import { ConfirmModal } from "./ConfirmModal";
import { asModal } from "@/.storybook/decorators";

const MODAL_ID = "confirm-story";

const meta = {
  title: "Shared/ConfirmModal",
  component: ConfirmModal,
  decorators: [asModal],
  args: {
    title: "Delete list",
    message: "Delete “Metroidvanias”? The 12 games stay in your categories.",
    onConfirm: () => new Promise((resolve) => setTimeout(resolve, 1000)),
    onCancel: () => {},
  },
} satisfies Meta<typeof ConfirmModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithWarning: Story = {
  args: { warning: "Links to this list will stop working." },
};

export const CustomLabels: Story = {
  args: {
    title: "Reopen request",
    message: "Move the request for “Celeste” back to pending?",
    confirmText: "Reopen",
    cancelText: "Keep closed",
  },
};

export const LongMessage: Story = {
  args: {
    title: "Delete comment",
    message:
      "Delete this comment by moon_walker on “The Legend of Zelda: Breath of the Wild”? Replies stay visible under a placeholder, reactions are removed, and the comment cannot be restored once it is gone.",
  },
};

export const InModal: Story = {
  render: (args) => (
    <Button
      onClick={() =>
        modal.open(
          <ConfirmModal
            {...args}
            onCancel={() => modal.close(MODAL_ID)}
            onConfirm={() =>
              new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
                modal.close(MODAL_ID)
              )
            }
          />,
          { id: MODAL_ID }
        )
      }
    >
      Delete list
    </Button>
  ),
};
