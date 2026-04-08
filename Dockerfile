FROM node:22-slim

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=7860
ENV LANGGRAPH_PORT=7860
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

# Install building dependencies + Playwright system deps
RUN apt-get update && apt-get install -y python3 make g++ curl \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies (only what's needed for production)
COPY package.json yarn.lock* ./
RUN yarn install --production=false --network-timeout 100000

# Install Playwright Chromium browser (needed for screenshot node)
RUN npx playwright install chromium

# Copy application code
COPY . .

# Ensure script is executable
RUN chmod +x start.sh

# HF expects port 7860
EXPOSE 7860

# Use start script
CMD ["/bin/bash", "./start.sh"]
