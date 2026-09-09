FROM oven/bun:latest
WORKDIR /app

COPY ./package*.json ./
COPY ./bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
COPY ./.env .env
RUN bun run build

EXPOSE 3228
CMD ["bun", "run", "start"]
