# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for node-gyp and other native modules
RUN apk add --no-cache python3 make g++

# Copy package files (including package-lock.json)
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client (with dummy envs to avoid build errors)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ENV DIRECT_URL="postgresql://user:pass@localhost:5432/db"
ENV CLERK_WEBHOOK_SECRET="dummy"
RUN npm run prisma:generate

# Build the application
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies ONLY
RUN npm ci --omit=dev && npm cache clean --force

# Copy build artifacts and prisma client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
