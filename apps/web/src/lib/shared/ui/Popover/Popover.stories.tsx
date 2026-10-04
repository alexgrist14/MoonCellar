import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ComponentProps, useRef, useState } from "react";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { Button, ButtonColor } from "../Button";
import { Input } from "../Input";
import { Popover } from "./Popover";

type IPopoverDemoProps = Partial<ComponentProps<typeof Popover>> & {
  label?: string;
};

const actions = ["Edit list", "Share link", "Duplicate", "Delete list"];

const PopoverDemo = ({ label = "Manage", ...props }: IPopoverDemoProps) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: props.align === "end" ? "flex-end" : "flex-start",
      }}
    >
      <Button
        ref={anchorRef}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {label}
      </Button>
      <Popover
        width="220px"
        contentStyle={{ padding: "var(--padding-x2)" }}
        {...props}
        anchorRef={anchorRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        {props.children ?? (
          <div style={{ display: "grid", gap: "var(--gap-x1)" }}>
            {actions.map((action) => (
              <Button
                key={action}
                color={
                  action === "Delete list"
                    ? ButtonColor.RED
                    : ButtonColor.TRANSPARENT
                }
                onClick={() => setIsOpen(false)}
              >
                {action}
              </Button>
            ))}
          </div>
        )}
      </Popover>
    </div>
  );
};

const meta = {
  title: "Shared/Popover",
  component: Popover,
  args: {
    children: null,
    anchorRef: { current: null },
    isOpen: false,
    onClose: () => {},
  },
  beforeEach: () => {
    useStatesStore.setState({ isMobile: false });
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <PopoverDemo />,
};

export const AlignEnd: Story = {
  render: () => <PopoverDemo align="end" />,
};

export const WithTitle: Story = {
  render: () => (
    <PopoverDemo label="About" title="Hollow Knight" width="300px">
      <p>
        Forge your own path in Hollow Knight, an action adventure through a vast
        ruined kingdom of insects and heroes.
      </p>
    </PopoverDemo>
  ),
};

export const MobileSheet: Story = {
  beforeEach: () => {
    useStatesStore.setState({ isMobile: true });

    return () => useStatesStore.setState({ isMobile: false });
  },
  render: () => <PopoverDemo title="Manage list" />,
};

export const MobileSheetUntitled: Story = {
  beforeEach: () => {
    useStatesStore.setState({ isMobile: true });

    return () => useStatesStore.setState({ isMobile: false });
  },
  render: () => <PopoverDemo />,
};

const results = [
  "Hollow Knight",
  "Hollow Knight: Silksong",
  "Hades",
  "Celeste",
];

const AnchoredListbox = ({ reservedHeight }: { reservedHeight?: number }) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const matches = results.filter((name) =>
    name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div ref={anchorRef} style={{ width: "320px" }}>
      <Input
        value={search}
        placeholder="Search for a game…"
        aria-label="Search for a game"
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <Popover
        anchorRef={anchorRef}
        isOpen={search.trim().length > 0}
        onClose={() => setSearch("")}
        matchAnchorWidth
        isSheetDisabled
        reservedHeight={reservedHeight}
        contentStyle={{ padding: "var(--padding-x1)" }}
      >
        <div role="listbox">
          {matches.map((name) => (
            <div key={name} role="option" aria-selected={false}>
              {name}
            </div>
          ))}
        </div>
      </Popover>
    </div>
  );
};

export const AnchoredSearch: Story = {
  render: () => <AnchoredListbox />,
};

export const AnchoredSearchReservedHeight: Story = {
  render: () => (
    <div style={{ paddingTop: "320px" }}>
      <AnchoredListbox reservedHeight={2000} />
    </div>
  ),
};

export const AnchoredSearchOnMobile: Story = {
  beforeEach: () => {
    useStatesStore.setState({ isMobile: true });

    return () => useStatesStore.setState({ isMobile: false });
  },
  render: () => <AnchoredListbox />,
};
