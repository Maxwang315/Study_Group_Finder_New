# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies needed for building the TypeScript server
FROM base AS deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install

# Build the TypeScript sources
FROM base AS build
WORKDIR /app/server
COPY --from=deps /app/server/node_modules ./node_modules
COPY server/tsconfig.json ./tsconfig.json
COPY server/src ./src
RUN npm run build

# Install only production dependencies
FROM base AS production-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev

# Runtime image
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-deps /app/server/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY server/package.json ./package.json
COPY client ./client

EXPOSE 3001

CMD ["node", "dist/app.js"]
