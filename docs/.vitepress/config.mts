import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const titleOf = (file: string) =>
  (
    readFileSync(join(docsRoot, file), "utf8").match(/^#\s+(.+)$/m)?.[1] ??
    file.replace(/\.md$/, "")
  ).replace(/`/g, "");

const DESCRIPTION_LENGTH = 180;

const descriptionOf = (file: string) => {
  const paragraph =
    readFileSync(join(docsRoot, file), "utf8")
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block && !/^(#|---|```|\||<|>|-\s)/.test(block)) ?? "";
  const text = paragraph
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*`_]/g, "")
    .replace(/\s+/g, " ");

  return text.length > DESCRIPTION_LENGTH
    ? `${text.slice(0, DESCRIPTION_LENGTH).replace(/\s+\S*$/, "")}…`
    : text;
};

const guides = readdirSync(docsRoot)
  .filter((file) => file.endsWith(".md") && file !== "index.md")
  .map((file) => ({
    text: titleOf(file),
    link: `/${file.replace(/\.md$/, "")}`,
    description: descriptionOf(file),
  }))
  .sort((a, b) => a.text.localeCompare(b.text));

export default defineConfig({
  title: "MoonCellar docs",
  description: "Architecture and operations notes for MoonCellar",
  srcExclude: ["mockups/**", "screenshots/**"],
  appearance: "force-dark",
  head: [["link", { rel: "icon", type: "image/png", href: "/images/logo-icon.png" }]],
  ignoreDeadLinks: true,
  cleanUrls: true,
  markdown: {
    attrs: { disable: true },
    config: (md) => {
      const renderInline = md.renderer.rules.code_inline!;

      md.renderer.rules.code_inline = (...args) =>
        renderInline(...args).replace("<code", "<code v-pre");
    },
  },
  themeConfig: {
    logo: { src: "/images/logo-text.png", alt: "MoonCellar" },
    siteTitle: false,
    nav: [{ text: "Storybook", link: "https://storybook.mooncellar.space" }],
    search: { provider: "local" },
    sidebar: [
      {
        text: "Docs",
        items: guides.map(({ text, link }) => ({ text, link })),
      },
    ],
    docs: guides,
  },
});
