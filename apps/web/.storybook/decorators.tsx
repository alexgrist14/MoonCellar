import type { Decorator } from "@storybook/nextjs-vite";

export const asModal: Decorator = (Story) => (
  <div style={{ width: "fit-content", maxWidth: "100%" }}>
    <Story />
  </div>
);
