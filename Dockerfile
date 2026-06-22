FROM oven/bun:latest as builder
WORKDIR /app

COPY ./MoonCellar/package*.json ./
RUN bun ci

COPY ./MoonCellar/. .
COPY ./.env .env
RUN bun run build

FROM oven/bun:latest AS runner
WORKDIR /app

COPY --from=builder /app/.next .next
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/.env .env
COPY --from=builder /app/public ./public

EXPOSE 3111
CMD ["bun", "run", "start"]
