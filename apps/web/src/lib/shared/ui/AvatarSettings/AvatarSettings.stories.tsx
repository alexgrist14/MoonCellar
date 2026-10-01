import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import type { IUser } from "@/src/lib/shared/types/auth.type";
import { AvatarSettings } from "./AvatarSettings";

const profile = {
  _id: "64f0c0ffee0000000000001",
  userName: "moonwalker",
  email: "moonwalker@example.com",
  avatar: "",
} as IUser;

const AvatarSettingsDemo = () => {
  const [tempAvatar, setTempAvatar] = useState<File>();

  return (
    <AvatarSettings tempAvatar={tempAvatar} setTempAvatar={setTempAvatar} />
  );
};

const meta = {
  title: "Shared/AvatarSettings",
  component: AvatarSettings,
  render: () => <AvatarSettingsDemo />,
} satisfies Meta<typeof AvatarSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: () => {
    useAuthStore.setState({ profile });
  },
};

export const WithAvatar: Story = {
  beforeEach: () => {
    useAuthStore.setState({
      profile: { ...profile, avatar: "/images/helen.png" },
    });
  },
};

export const Loading: Story = {
  beforeEach: () => {
    useAuthStore.setState({ profile: undefined });
  },
};
