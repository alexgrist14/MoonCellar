import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Image from "next/image";
import { SortableEditor } from "./SortableEditor";

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

interface ISortableEditorDemoProps {
  isBusy?: boolean;
  note?: string;
  emptySlots?: number;
}

const SortableEditorDemo = (props: ISortableEditorDemoProps) => {
  const [saved, setSaved] = useState(games);
  const [draft, setDraft] = useState(games);

  return (
    <div style={{ maxWidth: 720 }}>
      <SortableEditor
        {...props}
        items={draft}
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
        onChange={setDraft}
        coverRatio="var(--cover-ratio)"
        onCancel={() => setDraft(saved)}
        onSave={() => setSaved(draft)}
      />
    </div>
  );
};

const meta = {
  title: "Shared/SortableEditor",
  component: SortableEditorDemo,
} satisfies Meta<typeof SortableEditorDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomNote: Story = {
  args: {
    note: "Drag or use the arrows to reorder. The first 5 are shown on your profile.",
  },
};

export const Busy: Story = { args: { isBusy: true } };

export const WithoutNote: Story = { args: { note: "" } };

export const WithEmptySlots: Story = { args: { emptySlots: 2 } };
