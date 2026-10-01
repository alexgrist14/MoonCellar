import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ITableRows } from "@/src/lib/shared/types/table.type";
import { MobileTable } from "./MobileTable";

type IPlaythroughRow = {
  name: string;
  platform: string;
  status: string;
  date: string;
  time: string;
};

const games: [string, string, string, string, number][] = [
  ["Hollow Knight", "PC (Microsoft Windows)", "Completed", "2024-03-12", 42],
  ["Chrono Trigger", "Super Nintendo", "Completed", "2023-11-02", 23],
  ["Elden Ring", "PlayStation 5", "Playing", "2025-01-20", 96],
  ["Celeste", "Nintendo Switch", "Dropped", "2022-07-15", 9],
  ["Disco Elysium", "PC (Microsoft Windows)", "Wishlist", "2025-06-01", 0],
  ["Persona 5 Royal", "PlayStation 4", "Played", "2021-09-30", 110],
];

const makeRows = (count: number): ITableRows<IPlaythroughRow> =>
  Array.from({ length: count }, (_, i) => {
    const [name, platform, status, date, time] = games[i % games.length];
    const title = i < games.length ? name : `${name} (${i + 1})`;

    return {
      name: { title: "Game", content: title, sortingValue: title },
      platform: { title: "Platform", content: platform },
      status: { title: "Status", content: status },
      date: { title: "Date", content: date, sortingValue: date },
      time: { title: "Time", content: `${time}h`, sortingValue: time },
    };
  });

const meta = {
  title: "Shared/MobileTable",
  component: MobileTable<IPlaythroughRow>,
  args: { rows: makeRows(6), mobileHeadField: "name" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileTable<IPlaythroughRow>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SortedByDate: Story = { args: { initialSortingKey: "date" } };

export const WithoutSorting: Story = { args: { isWithoutMobileSorting: true } };

export const Paginated: Story = { args: { rows: makeRows(14), limit: 5 } };

export const RowClick: Story = {
  args: {
    initialSortingKey: "date",
    onRowClick: (index) => alert(games[index % games.length][0]),
  },
};

export const Loading: Story = { args: { isLoading: true } };

export const Empty: Story = { args: { rows: [] } };

export const WithoutRows: Story = { args: { rows: undefined } };

export const SortedByTime: Story = { args: { initialSortingKey: "time" } };

export const DimmedRows: Story = {
  args: {
    getRowClassName: (row) =>
      row.status.content === "Dropped" ? "story-dimmed" : undefined,
  },
  decorators: [
    (Story) => (
      <>
        <style>{".story-dimmed { opacity: 0.45; }"}</style>
        <Story />
      </>
    ),
  ],
};
