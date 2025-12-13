FROM node:25-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
COPY ./.env .env
RUN npm run build

FROM node:25-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.next .next
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/.env .env
COPY --from=builder /app/public ./public

EXPOSE 3111
CMD ["npm", "run", "start"]
