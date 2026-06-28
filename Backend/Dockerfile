FROM node:20-alpine

WORKDIR /app

# Install dependencies first (leverages Docker layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Install Puppeteer dependencies for social scraping
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy source code
COPY . .

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/ || exit 1

CMD ["node", "app.js"]
