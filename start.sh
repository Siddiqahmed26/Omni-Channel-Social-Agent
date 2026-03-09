#!/bin/bash

# Force port 7860
TARGET_PORT=7860
export PORT=$TARGET_PORT
export LANGGRAPH_PORT=$TARGET_PORT

echo "=========================================="
echo "      AGENT STARTUP (v34 HEARTBEAT)"
echo "=========================================="
echo "Date: $(date)"
echo "Port: $TARGET_PORT"
echo "Host: 0.0.0.0"
echo "Node: $(node -v)"
echo "Working Dir: $(pwd)"

# Background health monitor to provide diagnostic visibility
(
  while true; do
    sleep 30
    echo "🔍 DIAGNOSTIC: Checking port $TARGET_PORT..."
    if curl -s "http://localhost:$TARGET_PORT/info" > /dev/null; then
      echo "✅ HEARTBEAT: Server is responding on $TARGET_PORT"
    elif curl -s "http://localhost:$TARGET_PORT" > /dev/null; then
      echo "✅ HEARTBEAT: Server is listening on $TARGET_PORT (Root reached)"
    else
      echo "⚠️ HEARTBEAT: Server not responding on $TARGET_PORT yet..."
    fi
  done
) &

# Execute directly to ensure it gets PID 1
echo "🚀 EXCEPTIONALLY STABLE BOOT on $TARGET_PORT..."
exec ./node_modules/.bin/langgraphjs dev --host 0.0.0.0 --port "$TARGET_PORT"
