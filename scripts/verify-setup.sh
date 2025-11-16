#!/bin/bash

# AURA MCP Docker System Verification
# Checks all components and reports status

echo "🔍 AURA MCP Docker System Verification"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter
CHECKS=0
PASSED=0

check_command() {
  local cmd=$1
  local name=$2
  
  CHECKS=$((CHECKS+1))
  
  if command -v $cmd &> /dev/null; then
    echo -e "${GREEN}✅${NC} $name installed"
    PASSED=$((PASSED+1))
    eval "${cmd} --version" 2>&1 | head -1 | sed 's/^/   /'
  else
    echo -e "${RED}❌${NC} $cmd not found - $name not installed"
  fi
  echo ""
}

check_port() {
  local port=$1
  
  CHECKS=$((CHECKS+1))
  
  if lsof -i :$port > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Port $port is open"
    PASSED=$((PASSED+1))
    lsof -i :$port | tail -1
  else
    echo -e "${YELLOW}⚠️${NC}  Port $port is available"
  fi
  echo ""
}

check_file() {
  local file=$1
  
  CHECKS=$((CHECKS+1))
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file exists"
    PASSED=$((PASSED+1))
    ls -lh "$file" | awk '{print "   " $9 " (" $5 ")"}'
  else
    echo -e "${RED}❌${NC} $file not found"
  fi
  echo ""
}

check_docker_images() {
  CHECKS=$((CHECKS+1))
  
  echo "🐳 Docker Images (MCP):"
  
  if command -v docker &> /dev/null; then
    count=$(docker images | grep -c mcp || echo 0)
    if [ $count -gt 0 ]; then
      echo -e "${GREEN}✅${NC} Found $count MCP images"
      PASSED=$((PASSED+1))
      docker images | grep mcp | awk '{print "   - " $1 ":" $2 " (" $3 ")"}'
    else
      echo -e "${YELLOW}⚠️${NC}  No MCP images found"
    fi
  else
    echo -e "${RED}❌${NC} Docker not available"
  fi
  echo ""
}

check_docker_running() {
  CHECKS=$((CHECKS+1))
  
  if docker ps > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Docker daemon is running"
    PASSED=$((PASSED+1))
  else
    echo -e "${RED}❌${NC} Docker daemon is not running"
  fi
  echo ""
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "📍 Checking in: $SCRIPT_DIR"
echo ""

# Check required commands
echo -e "${BLUE}System Requirements${NC}"
echo "========================"
check_command "node" "Node.js"
check_command "npm" "npm"
check_command "docker" "Docker"
check_command "jq" "jq (JSON parser)"

# Check Docker
echo -e "${BLUE}Docker Status${NC}"
echo "========================"
check_docker_running
check_docker_images

# Check required files
echo -e "${BLUE}AURA Files${NC}"
echo "========================"
check_file "$SCRIPT_DIR/mcp-docker-bridge.js"
check_file "$SCRIPT_DIR/mcp-docker-autoconfig.js"
check_file "$SCRIPT_DIR/mcp-integration.js"
check_file "$SCRIPT_DIR/index.html"
check_file "$SCRIPT_DIR/setup-mcp-bridge.sh"
check_file "$SCRIPT_DIR/mcp-config.json"

# Check ports
echo -e "${BLUE}Port Availability${NC}"
echo "========================"
check_port 3000

# Check localhost access
CHECKS=$((CHECKS+1))
if curl -s http://localhost:3000/api/mcp/servers > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} MCP Bridge is running on localhost:3000"
  PASSED=$((PASSED+1))
  echo "   Current servers: $(curl -s http://localhost:3000/api/mcp/servers | jq '.total' 2>/dev/null || echo '?')"
else
  echo -e "${YELLOW}⚠️${NC}  MCP Bridge not running on localhost:3000"
  echo "   Run: node mcp-docker-bridge.js"
fi
echo ""

# Summary
echo -e "${BLUE}Summary${NC}"
echo "========================"
PERCENTAGE=$((PASSED * 100 / CHECKS))
echo "Checks passed: $PASSED / $CHECKS ($PERCENTAGE%)"
echo ""

if [ $PASSED -eq $CHECKS ]; then
  echo -e "${GREEN}✅ All systems go! Ready to use AURA MCP.${NC}"
  exit 0
elif [ $PASSED -gt $((CHECKS / 2)) ]; then
  echo -e "${YELLOW}⚠️  Most systems operational. Some optional components missing.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some critical components are missing.${NC}"
  exit 1
fi
