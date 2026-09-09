import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    settings: {
      next: {
        rootDir: "src/",
      },
    },
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/immutability": "off",
    },
  },
];

export default eslintConfig;
