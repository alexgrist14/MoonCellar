import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Dropdown } from "../Dropdown";
import { Input } from "../Input";
import { ToggleSwitch } from "../ToggleSwitch";
import { FilterGroup } from "./FilterGroup";

const meta = {
  title: "Shared/FilterGroup",
  component: FilterGroup,
  args: {
    title: "Game name",
    children: <Input placeholder="Enter name of the game..." />,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FilterGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const ModeToggle = () => {
  const [isAll, setIsAll] = useState(false);

  return (
    <ToggleSwitch
      isColorless
      leftContent="Any"
      rightContent="All"
      value={isAll ? "right" : "left"}
      clickCallback={() => setIsAll((current) => !current)}
    />
  );
};

export const WithHeaderAction: Story = {
  args: {
    title: "Genres",
    headerAction: <ModeToggle />,
    children: (
      <Dropdown
        isMulti
        isWithReset
        list={["Adventure", "Platform", "Puzzle", "Role-playing (RPG)"]}
      />
    ),
  },
};

export const Stacked: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--gap-x5)" }}>
      <FilterGroup title="Game name">
        <Input placeholder="Enter name of the game..." />
      </FilterGroup>
      <FilterGroup title="Genres" headerAction={<ModeToggle />}>
        <Dropdown isMulti list={["Adventure", "Platform", "Puzzle"]} />
      </FilterGroup>
    </div>
  ),
};
