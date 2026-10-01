import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef } from "react";
import { ResizeHandle } from "./ResizeHandle";

const ResizablePanel = ({ isCentered }: { isCentered?: boolean }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isCentered ? "center" : "flex-start",
      }}
    >
      <div
        ref={panelRef}
        style={{
          position: "relative",
          width: "var(--resize-width, 320px)",
          height: "var(--resize-height, 240px)",
          padding: "var(--padding-x4)",
          borderRadius: "var(--radius-x5)",
          border: "1px solid var(--color-border-primary)",
          background: "var(--color-bg-secondary)",
        }}
      >
        <p>Drag the bottom-right corner to resize this panel.</p>
        <ResizeHandle targetRef={panelRef} isCentered={isCentered} />
      </div>
    </div>
  );
};

const meta = {
  title: "Shared/ResizeHandle",
  component: ResizeHandle,
  args: { targetRef: { current: null } },
} satisfies Meta<typeof ResizeHandle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ResizablePanel />,
};

export const Centered: Story = {
  render: () => <ResizablePanel isCentered />,
};
