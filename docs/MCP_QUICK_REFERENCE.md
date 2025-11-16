# AURA MCP Quick Reference Guide

## 🚀 Getting Started with MCP

### Step 1: Initialization
MCP is automatically initialized when AURA loads. Check the console for confirmation:
```
✅ MCP system initialized
```

### Step 2: Access MCP
Three ways to use MCP:

1. **Click Button**: "🔧 Manage MCP" in the UI
2. **Keyboard**: `Cmd/Ctrl + M` to manage MCP
3. **Developer Console**: Direct API calls

### Step 3: Choose Operation Mode
- **Docker Mode**: Requires Docker & MCP gateway running
- **Simulation Mode**: Works without Docker (default)

---

## 📚 Common Tasks

### Task 1: Create an Entity
**What it does**: Add a new entity to the knowledge graph

```javascript
// Using the function directly
await use_mcp_tool('MCP_DOCKER', 'create_entities', {
  entities: [{
    name: 'John_Doe',
    entityType: 'Person',
    observations: [
      'Works as a Software Engineer',
      'Interested in AI and ML',
      'Located in San Francisco'
    ],
    metadata: {
      department: 'Engineering',
      experience_years: 5
    }
  }]
});
```

**Response**:
```json
{
  "success": true,
  "entities_created": 1,
  "entities": [{
    "id": "entity_12345",
    "name": "John_Doe",
    "entityType": "Person",
    "observations": ["..."],
    "createdAt": "2025-11-08T10:30:00Z"
  }]
}
```

### Task 2: Link Entities Together
**What it does**: Create relationships between entities

```javascript
await use_mcp_tool('MCP_DOCKER', 'create_relations', {
  relations: [
    {
      from: 'John_Doe',
      to: 'Tech_Company',
      relationType: 'works_at',
      properties: { position: 'Senior Engineer', since: 2020 }
    },
    {
      from: 'John_Doe',
      to: 'Machine_Learning',
      relationType: 'expertise_in'
    }
  ]
});
```

### Task 3: Record Observations
**What it does**: Add facts/observations about entities

```javascript
await use_mcp_tool('MCP_DOCKER', 'add_observations', {
  observations: [{
    entityName: 'John_Doe',
    contents: [
      'Completed ML certification on 2025-11-01',
      'Published article on Neural Networks',
      'Active contributor to open source projects'
    ]
  }]
});
```

### Task 4: Search the Graph
**What it does**: Find entities matching criteria

```javascript
// Search by name or content
const results = await use_mcp_tool('MCP_DOCKER', 'query_graph', {
  query: 'Machine Learning',
  entityType: 'Technology',  // Optional filter
  limit: 10
});

console.log(`Found ${results.total_found} results`);
results.results.forEach(entity => {
  console.log(`- ${entity.name} (${entity.entityType})`);
});
```

### Task 5: View All Resources
**What it does**: List everything in the graph

```javascript
// Get all resources
const all = await use_mcp_tool('MCP_DOCKER', 'list_resources', {
  type: 'all'  // Can be: 'all', 'entities', 'relations'
});

console.log(`Total resources: ${all.total}`);
all.resources.forEach(res => {
  console.log(`${res.type}: ${res.name}`);
});
```

### Task 6: Get Specific Resource
**What it does**: Retrieve details of a specific resource

```javascript
const resource = await use_mcp_tool('MCP_DOCKER', 'get_resource', {
  resourceId: 'entity_12345'
});

console.log(resource.resource);
// Outputs detailed resource information
```

### Task 7: Update Entity
**What it does**: Modify existing entity properties

```javascript
await use_mcp_tool('MCP_DOCKER', 'update_entities', {
  updates: [{
    entityId: 'entity_12345',
    changes: {
      metadata: { ...oldMetadata, status: 'active' }
    }
  }]
});
```

### Task 8: Delete Entity
**What it does**: Remove entity from graph

```javascript
await use_mcp_tool('MCP_DOCKER', 'delete_entities', {
  entityIds: ['entity_12345', 'entity_67890']
});
```

### Task 9: View Graph Statistics
**What it does**: Get overview of graph content

```javascript
const mcp = getMCPInstance();
const stats = mcp.getStatistics();
// Output:
// {
//   entities: 42,
//   relations: 128,
//   observations: 356,
//   status: 'simulated'
// }
```

### Task 10: Export Graph Data
**What it does**: Download entire graph as JSON

```javascript
const mcp = getMCPInstance();
const graphData = mcp.exportGraphData();
// Contains: entities[], relations[], observations[], exportedAt
```

---

## 🎯 Real-World Examples

### Example 1: Build a Company Knowledge Base

