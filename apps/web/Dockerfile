FROM oven/bun:latest
WORKDIR /app
ENV HUSKY=0

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/schemas/package.json packages/schemas/
RUN bun install --frozen-lockfile

ADD https://git.io/GeoLite2-Country.mmdb /app/geo/GeoLite2-Country.mmdb

COPY . .
RUN bun --filter '@mooncellar/schemas' build && bun --filter web build

WORKDIR /app/apps/web
EXPOSE 3111
CMD ["bun", "run", "start"]
