# 1. Use the official Playwright image (Noble is Ubuntu 24.04)
# This image comes with all browser dependencies pre-installed.
FROM mcr.microsoft.com/playwright:v1.55.1-noble

WORKDIR /app

# 2. Copy package files and install dependencies
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# 3. Copy the application folders explicitly (ensures they are not skipped)
COPY src ./src
COPY scripts ./scripts
COPY static ./static
COPY langgraph.json .
COPY pyproject.toml .
COPY README.md .

# DEBUG: Verify the copy (viewable in HF logs)
RUN ls -d src/agents/ingest-data
RUN ls -la src/agents/ingest-data/ingest-data-graph.ts

# 4. Install only Chromium (Saves time and space)
RUN npx playwright install chromium

# 5. Expose the port
EXPOSE 54367

# 6. Start the LangGraph server
CMD ["npx", "@langchain/langgraph-cli", "dev", "--host", "0.0.0.0", "--port", "54367"]
