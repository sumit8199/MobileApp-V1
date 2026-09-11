# ----------------------------------------------------
# 1. Build Stage
# ----------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and tsconfigs
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies (including devDependencies needed for TypeScript build)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Compile TypeScript to dist/
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# ----------------------------------------------------
# 2. Production Stage
# ----------------------------------------------------
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5001

# Copy built application and production dependencies from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Copy data folder (used for fallback local data storage)
COPY data/ ./data/

# Expose the service port (Render will also provide PORT dynamically)
EXPOSE 5001

# Start the service
CMD ["npm", "start"]
