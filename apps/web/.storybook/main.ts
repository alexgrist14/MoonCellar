import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs-vite",
    options: { nextConfigPath: join(appRoot, "next.config.mjs") },
  },
  core: { disableTelemetry: true },
  stories: ["../src/lib/shared/ui/**/*.stories.tsx"],
  staticDirs: ["../public"],
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: { ...viteConfig.resolve?.alias, "@": appRoot },
    },
    css: {
      ...viteConfig.css,
      preprocessorOptions: {
        scss: {
          loadPaths: [join(appRoot, "src/lib/app/styles")],
          additionalData: '@use "@/src/lib/app/styles/index.scss" as *;',
        },
      },
    },
  }),
};

export default config;
