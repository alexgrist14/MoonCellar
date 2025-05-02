module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    "header-min-length": [2, "always", 5],
    "no-russian-letters": [2, "always"],
  },
  plugins: [
    {
      rules: {
        "no-russian-letters": ({ header }) => {
          const hasRussian = /[а-яА-ЯёЁ]/.test(header);
          return [
            !hasRussian,
            "Commit message must do not contain russian letters",
          ];
        },
      },
    },
  ],
};
