# syntax=docker/dockerfile:1.4
# Build Next.js static export
FROM node:22-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source and assets
COPY . .

# Ensure logo is in public for Next.js
RUN mkdir -p public && [ -f logo.jpg ] && cp logo.jpg public/ || true

# Build static export (output: 'export' -> out/)
# NEXT_PUBLIC_SITE_URL برای X-Store-Host در generateStaticParams (مثلاً tokan.app)
ARG NEXT_PUBLIC_API_BASE=https://api.tokan.app
ARG NEXT_PUBLIC_SITE_URL=tokan.app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
RUN npm run build

# Production: nginx serves static files
FROM nginx:alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/out /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
