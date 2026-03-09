FROM node:22-slim

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=7860
ENV LANGGRAPH_PORT=7860
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

# Install building dependencies
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*

# Install dependencies (only what's needed for production)
COPY package.json yarn.lock* ./
RUN yarn install --production=false --network-timeout 100000

# Copy application code
COPY . .

# Ensure script is executable
RUN chmod +x start.sh

# HF expects port 7860
EXPOSE 7860

# Use start script
CMD ["/bin/bash", "./start.sh"]
