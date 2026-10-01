import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../Button";
import { EmojiPicker } from "./EmojiPicker";

const EmojiPickerDemo = () => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [text, setText] = useState("GG ");

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "var(--gap-x3)" }}
    >
      <Button
        ref={anchorRef}
        type="button"
        aria-label="Insert emoji"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        😀
      </Button>
      <span>{text}</span>
      {isOpen && (
        <EmojiPicker
          anchorRef={anchorRef}
          onSelect={(emoji) => setText((current) => current + emoji)}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

const meta = {
  title: "Shared/EmojiPicker",
  component: EmojiPicker,
  render: () => <EmojiPickerDemo />,
} satisfies Meta<typeof EmojiPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { anchorRef: { current: null }, onSelect: () => {}, onClose: () => {} },
};
