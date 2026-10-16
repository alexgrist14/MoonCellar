export const getCorsOrigins = () => [
  ...(process.env.LOCAL_CONNECTION?.split(",") || []),
  "https://mooncellar.space",
];
