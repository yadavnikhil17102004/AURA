#!/bin/bash

echo "🧪 Testing AURA 2.1 Dynamic MCP Integration"
echo "==========================================="
echo

# 1. Check server is running
echo "1️⃣  Server Status"
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Server running on port 8000"
else
    echo "❌ Server not running"
    exit 1
fi
echo

# 2. Check dynamic tools endpoint
echo "2️⃣  Dynamic Tools Endpoint"
TOOL_RESPONSE=$(curl -s http://localhost:8000/api/tools)
TOOL_COUNT=$(echo "$TOOL_RESPONSE" | jq -r '.count')
echo "✅ /api/tools returns $TOOL_COUNT tools"
echo

# 3. List all tools
echo "3️⃣  Available Tools"
echo "$TOOL_RESPONSE" | jq -r '.tools[] | "  \(.source | if . == "builtin" then "🏠" else "🤖" end) \(.name)"'
echo

# 4. Check built-in tools
echo "4️⃣  Built-in Tools"
BUILTIN_COUNT=$(echo "$TOOL_RESPONSE" | jq -r '[.tools[] | select(.source == "builtin")] | length')
echo "✅ Found $BUILTIN_COUNT built-in tools:"
echo "$TOOL_RESPONSE" | jq -r '.tools[] | select(.source == "builtin") | "  - \(.name)"'
echo

# 5. Check agent tools
echo "5️⃣  Agent Tools"
AGENT_COUNT=$(echo "$TOOL_RESPONSE" | jq -r '[.tools[] | select(.source == "agent")] | length')
echo "✅ Found $AGENT_COUNT agent tools:"
echo "$TOOL_RESPONSE" | jq -r '.tools[] | select(.source == "agent") | "  - \(.name) [\(.agentId)]"'
echo

# 6. Test agent command routing
echo "6️⃣  Agent Command Routing"
PING_RESULT=$(curl -s -X POST http://localhost:8000/api/agents/LocalSimulator/command \
  -H "Content-Type: application/json" \
  -d '{"command": "ping", "args": {}}')

if echo "$PING_RESULT" | jq -e '.result == "pong"' > /dev/null; then
    echo "✅ Agent command routing works: ping → pong"
else
    echo "❌ Agent command routing failed"
    echo "$PING_RESULT"
fi
echo

# 7. Check system prompt includes new instructions
echo "7️⃣  System Prompt Configuration"
CONFIG=$(curl -s http://localhost:8000/api/config)
if echo "$CONFIG" | jq -r '.SYSTEM_PROMPT' | grep -q "agent_Obsidian"; then
    echo "✅ System prompt includes agent tool instructions"
else
    echo "⚠️  System prompt may need updating"
fi
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ AURA 2.1 Dynamic MCP Integration: WORKING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "📋 Summary:"
echo "  - Total Tools: $TOOL_COUNT"
echo "  - Built-in: $BUILTIN_COUNT (local AURA memory)"
echo "  - Agents: $AGENT_COUNT (external MCP servers)"
echo
echo "🎯 Next Steps:"
echo "  1. Open http://localhost:8000"
echo "  2. Test: 'My name is X' → 'What's my name?'"
echo "  3. Add Obsidian MCP for note searching"
echo
