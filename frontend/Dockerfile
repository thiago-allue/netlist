# frontend/Dockerfile
#
# Multi-stage build:
#  1) builder – install deps & run Vite build
#  2) nginx   – serve the static files
#

# ---------- builder stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package manifests and install dependencies.
COPY package*.json ./
RUN npm ci

# Copy rest of the source and build it.
COPY . .
RUN npm run build

# ---------- runtime stage ----------
FROM nginx:alpine

# Copy built assets into nginx public dir.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD [\"nginx\", \"-g\", \"daemon off;\"]
