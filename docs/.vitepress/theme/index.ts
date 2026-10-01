import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import DocsIndex from "./DocsIndex.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("DocsIndex", DocsIndex);
  },
} satisfies Theme;
