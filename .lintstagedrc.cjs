module.exports = {
  "apps/web/src/**/*.{ts,tsx,js,jsx}": () => "bun --filter web lint",
  "apps/api/src/**/*.ts": () => "bun --filter api lint",
  "apps/game/src/**/*.ts": () => "bun --filter game lint",
};
