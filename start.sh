#!/bin/bash

# Port Sync Protocol
PUBLIC_PORT=7860
INTERNAL_PORT=7861

export PORT=$PUBLIC_PORT
export LANGGRAPH_PORT=$INTERNAL_PORT

echo "=========================================="
echo "    OMNI AGENT DUAL-BOOT (v41 FINAL GREEN)"
echo "=========================================="
echo "Public Port:   $PUBLIC_PORT (README Metadata Matched)"
echo "Internal Port: $INTERNAL_PORT (LangGraph)"
echo "Node:          $(node -v)"

# 1. Start Main LangGraph Server in background
echo "🚀 Starting LangGraph Engine on $INTERNAL_PORT..."
./node_modules/.bin/langgraphjs dev --host 0.0.0.0 --port "$INTERNAL_PORT" &

# 2. Give the engine 3 seconds to bind
sleep 3

# 3. Start Health Proxy as the Main Process (PID 1)
echo "📡 Starting Health Proxy on $PUBLIC_PORT..."
exec node proxy.js
