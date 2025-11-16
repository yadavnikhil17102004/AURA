#!/bin/bash
# AURA 2.0 Functional Verification Script
# Runs complete test battery for production readiness

# Don't exit on error - we want to report all failures
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
    echo -e "${YELLOW}▶ $1${NC}"
}

pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
    ((TOTAL++))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
    ((TOTAL++))
}

wait_for_server() {
    local retries=30
    while [ $retries -gt 0 ]; do
        if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
            return 0
        fi
        sleep 0.5
        ((retries--))
    done
    return 1
}

# Start verification
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════╗"
echo "║   AURA 2.0 FUNCTIONAL VERIFICATION SUITE     ║"
echo "╚═══════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# 1. PRE-FLIGHT CHECKS
# ============================================
print_header "1. Pre-flight Setup"

print_test "Checking essential files..."
REQUIRED_FILES=("server.js" "discovery.js" "mcp-agent-simulator.js" "agent-registry.json" "package.json" ".env")
FILES_OK=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file missing"
        FILES_OK=false
    fi
done

if [ "$FILES_OK" = true ]; then
    pass "All essential files present"
else
    fail "Missing required files"
fi

print_test "Checking .env configuration..."
if [ -f ".env" ]; then
    if grep -q "API_KEY" .env 2>/dev/null && grep -q "API_PROVIDER" .env 2>/dev/null; then
        pass ".env file properly configured"
    else
        fail ".env missing required keys"
    fi
else
    fail ".env file not found"
fi

print_test "Checking node_modules..."
if [ -d "node_modules" ]; then
    pass "Dependencies installed"
else
    fail "node_modules not found - run npm install"
    exit 1
fi

# ============================================
# 2. SERVER BOOT TEST
# ============================================
print_header "2. Server Boot Test"

print_test "Starting AURA server..."
npm start > /tmp/aura-boot.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
sleep 3

if wait_for_server; then
    pass "Server started successfully on port 8000"
else
    fail "Server failed to start within timeout"
    echo "Boot log:"
    cat /tmp/aura-boot.log | tail -20
    kill $SERVER_PID 2>/dev/null || true
    pkill -f "node server.js" 2>/dev/null || true
    exit 1
fi

print_test "Checking boot logs..."
if grep -q "AURA Server Started Successfully" /tmp/aura-boot.log; then
    pass "Server boot message present"
else
    fail "Server boot message not found"
fi

# ============================================
# 3. API HEALTH TESTS
# ============================================
print_header "3. API Health Tests"

print_test "Testing /api/health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/api/health)
if echo "$HEALTH_RESPONSE" | jq -e '.status == "ok"' > /dev/null 2>&1; then
    pass "Health endpoint returns OK"
else
    fail "Health endpoint malformed or failed"
fi

