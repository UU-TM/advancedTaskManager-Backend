FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

FROM base AS build

COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM base AS production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/src/generated ./src/generated

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:migrate && npm run start:prod"]

FROM base AS test

COPY . .
RUN npm run prisma:generate

CMD ["sh", "-c", "npm run prisma:migrate && npm run test:e2e"]
