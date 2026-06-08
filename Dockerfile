# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for node-gyp and other native modules
RUN apk add --no-cache python3 make g++

# Copy package files (including package-lock.json)
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install ALL dependencies (ignoring scripts to avoid prisma error)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Set dummy envs for prisma generate (Prisma 7 requirement)
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ARG DIRECT_URL="postgresql://user:pass@localhost:5432/db"
ARG CLERK_WEBHOOK_SECRET="dummy"

ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL
ENV CLERK_WEBHOOK_SECRET=$CLERK_WEBHOOK_SECRET

# Generate Prisma Client manually
RUN npm run prisma:generate

# Build the application
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy essential files for production install
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install production dependencies ONLY
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

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
