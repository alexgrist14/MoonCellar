FROM oven/bun:latest
WORKDIR /app

COPY ./package*.json ./
COPY ./bun.lock ./
RUN bun ci

ADD https://git.io/GeoLite2-Country.mmdb /app/geo/GeoLite2-Country.mmdb

COPY . .
COPY ./.env .env
RUN bun run build

EXPOSE 3111
CMD ["bun", "run", "start"]
