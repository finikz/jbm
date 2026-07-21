FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig.json ./
RUN npm install && npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
COPY dist ./dist/
COPY ../shared/dist ./shared-dist/
RUN npm install --omit=dev && npx prisma generate

EXPOSE 3001
CMD ["node", "dist/index.js"]
