import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReactNode } from "react";
import { Button } from "../Button";
import { DRAWER_TRIGGER_ATTRIBUTE, drawer } from "./drawer.api";
import { DrawerConnector } from "./DrawerConnector";

const review =
  "Hollow Knight is a sprawling, melancholic metroidvania. Hallownest rewards patience: every bench is a small victory, and every new ability reframes areas you thought you had finished. The combat is tight, the bosses are memorable, and the soundtrack carries the whole descent.";

const DrawerDemo = ({
  label,
  title,
  content,
}: {
  label: string;
  title: string;
  content: ReactNode;
}) => (
  <>
    <Button
      {...{ [DRAWER_TRIGGER_ATTRIBUTE]: "" }}
      onClick={() => drawer.open(content, { title })}
    >
      {label}
    </Button>
    <DrawerConnector />
  </>
);

const meta = {
  title: "Shared/Drawer",
  component: DrawerConnector,
} satisfies Meta<typeof DrawerConnector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DrawerDemo
      label="Read review"
      title="Review by moonwalker"
      content={<p>{review}</p>}
    />
  ),
};

export const LongContent: Story = {
  render: () => (
    <DrawerDemo
      label="Show characters"
      title="Characters"
      content={
        <div style={{ display: "grid", gap: "var(--gap-x3)" }}>
          {Array.from({ length: 40 }, (_, i) => (
            <p key={i}>
              {
                ["The Knight", "Hornet", "Quirrel", "Zote the Mighty", "Cloth"][
                  i % 5
                ]
              }{" "}
              #{i + 1}
            </p>
          ))}
        </div>
      }
    />
  ),
};
