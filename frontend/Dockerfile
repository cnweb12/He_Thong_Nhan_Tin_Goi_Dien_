# ========================================
# Stage 1: Base - Cài đặt dependencies
# ========================================
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ========================================
# Stage 2: Development
# ========================================
FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ========================================
# Stage 3: Builder - Build bản production
# ========================================
FROM base AS builder
ARG VITE_API_BASE_URL
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
COPY . .
RUN npm run build

# ========================================
# Stage 4: Production - Phục vụ file bằng Nginx
# ========================================
FROM nginx:alpine AS production
# Thay thế cấu hình default của Nginx bằng cấu hình hỗ trợ SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*
# Copy các file build tĩnh từ stage builder sang thư mục của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
