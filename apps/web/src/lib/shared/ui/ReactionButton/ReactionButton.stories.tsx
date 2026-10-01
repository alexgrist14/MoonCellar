import { CSSProperties, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SvgHeart, SvgHeartFilled, SvgReply, SvgThumb } from "../svg";
import { ReactionButton } from "./ReactionButton";

const meta = {
  title: "Shared/ReactionButton",
  component: ReactionButton,
  args: {
    icon: <SvgThumb size="16" />,
    label: "Helpful",
    count: 12,
    onClick: () => {},
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["ghost", "boxed"] },
  },
} satisfies Meta<typeof ReactionButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = { args: { isActive: true } };

export const ReadOnly: Story = { args: { isReadOnly: true } };

export const Disabled: Story = { args: { isDisabled: true } };

export const IconAndCount: Story = {
  args: { icon: <SvgHeart size="16" />, label: undefined, ariaLabel: "Like" },
};

export const WithoutCount: Story = {
  args: { icon: <SvgReply size="16" />, label: "Reply", count: undefined },
};

const ToggleDemo = ({ variant }: { variant: "ghost" | "boxed" }) => {
  const [state, setState] = useState({ isLiked: false, count: 3 });

  return (
    <ReactionButton
      variant={variant}
      icon={<SvgHeart size="16" />}
      activeIcon={<SvgHeartFilled size="16" />}
      count={state.count}
      isActive={state.isLiked}
      tooltip={state.isLiked ? "Unlike" : "Like"}
      onClick={() =>
        setState((current) => ({
          isLiked: !current.isLiked,
          count: current.count + (current.isLiked ? -1 : 1),
        }))
      }
    />
  );
};

export const Toggle: Story = { render: () => <ToggleDemo variant="ghost" /> };

export const Boxed: Story = { render: () => <ToggleDemo variant="boxed" /> };

export const BoxedCustomColor: Story = {
  args: {
    variant: "boxed",
    isActive: true,
    icon: <SvgHeart size="16" />,
    activeIcon: <SvgHeartFilled size="16" />,
    label: undefined,
    ariaLabel: "Unlike",
  },
  render: (args) => (
    <div
      style={
        { "--reaction-active-color": "var(--favorite-color)" } as CSSProperties
      }
    >
      <ReactionButton {...args} />
    </div>
  ),
};
