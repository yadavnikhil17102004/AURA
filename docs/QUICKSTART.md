# 🚀 MCP Integration - Quick Start Guide

## 5-Minute Setup

### Step 1: Open AURA
```bash
# Simply open index.html in your browser
open index.html
# or
# Double-click index.html
```

### Step 2: Check MCP Status
Open browser console (F12) and look for:
```
✅ MCP system initialized
🔌 Initializing MCP Docker gateway...
```

### Step 3: Use MCP
Click **"🔧 Manage MCP"** button to:
- View MCP status
- See graph statistics
- Configure entities
- Create relations

---

## Common Commands

### In Browser Console (F12)

**Create an Entity:**
```javascript
await use_mcp_tool('MCP_DOCKER', 'create_entities', {
  entities: [{
    name: 'MyEntity',
    entityType: 'Example',
    observations: ['First observation', 'Second observation']
  }]
});
```

**View Graph:**
```javascript
await use_mcp_tool('MCP_DOCKER', 'read_graph', {});
```

**Search Graph:**
```javascript
await use_mcp_tool('MCP_DOCKER', 'query_graph', {
  query: 'search term'
});
```

**Get Statistics:**
```javascript
const mcp = getMCPInstance();
console.log(mcp.getStatistics());
```

**Export Graph:**
```javascript
const mcp = getMCPInstance();
const data = mcp.exportGraphData();
console.log(data);
```

---

## Keyboard Shortcuts

| Key Combo | Action |
|-----------|--------|
| `Cmd+M` or `Ctrl+M` | Manage MCP |
| `Cmd+G` or `Ctrl+G` | View Graph |
| `Cmd+S` or `Ctrl+S` | Get Stats |
| `Cmd+K` or `Ctrl+K` | Focus Input |
| `Cmd+E` or `Ctrl+E` | Export Chat |
| `Cmd+L` or `Ctrl+L` | Clear Chat |

---

## Operation Modes

### Automatic Mode Selection

**Docker Mode** (if Docker is running):
- ✅ Production-ready
- ✅ Real MCP server
- ✅ Persistent data

**Simulation Mode** (default):
- ✅ Works anywhere
- ✅ In-memory database
- ✅ Perfect for testing
- ✅ No Docker required

---

## What You Can Do

### 1. Build Knowledge Graphs
Create entities (people, projects, concepts) and link them together

### 2. Track Conversations
Messages are automatically logged to the graph

### 3. Search & Query
Find entities and their relationships

### 4. Export Data
Download graph as JSON for backup or analysis

### 5. Manage Information
Add, update, delete, and organize information

---

## File Structure

```
AURA/
├── index.html              # Main HTML file
├── script.js              # AURA chat logic
├── config.js              # Configuration
├── styles.css             # Styling
├── mcp-integration.js     # NEW - MCP system
├── mcp-config.json        # MCP server config
├── README.md              # Main docs
├── MCP_INTEGRATION.md     # MCP full docs
├── MCP_QUICK_REFERENCE.md # Quick examples
└── IMPLEMENTATION_SUMMARY.md # What's new
```

---

## Troubleshooting

### MCP Not Initializing
- Check browser console (F12)
- Ensure JavaScript is enabled
- Try refreshing the page

### "Unknown tool" Error
- Verify tool name is correct
- Check console for available tools
- See MCP_QUICK_REFERENCE.md for examples

### Docker Connection Fails
- This is expected if Docker isn't running
- System automatically falls back to simulation mode
- You can still use all features!

---

## Need Help?

1. **Quick Examples**: See [MCP_QUICK_REFERENCE.md](./MCP_QUICK_REFERENCE.md)
2. **Full Docs**: Read [MCP_INTEGRATION.md](./MCP_INTEGRATION.md)
3. **Implementation Details**: Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
4. **Console Logs**: Open F12 console to see detailed logs

---

## 🎯 First Task: Create Your First Entity

1. Open browser console (F12)
2. Copy and paste:

```javascript
await use_mcp_tool('MCP_DOCKER', 'create_entities', {
  entities: [{
    name: 'My_First_Entity',
    entityType: 'Concept',
    observations: [
      'Created on ' + new Date().toISOString(),
      'This is my first MCP entity!',
      'I can add multiple observations'
    ],
    metadata: { created_by: 'me' }
  }]
});
```

3. Press Enter
4. Check response in console
5. Use `Cmd+G` to view your entity in the graph!

---

## 🎉 That's It!

You now have a fully functional MCP integration system with:
- ✨ 9 powerful tools
- 📊 Knowledge graph management
- 💾 Data export
- 🔄 Dual operation modes
- 📚 Full documentation

**Start building your knowledge graph!**

---

**Version**: 1.0.0  
**Updated**: November 2025  
**Status**: ✅ Ready to Use
