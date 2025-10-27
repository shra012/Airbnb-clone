FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run prisma:generate && npm prune --omit=dev
ENV NODE_ENV=production \
    PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --spider -q http://localhost:4000/health || exit 1

CMD ["node", "src/server.js"]
