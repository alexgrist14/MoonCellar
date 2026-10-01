import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button, ButtonColor } from "../Button";
import { Scrollbar } from "../Scrollbar";
import { Box } from "./Box";

const paragraph =
  "Hollow Knight is a challenging 2D action-adventure. Explore twisting caverns, ancient cities and deadly wastes, battle tainted creatures and befriend bizarre bugs.";

const meta = {
  title: "Shared/Box",
  component: Box,
  args: { children: <p>{paragraph}</p> },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Box>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTitle: Story = { args: { title: "Summary" } };

export const WithTitleCount: Story = {
  args: { title: "Characters", titleCount: 24, isTitleStart: true },
};

export const WithNodeTitle: Story = {
  args: {
    title: (
      <>
        Reviews <em style={{ color: "var(--color-text-muted)" }}>beta</em>
      </>
    ),
  },
};

export const WithClose: Story = {
  args: { title: "Characters", onClose: () => {} },
};

export const WithTitleAction: Story = {
  args: {
    title: "Reviews",
    titleAction: (
      <Button type="button" compact color={ButtonColor.ACCENT}>
        Write a review
      </Button>
    ),
  },
};

export const HeaderOutside: Story = {
  args: { title: "Browse by platform", isHeaderWithoutStyles: true },
};

export const Scrollable: Story = {
  args: {
    title: "Storyline",
    isWithScrollBar: true,
    contentStyle: { maxHeight: 160 },
    children: Array.from({ length: 6 }, (_, i) => <p key={i}>{paragraph}</p>),
  },
};

export const FillsContainer: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480, height: 280 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    title: "Search results",
    wrapperStyle: { height: "100%" },
    templateStyle: { height: "100%", minHeight: 0 },
    children: (
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Scrollbar type="absolute" contentStyle={{ maxHeight: "100%" }}>
          {Array.from({ length: 6 }, (_, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </Scrollbar>
      </div>
    ),
  },
};

export const Borderless: Story = {
  args: { title: "Links", isWithoutBorder: true, isWithBlur: true },
};
