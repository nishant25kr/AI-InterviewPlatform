FROM oven/bun:1

WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock turbo.json ./

# Copy all apps
COPY apps ./apps/

# Install dependencies
RUN bun install

# Generate prisma client for wss
WORKDIR /app/apps/wss
RUN bunx prisma generate

EXPOSE 8080

CMD ["bun", "index.ts"]