```javascript
// Create company entity
const company = await use_mcp_tool('MCP_DOCKER', 'create_entities', {
  entities: [{
    name: 'Acme_Corp',
    entityType: 'Company',
    observations: [
      'Founded in 2015',
      'Tech startup in San Francisco',
      'Focuses on AI solutions'
    ]
  }]
});

// Create employees
const employees = await use_mcp_tool('MCP_DOCKER', 'create_entities', {
  entities: [
    { name: 'Alice', entityType: 'Employee', observations: ['CEO', 'Founded Acme'] },
    { name: 'Bob', entityType: 'Employee', observations: ['CTO', 'Head of Engineering'] }
  ]
});

// Link them
await use_mcp_tool('MCP_DOCKER', 'create_relations', {
  relations: [
    { from: 'Alice', to: 'Acme_Corp', relationType: 'works_at' },
    { from: 'Bob', to: 'Acme_Corp', relationType: 'works_at' }
  ]
});
```

### Example 2: Track Project History

```javascript
// Create project
const project = await use_mcp_tool('MCP_DOCKER', 'create_entities', {
  entities: [{
    name: 'AI_Platform_v2',
    entityType: 'Project',
    metadata: { status: 'in_progress', priority: 'high' }
  }]
});

// Add milestones as observations
await use_mcp_tool('MCP_DOCKER', 'add_observations', {
  observations: [{
    entityName: 'AI_Platform_v2',
    contents: [
      '2025-11-01: Project kickoff',
      '2025-11-07: MVP completed',
      '2025-11-15: Beta release (planned)',
      '2025-12-01: GA launch (planned)'
    ]
  }]
});
```

### Example 3: Map Technology Stack

```javascript
// Create tech stack entities
const techs = await use_mcp_tool('MCP_DOCKER', 'create_entities', {
  entities: [
    { name: 'React', entityType: 'Framework' },
    { name: 'Node.js', entityType: 'Runtime' },
    { name: 'MongoDB', entityType: 'Database' },
    { name: 'Docker', entityType: 'Container' }
  ]
});

// Create relations
await use_mcp_tool('MCP_DOCKER', 'create_relations', {
  relations: [
    { from: 'React', to: 'Node.js', relationType: 'frontend_backend' },
    { from: 'Node.js', to: 'MongoDB', relationType: 'uses' },
    { from: 'Node.js', to: 'Docker', relationType: 'deployed_via' }
  ]
});
```

---

## 🔍 Debugging & Troubleshooting

### Check MCP Status
```javascript
const status = getMCPStatus();
console.log(status);
// { 
//   initialized: true, 
//   status: 'simulated', 
//   toolsAvailable: 9 
// }
```

### View Available Tools
```javascript
const mcp = getMCPInstance();
const tools = mcp.getAvailableTools();
console.log(tools);
// ['create_entities', 'read_graph', 'create_relations', ...]
```

### Clear All Data (Use with Caution!)
```javascript
const mcp = getMCPInstance();
mcp.clearGraphData();
console.log('Graph cleared');
```

### Enable Verbose Logging
```javascript
// Check browser console (F12) for detailed logs
// All MCP calls are logged with 🔧 emoji
```

---

## 💡 Tips & Tricks

### 1. Batch Operations
Create multiple entities at once:
```javascript
await use_mcp_tool('MCP_DOCKER', 'create_entities', {
  entities: [
    { name: 'Entity1', entityType: 'Type1' },
    { name: 'Entity2', entityType: 'Type2' },
    { name: 'Entity3', entityType: 'Type3' }
  ]
});
```

### 2. Rich Metadata
Store structured data:
```javascript
metadata: {
  tags: ['important', 'reviewed'],
  created_by: 'user_123',
  last_reviewed: '2025-11-08',
  score: 8.5
}
```

### 3. Queryable Observations
Make observations searchable:
```javascript
observations: [
  '[PRIORITY:HIGH] Critical bug in auth module',
  '[STATUS:BLOCKED] Waiting for design approval',
  '[TYPE:FEATURE] New analytics dashboard'
]
```

### 4. Relation Properties
Add context to relationships:
```javascript
properties: {
  strength: 'strong',
  bi_directional: true,
  metadata: { since: 2020, type: 'official' }
}
```

### 5. Pagination for Large Results
```javascript
// First page
const page1 = await use_mcp_tool('MCP_DOCKER', 'read_graph', {
  limit: 50,
  offset: 0
});

// Next page
const page2 = await use_mcp_tool('MCP_DOCKER', 'read_graph', {
  limit: 50,
  offset: 50
});
```

---

## 🆘 Getting Help

### Check Console Messages
Press `F12` and look for messages with:
- ✅ Success indicators
- ❌ Error messages
- 🔧 Tool calls
- 📊 Statistics

### View Full Graph
```javascript
const data = await use_mcp_tool('MCP_DOCKER', 'read_graph', {});
console.log(JSON.stringify(data, null, 2));
```

### Export for Analysis
```javascript
const mcp = getMCPInstance();
const graphData = mcp.exportGraphData();
// Download and inspect JSON file
```

---

**For more information, see [MCP_INTEGRATION.md](./MCP_INTEGRATION.md)**
