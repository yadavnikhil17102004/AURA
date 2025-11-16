# 🎮 AURA 2.0 - Quick Start Guide

Welcome to AURA 2.0! Here's how to use the new production features.

---

## 🚀 Starting AURA

```bash
npm start
```

You'll see:
```
💾 Loaded graph: X entities, Y relations
✨ AURA Server Started Successfully!
📡 Server running at: http://localhost:8000
📋 Available Endpoints:
   • POST /api/agents/:id/command - Send command to agent  ← NEW!
```

---

## 💾 Persistent Memory (Automatic)

### Your graph now persists automatically!

**Create some data:**
```bash
curl -X POST http://localhost:8000/api/mcp/tool/create_entities \
  -H "Content-Type: application/json" \
  -d '{
    "entities": [{
      "name": "MyProject",
      "entityType": "project",
      "observations": ["Started today", "Using AURA 2.0"]
    }]
  }'
```

**Restart the server:**
```bash
npm start
```

**Query your data - it's still there!**
```bash
curl -X POST http://localhost:8000/api/mcp/tool/query_graph \
  -H "Content-Type: application/json" \
  -d '{"query": "MyProject"}'
```

**Where is it stored?**
- File: `graph-data.json`
- Format: JSON
- Auto-saved: After every create/update/delete
- Auto-loaded: On server startup

---

## ⚡ Agent Command Bus

### Send commands to discovered agents

**1. List available agents:**
```bash
curl http://localhost:8000/api/agents | jq
```

Response:
```json
{
  "success": true,
  "agents": [
    {
      "name": "LocalSimulator",
      "capabilities": ["knowledge-graph", "memory", "search"],
      "tools": [
        {"name": "ping", "description": "Responds with pong"},
        {"name": "echo", "description": "Echoes back input text"}
      ],
      "status": "online",
      "pid": 12345
    }
  ]
}
```

**2. Send a command:**
```bash
curl -X POST http://localhost:8000/api/agents/LocalSimulator/command \
  -H "Content-Type: application/json" \
  -d '{"command": "ping"}'
```

Response:
```json
{
  "success": true,
  "result": "pong"
}
```

**3. Send a command with arguments:**
```bash
curl -X POST http://localhost:8000/api/agents/LocalSimulator/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "echo",
    "args": {"text": "Hello from AURA!"}
  }'
```

Response:
```json
{
  "success": true,
  "result": "Hello from AURA!"
}
```

---

## 🤖 Using Agent Commands with Gemini

Gemini can now call agents directly! Just ask naturally:

**Example conversations:**

> **You:** "Ping the LocalSimulator agent"
> 
> **AURA:** *[calls agent_command internally]*
> 
> The LocalSimulator agent responded with "pong" ✅

> **You:** "Echo 'Hello World' using the LocalSimulator"
>
> **AURA:** *[calls agent_command with args]*
>
> The agent echoed back: "Hello World"

> **You:** "What agents are available?"
>
> **AURA:** I can see 1 agent: LocalSimulator with capabilities for knowledge-graph, memory, and search.

---

## 🧪 Running Tests

### Basic test run:
```bash
npm test
```

Expected output:
```
PASS  test/server.test.js
  AURA Server Integration Tests
    Health and Configuration
      ✓ GET /api/health returns OK status
      ✓ GET /api/config returns configuration
    Agent Discovery
      ✓ GET /api/agents returns agent list
    MCP Knowledge Graph
      ✓ POST /api/mcp/tool/create_entities creates new entities
      ✓ POST /api/mcp/tool/query_graph searches the graph
      ✓ POST /api/mcp/tool/read_graph returns graph structure
    Docker MCP
      ✓ GET /api/mcp/docker/info returns Docker status
      ✓ GET /api/mcp/servers returns MCP server list

Tests: 8 passed, 8 total
```

### Watch mode (re-run on file changes):
```bash
npm run test:watch
```

---

## 🔧 Creating Custom Agents

Want to create your own agent? Here's the template:

**1. Create `my-agent.js`:**
```javascript
#!/usr/bin/env node

// Emit handshake on startup
const handshake = {
  type: 'register',
  name: 'MyAgent',
  capabilities: ['custom-feature'],
  tools: [
    { name: 'my_command', description: 'Does something cool' }
  ],
  version: '1.0.0',
  protocol: 'mcp-stdio'
};
process.stdout.write(JSON.stringify(handshake) + '\n');

// Handle commands
const readline = require('readline');
const rl = readline.createInterface({ 
  input: process.stdin,
  crlfDelay: Infinity 
});

rl.on('line', line => {
  try {
    const msg = JSON.parse(line.trim());
    if (msg.type === 'command') {
      let result;
      switch (msg.command) {
        case 'my_command':
          result = { custom: 'data' };
          break;
        default:
          result = { error: 'Unknown command' };
      }
      process.stdout.write(JSON.stringify({
        type: 'response',
        requestId: msg.id,
        result
      }) + '\n');
    }
  } catch (err) {
    process.stdout.write(JSON.stringify({
      type: 'response',
      error: err.message
    }) + '\n');
  }
});
```

**2. Register in `agent-registry.json`:**
```json
{
  "agents": {
    "MyAgent": {
      "command": "node",
      "args": ["my-agent.js"],
      "autoStart": true,
      "description": "My custom agent"
    }
  }
}
```

**3. Restart AURA:**
```bash
npm start
```

**4. Test it:**
```bash
curl http://localhost:8000/api/agents
# Should see MyAgent in the list

curl -X POST http://localhost:8000/api/agents/MyAgent/command \
  -H "Content-Type: application/json" \
  -d '{"command": "my_command"}'
```

---

## 📊 Monitoring

### Check graph size:
```bash
curl -X POST http://localhost:8000/api/mcp/tool/debug_graph | jq '.result | {entities: (.entities | length), relations: (.relations | length)}'
```

### Check agent status:
```bash
curl http://localhost:8000/api/agents | jq '.agents[] | {name, status, pid}'
```

### Health check:
```bash
curl http://localhost:8000/api/health | jq
```

---

## 🐛 Troubleshooting

### Graph not persisting?
- Check if `graph-data.json` exists in the root directory
- Look for `💾 Saved graph` in the console logs
- Ensure proper shutdown (Ctrl+C, not kill -9)

### Agent not responding?
- Check agent status: `curl http://localhost:8000/api/agents`
- Look for agent errors in server logs
- Verify agent is in `agent-registry.json` with `autoStart: true`

### Tests failing?
- Ensure server is NOT running (tests start their own instance)
- Check `jest.config.js` for timeout settings
- Run with verbose: `npm test -- --verbose`

---

## 🎯 Best Practices

1. **Always use Ctrl+C to stop the server** (ensures graph is saved)
2. **Back up `graph-data.json`** before major changes
3. **Test new agents** with curl before exposing to Gemini
4. **Run tests** after modifying server code: `npm test`
5. **Check logs** for `📡 Agent Command:` to debug interactions

---

## 🚀 What's Next?

Ready to extend AURA further? Check out:
- `UPGRADE.md` - Ideas for future features
- `CHANGELOG.md` - Version history
- `README.md` - Project overview

**You're all set to build with AURA 2.0!** 🎉
