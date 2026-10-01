FROM oven/bun:latest AS build
WORKDIR /app
ENV HUSKY=0

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/schemas/package.json packages/schemas/
RUN bun install --frozen-lockfile

COPY . .
ARG BUILD
RUN sh -c "$BUILD"

FROM nginx:alpine
ARG OUT
ARG PORT
COPY --from=build /app/${OUT} /usr/share/nginx/html
RUN printf 'server {\n  listen %s;\n  root /usr/share/nginx/html;\n  location / { try_files $uri $uri.html $uri/ =404; }\n}\n' "$PORT" \
  > /etc/nginx/conf.d/default.conf
EXPOSE ${PORT}
