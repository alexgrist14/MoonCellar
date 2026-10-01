import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { PaginationClient } from "./PaginationClient";

const GAMES = [
  "Hollow Knight",
  "Celeste",
  "Hades",
  "Disco Elysium",
  "Outer Wilds",
  "Dead Cells",
  "Stardew Valley",
  "Inside",
  "Return of the Obra Dinn",
  "Slay the Spire",
];

const TAKE = 4;

const PaginationClientDemo = ({
  length,
  isWithQuery,
}: {
  length: number;
  isWithQuery?: boolean;
}) => {
  const [page, setPage] = useState(1);

  return (
    <div>
      <ul>
        {GAMES.slice(0, Math.min(page * TAKE, length)).map((game) => (
          <li key={game}>{game}</li>
        ))}
      </ul>
      <PaginationClient
        take={TAKE}
        page={page}
        setPage={setPage}
        length={length}
        isWithQuery={isWithQuery}
      />
    </div>
  );
};

const meta = {
  title: "Shared/PaginationClient",
  component: PaginationClient,
  args: { take: TAKE, page: 1, setPage: () => {}, length: GAMES.length },
} satisfies Meta<typeof PaginationClient>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <PaginationClientDemo length={GAMES.length} />,
};

export const MiddlePage: Story = { args: { page: 2 } };

export const LastPage: Story = { args: { page: 3 } };

export const FitsOnePage: Story = { args: { length: 3 } };

export const WithQuery: Story = {
  render: () => <PaginationClientDemo length={GAMES.length} isWithQuery />,
};
