import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Dropdown } from "./Dropdown";

const platforms = [
  "PC (Microsoft Windows)",
  "PlayStation 5",
  "Xbox Series X|S",
  "Nintendo Switch",
  "PlayStation 4",
  "Steam Deck",
];

const genres = [
  "Action",
  "Adventure",
  "Arcade",
  "Card & Board Game",
  "Fighting",
  "Hack and slash",
  "Indie",
  "Platform",
  "Puzzle",
  "Racing",
  "Role-playing (RPG)",
  "Shooter",
  "Simulator",
  "Strategy",
  "Visual Novel",
];

const meta = {
  title: "Shared/Dropdown",
  component: Dropdown,
  args: { list: platforms },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320, minHeight: 380 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Dropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTitle: Story = {
  args: { title: "Platform", placeholder: "Select platform..." },
};

export const Selected: Story = { args: { initialValue: "Nintendo Switch" } };

export const WithReset: Story = {
  args: { initialValue: "Steam Deck", isWithReset: true },
};

export const Multi: Story = {
  args: {
    title: "Genres",
    list: genres,
    isMulti: true,
    isWithAll: true,
    initialMultiValue: [0, 6],
  },
};

export const WithExclude: Story = {
  args: {
    title: "Genres",
    list: genres,
    isMulti: true,
    isWithExclude: true,
    isWithReset: true,
    initialMultiValue: [1],
    initialExcludeValue: [14],
  },
};

export const WithSearch: Story = {
  args: { title: "Genre", list: genres, isWithSearch: true },
};

export const WithInput: Story = {
  args: {
    title: "Developer",
    list: ["Team Cherry", "FromSoftware", "Supergiant Games"],
    isWithInput: true,
  },
};

export const Compact: Story = { args: { isCompact: true } };

export const BorderThemes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--gap-x4)" }}>
      <Dropdown {...args} title="Default" borderTheme="default" />
      <Dropdown {...args} title="Included" borderTheme="green" />
      <Dropdown {...args} title="Excluded" borderTheme="red" />
    </div>
  ),
};

export const Disabled: Story = {
  args: { initialValue: "PlayStation 5", isDisabled: true },
};

export const Loading: Story = { args: { title: "Platform", isLoading: true } };

export const Empty: Story = { args: { title: "Platform", list: [] } };

export const ThroughPortal: Story = {
  args: { title: "Category", isThroughPortal: true },
  render: (args) => (
    <div style={{ height: 120, overflow: "hidden" }}>
      <Dropdown
        {...args}
        list={[
          "Playing",
          "Completed",
          "Played",
          "Dropped",
          "Wishlist",
          "Backlog",
        ]}
      />
    </div>
  ),
};
