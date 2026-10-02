import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ImageFinder } from "./ImageFinder";

const IMAGES = [
  "/images/moon.jpg",
  "/images/moon2.jpg",
  "/images/moon3.jpg",
  "/images/peakpx.jpg",
  "/images/auth-background.webp",
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const searchImages = async () => {
  await delay(600);
  return IMAGES;
};

const searchPaged = async (_query: string, page: number) => {
  await delay(600);
  return page > 3 ? [] : IMAGES.map((url) => `${url}?page=${page}`);
};

const searchNothing = async () => {
  await delay(600);
  return [];
};

const ImageFinderDemo = ({
  isMultiple,
  isPortrait,
  onSearch = searchImages,
}: {
  isMultiple?: boolean;
  isPortrait?: boolean;
  onSearch?: (query: string, page: number) => Promise<string[]>;
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <ImageFinder
      label={isPortrait ? "Find cover" : "Find screenshots"}
      defaultQuery="Hollow Knight"
      onSearch={onSearch}
      selected={selected}
      onChange={setSelected}
      isMultiple={isMultiple}
      isPortrait={isPortrait}
      emptyText="Nothing found. Check the game name or add its Steam page."
    />
  );
};

const meta = {
  title: "Shared/ImageFinder",
  component: ImageFinder,
  args: {
    label: "Find screenshots",
    defaultQuery: "Hollow Knight",
    onSearch: searchImages,
    selected: [],
    onChange: () => {},
  },
} satisfies Meta<typeof ImageFinder>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = { render: () => <ImageFinderDemo /> };

export const Multiple: Story = {
  render: () => <ImageFinderDemo isMultiple />,
};

export const Portrait: Story = {
  render: () => <ImageFinderDemo isPortrait />,
};

export const ShowMore: Story = {
  render: () => <ImageFinderDemo onSearch={searchPaged} />,
};

export const NothingFound: Story = {
  render: () => <ImageFinderDemo onSearch={searchNothing} />,
};

export const Disabled: Story = { args: { isDisabled: true } };
