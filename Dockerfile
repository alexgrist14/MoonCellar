FROM oven/bun:latest
WORKDIR /app

COPY ./package*.json ./
COPY ./bun.lock*.json ./
RUN bun ci

COPY . .
COPY ./.env .env
RUN bun run build

EXPOSE 3111
CMD ["bun", "run", "start"]
