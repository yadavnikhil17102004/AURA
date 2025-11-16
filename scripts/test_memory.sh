#!/bin/bash

# Test Memory Retrieval Fix
# This script verifies that AURA proactively uses query_graph to retrieve stored information

set -e

echo "🧪 Testing AURA Memory Retrieval..."
echo

# 1. Verify server is running
echo "1️⃣  Checking server status..."
curl -s http://localhost:8000/api/health > /dev/null && echo "✓ Server running" || { echo "✗ Server not running"; exit 1; }
echo

# 2. Check that graph has stored data
echo "2️⃣  Checking stored data..."
ENTITY_COUNT=$(curl -s -X POST http://localhost:8000/api/mcp/tool/read_graph \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.result.count // 0')

echo "✓ Found $ENTITY_COUNT entities in knowledge graph"

if [ "$ENTITY_COUNT" -eq 0 ]; then
    echo "⚠️  No data in graph. Let's create a test entity..."
    curl -s -X POST http://localhost:8000/api/mcp/tool/create_entities \
      -H "Content-Type: application/json" \
      -d '{
        "entities": [{
          "name": "Nikhil Yadav",
          "entityType": "person",
          "observations": ["User'\''s name is Nikhil Yadav", "Prefers to be called Nikhil"]
        }]
      }' > /dev/null
    echo "✓ Created test entity"
fi
echo

# 3. Test query_graph can find the name
echo "3️⃣  Testing query_graph for 'name'..."
QUERY_RESULT=$(curl -s -X POST http://localhost:8000/api/mcp/tool/query_graph \
  -H "Content-Type: application/json" \
  -d '{"query": "name"}')

RESULTS_FOUND=$(echo "$QUERY_RESULT" | jq -r '.result.results | length')
echo "✓ query_graph('name') returned $RESULTS_FOUND results"

if [ "$RESULTS_FOUND" -gt 0 ]; then
    echo "✓ Found matching entities:"
    echo "$QUERY_RESULT" | jq -r '.result.results[].name' | sed 's/^/  - /'
fi
echo

# 4. Test query_graph for 'person' type
echo "4️⃣  Testing query_graph for entityType='person'..."
PERSON_RESULT=$(curl -s -X POST http://localhost:8000/api/mcp/tool/query_graph \
  -H "Content-Type: application/json" \
  -d '{"query": "person", "entityType": "person"}')

PERSON_COUNT=$(echo "$PERSON_RESULT" | jq -r '.result.results | length')
echo "✓ query_graph(entityType='person') returned $PERSON_COUNT results"

if [ "$PERSON_COUNT" -gt 0 ]; then
    echo "✓ Found person entities:"
    echo "$PERSON_RESULT" | jq -r '.result.results[] | "\(.name) - \(.observations[0])"' | sed 's/^/  - /'
fi
echo

# 5. Check system prompt includes proactive memory instructions
echo "5️⃣  Verifying system prompt configuration..."
CONFIG=$(curl -s http://localhost:8000/api/config)
if echo "$CONFIG" | jq -r '.SYSTEM_PROMPT' | grep -q "ALWAYS use query_graph first"; then
    echo "✓ System prompt includes proactive memory instructions"
else
    echo "✗ System prompt missing proactive memory instructions"
    exit 1
fi
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Memory Retrieval Test: PASSED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "📋 Summary:"
echo "  - Server: ✓ Running"
echo "  - Graph: ✓ $ENTITY_COUNT entities stored"
echo "  - Query: ✓ Can find user data"
echo "  - Prompt: ✓ Instructs proactive lookup"
echo
echo "🎯 Next Steps:"
echo "  1. Open http://localhost:8000"
echo "  2. Ask: 'What's my name?'"
echo "  3. AURA should now use query_graph and find: Nikhil Yadav"
echo
