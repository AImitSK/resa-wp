FROM node:20-slim

# Puppeteer/Chromium-Abhängigkeiten installieren
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Platzhalter Express-Server für spätere PDF-API
COPY server.js /app/server.js
COPY package.json /app/package.json

RUN npm install --production

EXPOSE 3000

CMD ["node", "server.js"]
