import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { Button, ButtonColor } from "../Button";
import { Textarea } from "../Textarea";
import { ActionsMenu, IActionsMenuPanel } from "./ActionsMenu";

const meta = {
  title: "Shared/ActionsMenu",
  component: ActionsMenu,
  args: {
    items: [
      { label: "Edit", onClick: fn() },
      { label: "Open on the site", onClick: fn() },
      { label: "Delete", onClick: fn(), isDanger: true },
    ],
  },
} satisfies Meta<typeof ActionsMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = { args: { label: "Actions" } };

export const WithDisabledItem: Story = {
  args: {
    items: [
      { label: "Edit", onClick: fn() },
      { label: "Ban user", onClick: fn(), isDisabled: true },
      { label: "Delete", onClick: fn(), isDanger: true },
    ],
  },
};

export const Disabled: Story = { args: { isDisabled: true } };

export const WithLinks: Story = {
  args: {
    items: [
      { label: "Profile", href: "/user/demo" },
      { label: "Open on IGDB", href: "https://www.igdb.com", isExternal: true },
      { label: "Logout", onClick: fn(), isDanger: true },
    ],
  },
};

export const CustomTrigger: Story = {
  args: {
    title: "demo",
    isNavigation: true,
    renderTrigger: ({ ref, isOpen, toggle }) => (
      <Button
        ref={ref}
        type="button"
        color={ButtonColor.TRANSPARENT}
        aria-label="Account menu"
        aria-expanded={isOpen}
        active={isOpen}
        onClick={toggle}
      >
        Avatar
      </Button>
    ),
    items: [
      { label: "Profile", href: "/user/demo" },
      { label: "Settings", href: "/user/demo/settings" },
      { label: "Logout", onClick: fn(), isDanger: true },
    ],
  },
};

const PromptForm = ({
  back,
  close,
}: Parameters<IActionsMenuPanel["render"]>[0]) => {
  const [value, setValue] = useState("A moonlit cellar");

  return (
    <div style={{ display: "grid", gap: "var(--gap-x2)" }}>
      <Textarea
        value={value}
        rows={4}
        onChange={(event) => setValue(event.target.value)}
      />
      <div style={{ display: "flex", gap: "var(--gap-x2)" }}>
        <Button type="button" onClick={back}>
          Back
        </Button>
        <Button
          type="button"
          color={ButtonColor.ACCENT}
          disabled={!value.trim()}
          onClick={close}
        >
          Generate
        </Button>
      </div>
    </div>
  );
};

export const WithPanel: Story = {
  args: {
    items: [
      { label: "Upload to S3", onClick: fn() },
      {
        label: "Regenerate…",
        panel: {
          title: "Regenerate",
          width: "360px",
          render: (controls) => <PromptForm {...controls} />,
        },
      },
      { label: "Delete", onClick: fn(), isDanger: true },
    ],
  },
};

export const WithSearch: Story = {
  args: {
    label: "27 games not in the catalogue",
    width: "320px",
    searchPlaceholder: "Search games",
    items: [
      "Starbound - Unstable",
      "Pirates of Black Cove Gold",
      "Battlerite Public Test",
      "The Ship Tutorial",
      "Grand Theft Auto: Vice City",
      "Skullgirls ∞Endless Beta∞",
      "Arma 2: Operation Arrowhead Beta (Obsolete)",
      "Commander: Conquest of the Americas Gold",
      "Wreckfest Throw-A-Santa + Sneak Peek 2.0",
      "Magicka 2: Spell Balance Beta",
      "Steep Open Beta",
      "Rust - Staging Branch",
      "Miscreated: Experimental Server",
      "Lossless Scaling",
      "Vindictus: Defying Fate Playtest",
    ].map((label, index) => ({
      label,
      href: `https://store.steampowered.com/app/${index + 1}`,
      isExternal: true,
    })),
  },
};
