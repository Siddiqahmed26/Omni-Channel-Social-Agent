FROM node:20-bookworm

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    libgbm-dev \
    libnss3 \
    libasound2 \
    libxss1 \
    libxtst6 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock* ./
RUN yarn install

# Copy the rest of the application
COPY . .

# Install Playwright browsers (as specified in langgraph.json)
RUN npx -y playwright@1.58.2 install --with-deps

# Expose the port LangGraph uses
EXPOSE 54367

# Start the LangGraph server
CMD ["npx", "@langchain/langgraph-cli", "dev", "--host", "0.0.0.0", "--port", "54367"]