print_test "Testing /api/config endpoint..."
CONFIG_RESPONSE=$(curl -s http://localhost:8000/api/config)
if echo "$CONFIG_RESPONSE" | jq -e '.API_PROVIDER' > /dev/null 2>&1; then
    pass "Config endpoint returns valid configuration"
else
    fail "Config endpoint malformed or failed"
fi

print_test "Testing /api/agents endpoint..."
AGENTS_RESPONSE=$(curl -s http://localhost:8000/api/agents)
if echo "$AGENTS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    AGENT_COUNT=$(echo "$AGENTS_RESPONSE" | jq '.agents | length')
    pass "Agents endpoint returns $AGENT_COUNT agent(s)"
else
    fail "Agents endpoint malformed or failed"
fi

# ============================================
# 4. AGENT COMMAND BUS TEST
# ============================================
print_header "4. Agent Command Bus Test"

print_test "Sending ping command to LocalSimulator..."
PING_RESPONSE=$(curl -s -X POST http://localhost:8000/api/agents/LocalSimulator/command \
    -H "Content-Type: application/json" \
    -d '{"command":"ping"}')

if echo "$PING_RESPONSE" | jq -e '.success == true and .result == "pong"' > /dev/null 2>&1; then
    pass "Agent command bus operational (ping → pong)"
else
    fail "Agent command failed or returned unexpected result"
    echo "Response: $PING_RESPONSE"
fi

print_test "Sending echo command to LocalSimulator..."
ECHO_RESPONSE=$(curl -s -X POST http://localhost:8000/api/agents/LocalSimulator/command \
    -H "Content-Type: application/json" \
    -d '{"command":"echo","args":{"text":"AURA 2.0 verification"}}')

if echo "$ECHO_RESPONSE" | jq -e '.result == "AURA 2.0 verification"' > /dev/null 2>&1; then
    pass "Agent echo command successful"
else
    fail "Agent echo command failed"
fi

# ============================================
# 5. KNOWLEDGE GRAPH TESTS
# ============================================
print_header "5. Knowledge Graph Tests"

print_test "Creating test entity..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:8000/api/mcp/tool/create_entities \
    -H "Content-Type: application/json" \
    -d '{"entities":[{"name":"VerificationTest","entityType":"test","observations":["Created during verification"]}]}')

if echo "$CREATE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    pass "Entity creation successful"
else
    fail "Entity creation failed"
fi

print_test "Adding observation to entity..."
OBS_RESPONSE=$(curl -s -X POST http://localhost:8000/api/mcp/tool/add_observations \
    -H "Content-Type: application/json" \
    -d '{"observations":[{"entityName":"VerificationTest","contents":["Additional test observation"]}]}')

if echo "$OBS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    pass "Observation addition successful"
else
    fail "Observation addition failed"
fi

print_test "Querying knowledge graph..."
QUERY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/mcp/tool/query_graph \
    -H "Content-Type: application/json" \
    -d '{"query":"VerificationTest"}')

if echo "$QUERY_RESPONSE" | jq -e '.success == true and .result.count > 0' > /dev/null 2>&1; then
    pass "Graph query successful (found test entity)"
else
    fail "Graph query failed or entity not found"
    echo "Response: $QUERY_RESPONSE" | jq '.'
fi

print_test "Reading full graph..."
READ_RESPONSE=$(curl -s -X POST http://localhost:8000/api/mcp/tool/read_graph \
    -H "Content-Type: application/json" \
    -d '{}')

if echo "$READ_RESPONSE" | jq -e '.success == true and .result.graph.entities' > /dev/null 2>&1; then
    ENTITY_COUNT=$(echo "$READ_RESPONSE" | jq '.result.graph.entities | length')
    pass "Graph read successful ($ENTITY_COUNT entities)"
else
    fail "Graph read failed"
    echo "Response: $READ_RESPONSE" | jq '.'
fi

# ============================================
# 6. PERSISTENCE VERIFICATION
# ============================================
print_header "6. Persistence Verification"

print_test "Stopping server to test persistence..."
kill -SIGINT $SERVER_PID 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
sleep 3

print_test "Checking graph-data.json..."
if [ -f "graph-data.json" ]; then
    SAVED_ENTITIES=$(jq '.entities | length' graph-data.json)
    pass "Graph persisted to disk ($SAVED_ENTITIES entities saved)"
else
    fail "graph-data.json not created"
fi

print_test "Restarting server..."
npm start > /tmp/aura-restart.log 2>&1 &
SERVER_PID=$!
sleep 3

if wait_for_server; then
    pass "Server restarted successfully"
else
    fail "Server failed to restart"
    echo "Restart log:"
    cat /tmp/aura-restart.log | tail -20
    exit 1
fi

print_test "Verifying data persistence..."
RELOAD_RESPONSE=$(curl -s -X POST http://localhost:8000/api/mcp/tool/query_graph \
    -H "Content-Type: application/json" \
    -d '{"query":"VerificationTest"}')

if echo "$RELOAD_RESPONSE" | jq -e '.success == true and .result.count > 0' > /dev/null 2>&1; then
    pass "Data persisted and restored successfully"
else
    fail "Data not restored after restart"
    echo "Response: $RELOAD_RESPONSE" | jq '.'
fi

# ============================================
# 7. DOCKER MCP TESTS
# ============================================
print_header "7. Docker MCP Tests"

print_test "Testing Docker info endpoint..."
DOCKER_RESPONSE=$(curl -s http://localhost:8000/api/mcp/docker/info)
if echo "$DOCKER_RESPONSE" | jq -e '.docker' > /dev/null 2>&1; then
    DOCKER_AVAILABLE=$(echo "$DOCKER_RESPONSE" | jq -r '.docker.available')
    if [ "$DOCKER_AVAILABLE" = "true" ]; then
        pass "Docker is available and accessible"
    else
        echo -e "${YELLOW}⚠ WARN${NC}: Docker not available (this is OK for local dev)"
        ((TOTAL++))
    fi
else
    fail "Docker info endpoint failed"
fi

print_test "Testing MCP servers list..."
SERVERS_RESPONSE=$(curl -s http://localhost:8000/api/mcp/servers)
if echo "$SERVERS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    pass "MCP servers endpoint operational"
else
    fail "MCP servers endpoint failed"
fi

# ============================================
# 8. CLEANUP
# ============================================
print_header "8. Graceful Shutdown Test"

print_test "Sending shutdown signal..."
kill -SIGINT $SERVER_PID 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
sleep 3

print_test "Checking for zombie processes..."
if pgrep -f "node server.js" > /dev/null; then
    fail "Server process still running (zombie)"
    pkill -9 -f "node server.js"
else
    pass "Server shutdown cleanly"
fi

print_test "Verifying final graph save..."
if [ -f "graph-data.json" ]; then
    pass "Final graph state saved"
else
    fail "Graph not saved on shutdown"
fi

# ============================================
# SUMMARY
# ============================================
print_header "Verification Summary"

echo ""
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo -e "Total Tests: $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✓ AURA 2.0 IS PRODUCTION-READY             ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ✗ VERIFICATION FAILED - FIX ISSUES ABOVE    ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════╝${NC}"
    exit 1
fi
