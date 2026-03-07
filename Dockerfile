# 1. Use the official Playwright image (Noble is Ubuntu 24.04)
# This image comes with all browser dependencies pre-installed.
FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# 2. Copy package files and install dependencies
COPY package.json yarn.lock* ./
RUN yarn install

# 3. Copy application files
COPY src ./src
COPY langgraph.json .
COPY pyproject.toml .
COPY README.md .

# 5. Expose the port
EXPOSE 54367

# 6. Start the LangGraph server
CMD ["npx", "@langchain/langgraph-cli", "dev", "--host", "0.0.0.0", "--port", "54367"]
