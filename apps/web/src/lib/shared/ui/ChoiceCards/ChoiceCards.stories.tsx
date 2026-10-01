import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SvgCrown, SvgRandom, SvgStar } from "../svg";
import { ChoiceCards, IChoiceCardOption } from "./ChoiceCards";

const OPTIONS: IChoiceCardOption<string>[] = [
  {
    value: "single",
    title: "Single",
    text: "One spin over the whole catalogue",
    icon: <SvgRandom />,
    meta: (
      <>
        <b>10 000</b> games
      </>
    ),
  },
  {
    value: "knockout",
    title: "Knock-out",
    text: "Eliminate one entry per round",
    icon: <SvgCrown />,
    meta: (
      <>
        <b>5</b> entries
      </>
    ),
    tone: "attention",
  },
];

const meta = {
  title: "Shared/ChoiceCards",
  component: ChoiceCards,
  args: {
    options: OPTIONS,
    value: "single",
    ariaLabel: "Mode",
    onChange: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChoiceCards>;

export default meta;

type Story = StoryObj<typeof meta>;

const ControlledCards = ({
  options = OPTIONS,
}: {
  options?: IChoiceCardOption<string>[];
}) => {
  const [value, setValue] = useState(options[0].value);

  return (
    <ChoiceCards
      ariaLabel="Mode"
      options={options}
      value={value}
      onChange={setValue}
    />
  );
};

export const Default: Story = { render: () => <ControlledCards /> };

export const SecondSelected: Story = { args: { value: "knockout" } };

export const WithoutMeta: Story = {
  render: () => (
    <ControlledCards
      options={OPTIONS.map(({ meta: _meta, ...option }) => option)}
    />
  ),
};

export const MissingMeta: Story = {
  args: {
    options: [OPTIONS[0], { ...OPTIONS[1], meta: undefined }],
  },
};

export const WithoutIcons: Story = {
  render: () => (
    <ControlledCards
      options={OPTIONS.map(({ icon: _icon, ...option }) => option)}
    />
  ),
};

export const DisabledOption: Story = {
  render: () => (
    <ControlledCards
      options={[
        ...OPTIONS,
        {
          value: "rated",
          title: "Top rated",
          text: "Available after rating five games",
          icon: <SvgStar />,
          isDisabled: true,
        },
      ]}
    />
  ),
};

export const Disabled: Story = { args: { isDisabled: true } };
