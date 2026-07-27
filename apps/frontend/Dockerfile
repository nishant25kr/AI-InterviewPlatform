# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps ./apps/
RUN bun install

WORKDIR /app/apps/frontend

# Provide Vite variables at build time
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN bun run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
