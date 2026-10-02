import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { Button, ButtonColor } from "../Button";
import { ToastConnector } from "./ToastConnector";

const ToastDemo = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <>
    <Button color={ButtonColor.ACCENT} onClick={onClick}>
      {label}
    </Button>
    <ToastConnector />
  </>
);

const meta = {
  title: "Shared/Toast",
  component: ToastConnector,
} satisfies Meta<typeof ToastConnector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  render: () => (
    <ToastDemo
      label="Add to list"
      onClick={() =>
        toast.success({
          title: "Added to list",
          description: "Hollow Knight was added to Favourites",
        })
      }
    />
  ),
};

export const ErrorToast: Story = {
  name: "Error",
  render: () => (
    <ToastDemo
      label="Upload cover"
      onClick={() =>
        toast.error({
          title: "Upload failed",
          description: "The image is larger than 5 MB",
        })
      }
    />
  ),
};

export const Repeated: Story = {
  render: () => (
    <ToastDemo
      label="Save settings (click several times)"
      onClick={() => toast.success({ title: "Settings saved" })}
    />
  ),
};

export const LongText: Story = {
  render: () => (
    <ToastDemo
      label="Sync achievements"
      onClick={() =>
        toast.success({
          title: "RetroAchievements synced",
          description:
            "Imported 128 achievements across Castlevania: Symphony of the Night, Chrono Trigger, Final Fantasy VI and Super Metroid. Progress for 3 games is still being processed.",
        })
      }
    />
  ),
};

export const CustomContent: Story = {
  render: () => (
    <ToastDemo
      label="Follow user"
      onClick={() =>
        toast.success({
          content: (
            <p style={{ textAlign: "center" }}>
              You now follow <strong>moonwalker</strong>
            </p>
          ),
        })
      }
    />
  ),
};
