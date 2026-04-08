#!/bin/bash

# Production Port Synchronization
PUBLIC_PORT=7860
INTERNAL_PORT=7861

export PORT=$PUBLIC_PORT
export LANGGRAPH_PORT=$INTERNAL_PORT

# FORCE OpenAI as the model provider — overrides any HF Space secret
# This must be set BEFORE the LangGraph process starts
export MODEL_PROVIDER=openai

echo "=========================================="
echo "    OMNI AGENT DUAL-BOOT (v64 OPENAI_FORCED)"
echo "=========================================="
echo "Public Entry:   7860"
echo "Internal Core:  7861"
echo "Model Profile:  GPT-4o-mini (OpenAI)"

# 1. Start Main LangGraph Server in background
echo "🚀 BOOTING LangGraph Engine on $INTERNAL_PORT..."
./node_modules/.bin/langgraphjs dev --host 0.0.0.0 --port "$INTERNAL_PORT" &

# 2. Give the engine a head start
sleep 2

# 3. Start Health Proxy as the Main Process
echo "📡 BOOTING Health Proxy on $PUBLIC_PORT..."
exec node proxy.js
