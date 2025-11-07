# 🐳 Using Docker MCP with AURA

## Your Available MCP Servers

You have 8 Docker MCP images ready:
- mcp/playwright
- mcp/elevenlabs  
- mcp/obsidian ⭐ (for searching notes!)
- mcp/fetch
- mcp/context7
- mcp/puppeteer
- mcp/sequentialthinking
- mcp/memory

## Quick Start: Add Obsidian MCP

### Option 1: Via MCP Gateway (Recommended)

```bash
# Terminal 1: Start MCP Gateway
docker mcp gateway run

# Terminal 2: AURA will connect automatically
npm start
```

### Option 2: Direct Integration (What AURA v2.1 Supports!)

Add to `agent-registry.json`:

```json
{
  "agents": {
    "LocalSimulator": {...},
    "Obsidian": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "mcp/obsidian"
      ],
      "type": "stdio",
      "autoStart": true,
      "description": "Obsidian MCP - search and read notes",
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/your/vault"
      }
    }
  }
}
```

Then:
```bash
npm start
```

AURA will:
1. ✅ Start the Docker container
2. ✅ Discover tools via STDIO
3. ✅ Register them as `agent_Obsidian_*`
4. ✅ Make them available to Gemini

### Testing

```bash
# Check discovered tools
curl http://localhost:8000/api/tools | jq '.tools[].name'

# Expected output includes:
# agent_Obsidian_simple_search
# agent_Obsidian_get_file_contents
# etc.
```

### Chat Test

```
You: "Search my notes for SOC"
AURA: [Uses agent_Obsidian_simple_search] 
      Found 3 notes about SOC...
```

## Adding More MCP Servers

```json
{
  "agents": {
    "Obsidian": {...},
    "Puppeteer": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "mcp/puppeteer"],
      "type": "stdio",
      "autoStart": false,
      "description": "Browser automation"
    },
    "Fetch": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "mcp/fetch"],
      "type": "stdio",
      "autoStart": false,
      "description": "Web scraping"
    }
  }
}
```

## Current Status

✅ Docker installed
✅ 8 MCP images available
✅ AURA 2.1 dynamic discovery ready
⏳ Need to configure specific MCP servers in agent-registry.json

## Next Steps

1. Find your Obsidian vault path:
   ```bash
   ls ~/Library/Mobile\ Documents/iCloud~md~obsidian/Documents/
   ```

2. Update `agent-registry.json` with correct path

3. Restart AURA

4. Test: "Search my notes for X"

Done! 🎉
