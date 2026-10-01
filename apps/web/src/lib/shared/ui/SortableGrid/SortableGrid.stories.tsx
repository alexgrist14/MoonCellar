import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Image from "next/image";
import { SortableGrid } from "./SortableGrid";

interface IGame {
  id: string;
  name: string;
  cover: string;
}

const games: IGame[] = [
  { id: "1", name: "Hollow Knight", cover: "/images/cover.png" },
  { id: "2", name: "Elden Ring", cover: "/images/moon.jpg" },
  { id: "3", name: "Celeste", cover: "/images/moon2.jpg" },
  { id: "4", name: "Disco Elysium: The Final Cut", cover: "/images/moon3.jpg" },
];

interface ISortableGridDemoProps {
  emptySlots?: number;
  isDisabled?: boolean;
  isRemovable?: boolean;
}

const SortableGridDemo = (props: ISortableGridDemoProps) => {
  const [items, setItems] = useState(games);

  return (
    <div style={{ maxWidth: 720 }}>
      <SortableGrid
        {...props}
        items={items}
        getKey={(game) => game.id}
        getName={(game) => game.name}
        renderCover={(game) => (
          <Image
            src={game.cover}
            alt=""
            fill
            sizes="160px"
            style={{ objectFit: "cover" }}
          />
        )}
        onChange={setItems}
        coverRatio="var(--cover-ratio)"
      />
    </div>
  );
};

const meta = {
  title: "Shared/SortableGrid",
  component: SortableGridDemo,
} satisfies Meta<typeof SortableGridDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithEmptySlots: Story = { args: { emptySlots: 2 } };

export const NotRemovable: Story = { args: { isRemovable: false } };

export const Disabled: Story = { args: { isDisabled: true } };
