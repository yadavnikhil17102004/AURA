#!/bin/bash
# AURA Frontend-Backend Bridge Diagnostic
# Tests all API endpoints and simulates frontend calls

set +e  # Don't exit on errors

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════╗"
echo "║  AURA Frontend-Backend Bridge Diagnostic      ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"

PASSED=0
FAILED=0

pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ============================================
# 1. SERVER AVAILABILITY
# ============================================
echo ""
echo -e "${BLUE}━━━ 1. Server Availability ━━━${NC}"

if lsof -i :8000 > /dev/null 2>&1; then
    pass "Server is running on port 8000"
else
    fail "Server is NOT running on port 8000"
    warn "Run: npm start"
    exit 1
fi

# ============================================
# 2. CORE API ENDPOINTS
# ============================================
echo ""
echo -e "${BLUE}━━━ 2. Core API Endpoints ━━━${NC}"

# Health check
if curl -s http://localhost:8000/api/health | jq -e '.status == "ok"' > /dev/null 2>&1; then
    pass "GET /api/health → OK"
else
    fail "GET /api/health → FAILED"
fi

# Config endpoint
if curl -s http://localhost:8000/api/config | jq -e '.API_PROVIDER' > /dev/null 2>&1; then
    pass "GET /api/config → OK"
else
    fail "GET /api/config → FAILED"
fi

# Agents endpoint
if curl -s http://localhost:8000/api/agents | jq -e '.success' > /dev/null 2>&1; then
    pass "GET /api/agents → OK"
else
    fail "GET /api/agents → FAILED"
fi

# ============================================
# 3. MCP TOOL ENDPOINTS
# ============================================
echo ""
echo -e "${BLUE}━━━ 3. MCP Tool Endpoints ━━━${NC}"

# Test query_graph
QUERY_RESULT=$(curl -s -X POST http://localhost:8000/api/mcp/tool/query_graph \
    -H "Content-Type: application/json" \
    -d '{"query":"test"}')

if echo "$QUERY_RESULT" | jq -e '.success' > /dev/null 2>&1; then
    pass "POST /api/mcp/tool/query_graph → OK"
else
    fail "POST /api/mcp/tool/query_graph → FAILED"
    echo "Response: $QUERY_RESULT" | jq '.'
fi

# Test read_graph
READ_RESULT=$(curl -s -X POST http://localhost:8000/api/mcp/tool/read_graph \
    -H "Content-Type: application/json" \
    -d '{}')

if echo "$READ_RESULT" | jq -e '.success' > /dev/null 2>&1; then
    pass "POST /api/mcp/tool/read_graph → OK"
else
    fail "POST /api/mcp/tool/read_graph → FAILED"
fi

# Test create_entities
CREATE_RESULT=$(curl -s -X POST http://localhost:8000/api/mcp/tool/create_entities \
    -H "Content-Type: application/json" \
    -d '{"entities":[{"name":"DiagTest","entityType":"test","observations":["Diagnostic test"]}]}')

if echo "$CREATE_RESULT" | jq -e '.success' > /dev/null 2>&1; then
    pass "POST /api/mcp/tool/create_entities → OK"
else
    fail "POST /api/mcp/tool/create_entities → FAILED"
fi

# ============================================
# 4. AGENT COMMAND BUS
# ============================================
echo ""
echo -e "${BLUE}━━━ 4. Agent Command Bus ━━━${NC}"

PING_RESULT=$(curl -s -X POST http://localhost:8000/api/agents/LocalSimulator/command \
    -H "Content-Type: application/json" \
    -d '{"command":"ping"}')

if echo "$PING_RESULT" | jq -e '.success and .result == "pong"' > /dev/null 2>&1; then
    pass "POST /api/agents/:id/command (ping) → OK"
else
    fail "POST /api/agents/:id/command (ping) → FAILED"
fi

# ============================================
# 5. PERSISTENCE CHECK
# ============================================
echo ""
echo -e "${BLUE}━━━ 5. Persistence Status ━━━${NC}"

if [ -f "graph-data.json" ]; then
    ENTITY_COUNT=$(jq '.entities | length' graph-data.json 2>/dev/null || echo "0")
    pass "graph-data.json exists ($ENTITY_COUNT entities)"
else
    warn "graph-data.json not found (will be created on first save)"
fi

# ============================================
# 6. FRONTEND FILES CHECK
# ============================================
echo ""
echo -e "${BLUE}━━━ 6. Frontend Files ━━━${NC}"

if [ -f "index.html" ]; then
    pass "index.html exists"
else
    fail "index.html missing"
fi

if [ -f "script.js" ]; then
    pass "script.js exists"
else
    fail "script.js missing"
fi

if [ -f "styles.css" ]; then
    pass "styles.css exists"
else
    fail "styles.css missing"
fi

# Check for hardcoded localhost
if grep -q "http://localhost:8000" script.js 2>/dev/null; then
    fail "script.js contains hardcoded localhost:8000 URLs"
    warn "Should use window.location.origin or relative URLs"
else
    pass "script.js uses proper URL handling"
fi

# ============================================
# 7. CORS CONFIGURATION
# ============================================
echo ""
echo -e "${BLUE}━━━ 7. CORS Configuration ━━━${NC}"

CORS_TEST=$(curl -s -H "Origin: http://localhost:8000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -X OPTIONS http://localhost:8000/api/mcp/tool/query_graph)

if [ -n "$CORS_TEST" ] || grep -q "cors" server.js; then
    pass "CORS appears configured"
else
    warn "CORS configuration not detected (may cause issues)"
fi

# ============================================
# 8. STATIC FILE SERVING
# ============================================
echo ""
echo -e "${BLUE}━━━ 8. Static File Serving ━━━${NC}"

if curl -s http://localhost:8000/ | grep -q "<!DOCTYPE html>" 2>/dev/null; then
    pass "GET / → serves index.html"
else
    fail "GET / → does not serve HTML"
fi

if curl -s http://localhost:8000/script.js | grep -q "function" 2>/dev/null; then
    pass "GET /script.js → serves JavaScript"
else
    fail "GET /script.js → does not serve JavaScript"
fi

# ============================================
# 9. FRONTEND SIMULATION
# ============================================
echo ""
echo -e "${BLUE}━━━ 9. Frontend API Simulation ━━━${NC}"

# Simulate what the frontend does
echo -n "Simulating frontend fetch('/api/mcp/tool/query_graph')... "
FRONTEND_SIM=$(curl -s -X POST http://localhost:8000/api/mcp/tool/query_graph \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:8000" \
    -d '{"query":"DiagTest"}')

if echo "$FRONTEND_SIM" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
    RESULT_COUNT=$(echo "$FRONTEND_SIM" | jq -r '.result.count // 0')
    echo "  Found $RESULT_COUNT result(s)"
    ((PASSED++))
else
    echo -e "${RED}FAILED${NC}"
    ((FAILED++))
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✓ Passed:${NC} $PASSED"
echo -e "${RED}✗ Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✓ Frontend-Backend Bridge is HEALTHY        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "🌐 Open your browser to: ${BLUE}http://localhost:8000${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ✗ Bridge Issues Detected - See Above        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. Ensure server is running: ${BLUE}npm start${NC}"
    echo "  2. Access via: ${BLUE}http://localhost:8000${NC} (not file://)"
    echo "  3. Check console for errors"
    echo ""
    exit 1
fi
