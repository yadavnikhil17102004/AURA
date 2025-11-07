#!/bin/bash

# AURA MCP Docker Bridge Setup Script
# Automatically sets up and runs the MCP Docker Bridge

set -e

echo "🚀 AURA MCP Docker Bridge Setup"
echo "================================"
echo ""

# Get the directory this script is in
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📍 Working directory: $SCRIPT_DIR"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker from https://www.docker.com/"
    exit 1
fi

echo "✅ Docker found: $(docker --version)"
echo ""

# Check if Docker daemon is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "✅ Docker daemon is running"
echo ""

# Count MCP images
MCP_COUNT=$(docker images | grep -c mcp || true)
echo "📦 Found $MCP_COUNT MCP Docker images"
docker images | grep mcp | awk '{print "   - " $1 ":" $2}' || true
echo ""

# Ask for port
read -p "Enter port for MCP Bridge (default: 3000): " PORT
PORT=${PORT:-3000}

# Check if port is in use
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "⚠️  Port $PORT is already in use!"
    EXISTING=$(lsof -i :$PORT -sTCP:LISTEN | tail -1 | awk '{print $1}')
    echo "Process: $EXISTING"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🔧 Configuration:"
echo "  - Port: $PORT"
echo "  - Directory: $SCRIPT_DIR"
echo ""

# Option to run in foreground or background
echo "How would you like to run the bridge?"
echo "1. Foreground (see logs in terminal)"
echo "2. Background (detached)"
read -p "Choice (1-2, default: 1): " RUN_MODE
RUN_MODE=${RUN_MODE:-1}

echo ""

if [ "$RUN_MODE" = "2" ]; then
    echo "🚀 Starting MCP Docker Bridge in background..."
    MCP_BRIDGE_PORT=$PORT nohup node mcp-docker-bridge.js > mcp-bridge.log 2>&1 &
    BRIDGE_PID=$!
    echo "✅ Bridge started with PID: $BRIDGE_PID"
    echo "📝 Logs: $SCRIPT_DIR/mcp-bridge.log"
    echo ""
    echo "View logs: tail -f mcp-bridge.log"
    echo "Stop: kill $BRIDGE_PID"
else
    echo "🚀 Starting MCP Docker Bridge..."
    MCP_BRIDGE_PORT=$PORT node mcp-docker-bridge.js
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open index.html in your browser"
echo "2. Check browser console (F12) for: ✅ Docker Bridge detected"
echo "3. View available MCP servers"
echo ""
echo "📚 Documentation: DOCKER_AUTO_CONFIG_GUIDE.md"
