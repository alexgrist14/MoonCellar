import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Chip } from "./Chip";

const meta = {
  title: "Shared/Chip",
  component: Chip,
  args: { children: "Role-playing (RPG)" },
  argTypes: {
    variant: { control: "inline-radio", options: ["filled", "outlined"] },
  },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Outlined: Story = { args: { variant: "outlined" } };

export const InternalLink: Story = {
  args: { href: "/games?genres=Platform", children: "Platform" },
};

export const ExternalLink: Story = {
  args: {
    href: "https://store.steampowered.com/app/367520",
    title: "https://store.steampowered.com/app/367520",
    isExternal: true,
    variant: "outlined",
    children: "store.steampowered.com",
  },
};

export const LongText: Story = {
  args: {
    children:
      "A very long keyword that describes a procedurally generated open world with survival mechanics",
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 240 }}>
        <Story />
      </div>
    ),
  ],
};

export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--gap-x2)" }}>
      {[
        "Metroidvania",
        "Pixel art",
        "Soulslike",
        "Hand-drawn",
        "Difficult",
        "Atmospheric",
      ].map((tag) => (
        <Chip key={tag} href={`/games?keywords=${tag}`}>
          {tag}
        </Chip>
      ))}
    </div>
  ),
};

export const Removable: Story = { args: { onRemove: () => {} } };

export const RemovableLink: Story = {
  args: { href: "/games?genres=Platform", onRemove: () => {} },
};

export const RemovableDisabled: Story = {
  args: { onRemove: () => {}, isDisabled: true },
};
