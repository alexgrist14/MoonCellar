import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ComponentType, useState } from "react";
import { ISvgBaseProps } from "./Svg/Svg";
import * as Icons from ".";
import { SvgBurger } from "./SvgBurger";

type IIconProps = ISvgBaseProps & { value?: number; fillPercent?: number };

const icons = Object.entries(Icons)
  .filter(([name]) => name.startsWith("Svg") && name !== "Svg")
  .sort(([a], [b]) => a.localeCompare(b)) as [
  string,
  ComponentType<IIconProps>,
][];

const IconsGrid = () => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
      gap: "var(--gap-x4)",
    }}
  >
    {icons.map(([name, Icon]) => (
      <div
        key={name}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--gap-x2)",
          padding: "var(--padding-x3)",
          borderRadius: "var(--radius-x4)",
          background: "var(--color-bg-secondary)",
        }}
      >
        <Icon size="24" value={7} fillPercent={50} />
        <span
          style={{
            fontSize: 12,
            color: "var(--color-text-muted)",
            overflowWrap: "anywhere",
            textAlign: "center",
          }}
        >
          {name}
        </span>
      </div>
    ))}
  </div>
);

const meta = {
  title: "Shared/Icons",
  component: IconsGrid,
} satisfies Meta<typeof IconsGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const All: Story = {};

const BurgerToggle = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <button
      type="button"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      style={{ background: "none", border: 0, cursor: "pointer" }}
      onClick={() => setIsOpen((prev) => !prev)}
    >
      <SvgBurger size="40" isOpen={isOpen} />
    </button>
  );
};

export const BurgerClosed: Story = {
  render: () => <SvgBurger size="40" />,
};

export const BurgerOpen: Story = {
  render: () => <SvgBurger size="40" isOpen />,
};

export const BurgerAnimated: Story = {
  render: () => <BurgerToggle />,
};
