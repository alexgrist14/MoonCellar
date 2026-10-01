import { ComponentProps, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ISearchPickerOption, SearchPicker } from "./SearchPicker";

const games: ISearchPickerOption[] = [
  {
    id: "1",
    label: "Hollow Knight",
    meta: "2017 · PC, Switch",
    image: "/images/cover.png",
  },
  {
    id: "2",
    label: "Hollow Knight: Silksong",
    meta: "2025 · PC, Switch",
    image: "/images/moon.jpg",
  },
  { id: "3", label: "Hollow Cocoon", meta: "2024 · PC", image: null },
];

const SearchPickerDemo = (props: ComponentProps<typeof SearchPicker>) => {
  const [search, setSearch] = useState(props.search);
  const [picked, setPicked] = useState<string>();
  const options = props.options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div style={{ display: "grid", gap: "var(--gap-x3)", maxWidth: 420 }}>
      <SearchPicker
        {...props}
        search={search}
        onSearch={setSearch}
        options={options}
        onPick={(option) => {
          setPicked(option.label);
          setSearch("");
        }}
      />
      {!!picked && <span>Picked: {picked}</span>}
    </div>
  );
};

const meta = {
  title: "Shared/SearchPicker",
  component: SearchPicker,
  args: {
    label: "Main game (for a DLC, expansion or edition)",
    placeholder: "Search the main game",
    search: "",
    options: games,
    onSearch: () => {},
    onPick: () => {},
  },
  render: (args) => <SearchPickerDemo {...args} />,
} satisfies Meta<typeof SearchPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithResults: Story = { args: { search: "hollow" } };

export const Loading: Story = {
  args: { search: "silk", options: [], isLoading: true },
};

export const NothingFound: Story = {
  args: { search: "zzzz", options: [] },
};

export const Disabled: Story = {
  args: { label: "Game", placeholder: "Pick a relation first", disabled: true },
};
