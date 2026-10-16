FROM oven/bun:latest
WORKDIR /app
ENV HUSKY=0

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY apps/game/package.json apps/game/
COPY packages/schemas/package.json packages/schemas/
RUN bun install --frozen-lockfile

COPY . .
RUN bun --filter game build

WORKDIR /app/apps/game
EXPOSE 3229
CMD ["bun", "run", "start"]
