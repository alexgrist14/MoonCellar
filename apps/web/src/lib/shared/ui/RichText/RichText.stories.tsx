import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Box } from "../Box";
import { RichText } from "./RichText";

const meta = {
  title: "Shared/RichText",
  component: RichText,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Box>
          <Story />
        </Box>
      </div>
    ),
  ],
} satisfies Meta<typeof RichText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Paragraphs: Story = {
  args: {
    content:
      "<p>Finally beat Malenia after two evenings of trying.</p><p>The second phase is brutal, but the bleed build carried me through.</p>",
  },
};

export const Formatting: Story = {
  args: {
    content:
      "<p><strong>Verdict:</strong> one of the best <em>metroidvanias</em> I have played.</p><ul><li>Tight controls</li><li>Gorgeous hand-drawn art</li><li>Some <s>unfair</s> demanding bosses</li></ul><blockquote>Hornet is the real hero.</blockquote><p>Status<br/>Console<br/>Date</p>",
  },
};

export const WithImage: Story = {
  args: {
    content:
      '<p>My setup for the final run:</p><p><img src="/images/moon.jpg" alt="Screenshot" /></p>',
  },
};

export const Empty: Story = { args: { content: "" } };

export const PrimaryTone: Story = {
  args: {
    tone: "primary",
    content:
      "<p>Beat it on hard, every optional boss down. Took the true ending route.</p>",
  },
};
