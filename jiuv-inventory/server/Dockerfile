FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY server/package*.json server/
COPY shared/package*.json shared/
RUN npm install
COPY server server
COPY shared shared
RUN npm run build:shared && cd server && npx prisma generate && cd .. && npm run build:server

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY server/package*.json server/
COPY shared/package*.json shared/
RUN npm install --omit=dev
COPY --from=builder /app/server/prisma server/prisma
COPY --from=builder /app/server/dist server/dist
COPY --from=builder /app/shared/dist shared/dist
WORKDIR /app/server
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "dist/index.js"]
