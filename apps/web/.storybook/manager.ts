import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

addons.setConfig({
  theme: create({
    base: "dark",
    brandTitle: "MoonCellar",
    brandImage: "/images/logo-text.png",
    brandTarget: "_self",
    colorPrimary: "#6951ee",
    colorSecondary: "#6951ee",
    appBg: "#191d24",
    appContentBg: "#212731",
  }),
});
