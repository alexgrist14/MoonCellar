FROM oven/bun:latest
WORKDIR /app
ENV HUSKY=0

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/schemas/package.json packages/schemas/
RUN bun install --frozen-lockfile

COPY . .
RUN bun --filter '@mooncellar/schemas' build && bun --filter api build

WORKDIR /app/apps/api
EXPOSE 3228
CMD ["bun", "run", "start"]
