import type { Preview } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModalsConnector } from "@/src/lib/shared/ui/Modal/ModalsConnector";
import "@/src/lib/app/styles/reset.scss";
import "@/src/lib/app/styles/root.scss";
import "./fonts.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const preview: Preview = {
  parameters: {
    layout: "padded",
    backgrounds: { disable: true },
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div
          style={{
            minHeight: "100vh",
            padding: "var(--padding-x5)",
            color: "var(--color-text-primary)",
            background: "var(--color-bg-secondary)",
          }}
        >
          <Story />
        </div>
        <ModalsConnector />
        <div id="expand-connector" />
        <div id="pagination-connector" />
        <div id="dropdown-connector" />
        <div id="tooltip-connector" />
      </QueryClientProvider>
    ),
  ],
};

export default preview;
