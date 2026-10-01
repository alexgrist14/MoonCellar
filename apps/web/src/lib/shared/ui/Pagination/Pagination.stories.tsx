import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Pagination } from "./Pagination";

const PaginationDemo = ({
  total,
  take,
  initialPage = 1,
  isFixed,
  isDisabled,
  isWithoutSummary,
}: {
  total: number;
  take: number;
  initialPage?: number;
  isFixed?: boolean;
  isDisabled?: boolean;
  isWithoutSummary?: boolean;
}) => {
  const [page, setPage] = useState(initialPage);

  return (
    <Pagination
      total={total}
      take={take}
      page={page}
      onPageChange={setPage}
      isFixed={isFixed}
      isDisabled={isDisabled}
      isWithoutSummary={isWithoutSummary}
    />
  );
};

const meta = {
  title: "Shared/Pagination",
  component: PaginationDemo,
  args: { total: 1284, take: 30 },
} satisfies Meta<typeof PaginationDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

export const WithoutSummary: Story = { args: { isWithoutSummary: true } };

export const LastPage: Story = { args: { initialPage: 43 } };

export const Disabled: Story = { args: { isDisabled: true } };

export const Fixed: Story = { args: { isFixed: true } };

export const Uncontrolled: Story = {
  render: ({ total, take }) => <Pagination total={total} take={take} />,
};
