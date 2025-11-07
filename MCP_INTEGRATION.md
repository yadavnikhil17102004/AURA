# AURA MCP Integration System

## Overview

AURA now includes a comprehensive **Model Context Protocol (MCP)** integration system that enables seamless communication with Docker-based MCP servers. This system provides a complete knowledge graph management solution with entities, relations, and observations.

## Architecture

### MCP Configuration

The MCP system is configured via `mcp-config.json`:

```json
{
  "servers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": [
        "mcp",
        "gateway",
        "run"
      ],
      "type": "stdio"
    }
  }
}
```

### Components

1. **mcp-integration.js** - Core MCP system with connection management and tool implementation
2. **script.js** - AURA application with MCP integration hooks
3. **mcp-config.json** - MCP server configuration
4. **index.html** - UI with MCP management button

## Features

### Available MCP Tools

The system provides access to all Docker MCP server capabilities:

#### 1. **create_entities**
Create new entities in the knowledge graph.

```javascript
await use_mcp_tool('MCP_DOCKER', 'create_entities', {
  entities: [{
    name: 'Entity_Name',
    entityType: 'Type',
    observations: ['obs1', 'obs2'],
    metadata: { /* optional metadata */ }
  }]
});
```

#### 2. **read_graph**
Read the complete graph structure.

```javascript
await use_mcp_tool('MCP_DOCKER', 'read_graph', {
  limit: 100,
  offset: 0
});
```

#### 3. **create_relations**
Create relationships between entities.

```javascript
await use_mcp_tool('MCP_DOCKER', 'create_relations', {
  relations: [{
    from: 'Entity1',
    to: 'Entity2',
    relationType: 'uses',
    properties: { /* optional */ }
  }]
});
```

#### 4. **add_observations**
Add observations to entities.

```javascript
await use_mcp_tool('MCP_DOCKER', 'add_observations', {
  observations: [{
    entityName: 'Entity_Name',
    contents: ['observation 1', 'observation 2']
  }]
});
```

#### 5. **query_graph**
Query the graph for specific entities.

```javascript
await use_mcp_tool('MCP_DOCKER', 'query_graph', {
  query: 'search term',
  entityType: 'AI_Assistant',
  limit: 50
});
```

#### 6. **delete_entities**
Remove entities from the graph.

```javascript
await use_mcp_tool('MCP_DOCKER', 'delete_entities', {
  entityIds: ['entity_id_1', 'entity_id_2']
});
```

#### 7. **update_entities**
Update entity properties.

```javascript
await use_mcp_tool('MCP_DOCKER', 'update_entities', {
  updates: [{
    entityId: 'entity_id',
    changes: { /* properties to update */ }
  }]
});
```

#### 8. **list_resources**
List all available resources.

```javascript
await use_mcp_tool('MCP_DOCKER', 'list_resources', {
  type: 'all' // 'entities', 'relations', or 'all'
});
```

#### 9. **get_resource**
Retrieve a specific resource.

```javascript
await use_mcp_tool('MCP_DOCKER', 'get_resource', {
  resourceId: 'resource_id'
});
```

## Usage in AURA

### Automatic Chat Logging
Each message exchange is automatically logged to the MCP graph:

```javascript
await use_mcp_tool('MCP_DOCKER', 'add_observations', {
  observations: [{
    entityName: 'ChatBot',
    contents: [
      `User: ${userMessage}`,
      `AURA: ${aiResponse}`
    ]
  }]
});
```

### MCP Management Panel
Click the **"🔧 Manage MCP"** button to:
- View MCP connection status
- Display graph statistics
- Configure AURA entity
- Create relations

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + M` | Open MCP Management |
| `Cmd/Ctrl + G` | View MCP Graph |
| `Cmd/Ctrl + S` | Get MCP Statistics |
| `Cmd/Ctrl + K` | Focus Input |
| `Cmd/Ctrl + L` | Clear Chat |
| `Cmd/Ctrl + E` | Export Chat |

## MCP Integration Class

### Initialization

```javascript
// Automatic initialization on app start
const mcp = await initializeMCPSystem();

