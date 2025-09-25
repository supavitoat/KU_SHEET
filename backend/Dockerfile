FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies (including dev for prisma generate), then prune
COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Reduce image size for runtime
RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]




