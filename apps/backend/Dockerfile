FROM oven/bun:1

WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock turbo.json ./

# Copy all apps
COPY apps ./apps/

# Install dependencies
RUN bun install

# Generate prisma client for backend
WORKDIR /app/apps/backend
RUN bunx prisma generate

EXPOSE 3000

CMD ["bun", "src/index.ts"]