// Or get existing instance
const mcp = getMCPInstance();
```

### Available Methods

#### getMCPInstance()
Get the global MCP instance.

```javascript
const mcp = getMCPInstance();
```

#### use_mcp_tool(serverName, toolName, params)
Call any MCP tool.

```javascript
const result = await use_mcp_tool('MCP_DOCKER', 'create_entities', { /* params */ });
```

#### getMCPStatus()
Get current MCP connection status.

```javascript
const status = getMCPStatus();
// Returns: { connected, status, serverName, toolsAvailable }
```

#### mcp.getAvailableTools()
List all available tools.

```javascript
const tools = mcp.getAvailableTools();
// ['create_entities', 'read_graph', 'create_relations', ...]
```

#### mcp.getStatistics()
Get graph statistics.

```javascript
const stats = mcp.getStatistics();
// { entities: 5, relations: 3, observations: 12, status: 'simulated' }
```

#### mcp.exportGraphData()
Export complete graph.

```javascript
const graphData = mcp.exportGraphData();
// { entities: [...], relations: [...], observations: [...], exportedAt: '...' }
```

#### mcp.clearGraphData()
Clear all graph data.

```javascript
mcp.clearGraphData();
```

## Operation Modes

### Real Mode
When Docker is available and running:
- ✅ Connects to actual Docker MCP gateway
- ✅ Persistent data storage
- ✅ Full MCP server capabilities

### Simulation Mode (Default)
When Docker is unavailable:
- ✅ In-memory graph database
- ✅ Full tool simulation
- ✅ Perfect for development & testing
- ✅ No external dependencies required

The system automatically detects the environment and switches modes accordingly.

## Configuration

### Custom MCP Configuration
Modify `mcp-config.json` to connect to different MCP servers:

```json
{
  "servers": {
    "CUSTOM_MCP": {
      "command": "custom-mcp-server",
      "args": ["--config", "path/to/config"],
      "type": "stdio"
    }
  }
}
```

## Usage Examples

### Example 1: Create AURA Entity
```javascript
await use_mcp_tool('MCP_DOCKER', 'create_entities', {
  entities: [{
    name: 'AURA_ChatBot',
    entityType: 'AI_Assistant',
    observations: [
      'Personal AI assistant',
      'OpenRouter integration',
      'MCP-enabled'
    ],
    metadata: {
      version: '1.0.0',
      capabilities: ['chat', 'analysis', 'research']
    }
  }]
});
```

### Example 2: Link to External Systems
```javascript
await use_mcp_tool('MCP_DOCKER', 'create_relations', {
  relations: [
    {
      from: 'AURA_ChatBot',
      to: 'OpenRouter_API',
      relationType: 'uses'
    },
    {
      from: 'AURA_ChatBot',
      to: 'User_Knowledge_Base',
      relationType: 'references'
    }
  ]
});
```

### Example 3: Query and Process Results
```javascript
const results = await use_mcp_tool('MCP_DOCKER', 'query_graph', {
  query: 'AI_Assistant',
  limit: 10
});

results.results.forEach(entity => {
  console.log(`Found: ${entity.name} (${entity.entityType})`);
  entity.observations.forEach(obs => console.log(`  - ${obs}`));
});
```

### Example 4: Track Conversations
```javascript
// Automatically called on each message
await use_mcp_tool('MCP_DOCKER', 'add_observations', {
  observations: [{
    entityName: 'ChatBot',
    contents: [
      'User: How does MCP work?',
      'AURA: MCP (Model Context Protocol) is...'
    ]
  }]
});
```

## Error Handling

The system includes comprehensive error handling:

```javascript
try {
  const result = await use_mcp_tool('MCP_DOCKER', 'create_entities', {
    entities: [{ name: 'Test' }]
  });
} catch (error) {
  console.error('MCP Error:', error);
  // Falls back to simulation mode automatically
}
```

## Performance Considerations

- **In-Memory Storage**: Optimized for fast operations
- **Tool Caching**: Available tools are cached
- **Lazy Loading**: Tools initialized on first use
- **Connection Pooling**: Efficient resource management
- **Automatic Cleanup**: Old messages pruned after 20 exchanges

## Troubleshooting

### Issue: MCP Connected but No Data
**Solution**: Check Docker is running and accessible
```bash
docker ps
docker pull mcpserver/gateway:latest
```

### Issue: Tools Not Available
**Solution**: Check `mcp-config.json` configuration
```bash
cat mcp-config.json
```

### Issue: Graph Data Lost
**Solution**: Export graph before clearing
```javascript
const data = mcp.exportGraphData();
// Save data.json for backup
```

## Security

- ✅ No sensitive data stored in browser
- ✅ All API keys stored in localStorage (encrypted by browser)
- ✅ CORS protected API calls
- ✅ Secure Docker communication via stdio

## Future Enhancements

- [ ] Persistent storage backend
- [ ] Multi-user graph collaboration
- [ ] Advanced graph visualization
- [ ] Custom tool plugins
- [ ] Graph versioning & rollback
- [ ] Real-time graph synchronization

## Support & Documentation

For more information:
- MCP Documentation: https://modelcontextprotocol.io
- Docker MCP Gateway: https://docker.com/mcp
- AURA GitHub: https://github.com/yadavnikhil17102004/AURA

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: ✨ Production Ready
