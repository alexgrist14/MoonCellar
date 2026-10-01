import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../Button";
import { AuthModal, openAuthModal } from "./AuthModal";
import { asModal } from "@/.storybook/decorators";

const meta = {
  title: "Shared/AuthModal",
  component: AuthModal,
  decorators: [asModal],
} satisfies Meta<typeof AuthModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

export const InModal: Story = {
  render: () => <Button onClick={() => openAuthModal()}>Sign in</Button>,
};
