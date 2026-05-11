FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

CMD ["node", "server.js"]
