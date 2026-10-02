import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ITableHeaders, ITableRows } from "@/src/lib/shared/types/table.type";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { Table } from "./Table";

interface IGameRow {
  name: string;
  platform: string;
  status: string;
  rating: string;
  hours: string;
}

const games = [
  {
    name: "Hollow Knight",
    platform: "PC",
    status: "Completed",
    rating: 95,
    hours: 42,
  },
  {
    name: "Celeste",
    platform: "Nintendo Switch",
    status: "Mastered",
    rating: 92,
    hours: 31,
  },
  {
    name: "Elden Ring",
    platform: "PlayStation 5",
    status: "Playing",
    rating: 96,
    hours: 118,
  },
  {
    name: "Disco Elysium",
    platform: "PC",
    status: "Completed",
    rating: 91,
    hours: 36,
  },
  {
    name: "Hades",
    platform: "Steam Deck",
    status: "Played",
    rating: 93,
    hours: 64,
  },
  {
    name: "Outer Wilds",
    platform: "Xbox Series X|S",
    status: "Dropped",
    rating: 88,
    hours: 9,
  },
];

const headers: ITableHeaders<IGameRow> = {
  name: { content: "Game" },
  platform: { content: "Platform" },
  status: { content: "Status" },
  rating: { content: "Rating" },
  hours: { content: "Hours" },
};

const buildRows = (onClick?: () => void): ITableRows<IGameRow> =>
  games.map((game) => {
    const cell = (content: string, sortingValue?: number) => ({
      content,
      sortingValue,
      onClick,
      style: onClick ? { cursor: "pointer" } : undefined,
    });

    return {
      name: cell(game.name),
      platform: cell(game.platform),
      status: cell(game.status),
      rating: cell(`${game.rating}%`, game.rating),
      hours: cell(`${game.hours} h`, game.hours),
    };
  });

const columnStyles = {
  name: { width: "220px", minWidth: "160px" },
  platform: { width: "180px", minWidth: "140px" },
};

const meta = {
  title: "Shared/Table",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Table
      headers={headers}
      rows={buildRows()}
      columnStyles={columnStyles}
      initialSortingKey="rating"
    />
  ),
};

export const Paginated: Story = {
  render: () => (
    <Table
      headers={headers}
      rows={buildRows()}
      columnStyles={columnStyles}
      initialSortingKey="rating"
      limit={3}
    />
  ),
};

export const ClickableRows: Story = {
  render: () => (
    <Table
      headers={headers}
      rows={buildRows(() => {})}
      columnStyles={columnStyles}
    />
  ),
};

export const RowClick: Story = {
  render: () => (
    <Table
      headers={headers}
      rows={buildRows()}
      columnStyles={columnStyles}
      initialSortingKey="rating"
      rowClickExcludeKeys={["status"]}
      onRowClick={(index) => alert(games[index].name)}
    />
  ),
};

export const ServerSorting: Story = {
  render: () => (
    <Table
      headers={headers}
      rows={buildRows()}
      columnStyles={columnStyles}
      sortingCallback={() => {}}
    />
  ),
};

export const Loading: Story = {
  render: () => <Table headers={headers} rows={buildRows()} isLoading />,
};

export const Empty: Story = {
  render: () => <Table headers={headers} rows={[]} />,
};

export const WithoutRows: Story = {
  render: () => <Table headers={headers} rows={undefined} />,
};

export const ZeroAndMissingValues: Story = {
  render: () => (
    <Table
      headers={headers}
      initialSortingKey="hours"
      rows={buildRows().map((row, i) => ({
        ...row,
        hours:
          i === 0
            ? { content: "0 h", sortingValue: 0 }
            : i === 1
              ? { content: "—", sortingValue: null }
              : row.hours,
      }))}
    />
  ),
};

export const Mobile: Story = {
  beforeEach: () => {
    useStatesStore.setState({ isMobile: true });

    return () => useStatesStore.setState({ isMobile: false });
  },
  render: () => (
    <Table
      headers={headers}
      rows={buildRows()}
      mobileHeadField="name"
      onRowClick={(index) => alert(games[index].name)}
    />
  ),
};

export const WithoutSorting: Story = {
  render: () => (
    <Table
      headers={headers}
      rows={buildRows()}
      columnStyles={columnStyles}
      isWithoutSorting
    />
  ),
};

export const DimmedRows: Story = {
  render: () => (
    <Table
      headers={headers}
      rows={buildRows()}
      columnStyles={columnStyles}
      getRowClassName={(_, index) =>
        games[index].status === "Dropped" ? "story-dimmed" : undefined
      }
    />
  ),
  decorators: [
    (Story) => (
      <>
        <style>{".story-dimmed { opacity: 0.45; }"}</style>
        <Story />
      </>
    ),
  ],
};

interface IDiffRow {
  field: string;
  current: string;
  proposed: string;
}

export const RowLayout: Story = {
  render: () => (
    <Table<IDiffRow>
      layout="rows"
      isWithoutSorting
      columnStyles={{
        field: { width: "max-content", minWidth: "120px" },
        current: { minWidth: "200px" },
        proposed: { minWidth: "200px" },
      }}
      headers={{
        field: { content: "Field" },
        current: { content: "Current" },
        proposed: { content: "Proposed" },
      }}
      rows={[
        {
          field: { content: "Name" },
          current: { content: "Hollow Knight" },
          proposed: { content: "Hollow Knight: Voidheart Edition" },
        },
        {
          field: { content: "Summary" },
          current: {
            content:
              "Forge your own path in Hollow Knight, an epic action adventure through a vast ruined kingdom of insects and heroes. Explore twisting caverns, battle tainted creatures and befriend bizarre bugs.",
          },
          proposed: { content: "A shorter summary." },
        },
        {
          field: { content: "Platforms" },
          current: { content: "PC" },
          proposed: {
            content:
              "PC, Nintendo Switch, PlayStation 4, Xbox One, macOS, Linux",
          },
        },
      ]}
    />
  ),
};
