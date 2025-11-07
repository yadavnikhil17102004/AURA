#!/usr/bin/env node

/**
 * AURA - Unified Node.js Server
 * 
 * This server handles:
 * 1. Serving static files (HTML, CSS, JS)
 * 2. Configuration API endpoint (/api/config)
 * 3. MCP Docker bridge API (/api/mcp/*)
 * 
 * Run: node server.js
 */

const express = require('express');
const cors = require('cors');
const Docker = require('dockerode');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { AgentDiscovery } = require('./discovery');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const docker = new Docker();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ==================== Persistent Memory ====================
const GRAPH_DATA_PATH = path.join(__dirname, 'graph-data.json');

function loadGraphFromDisk() {
    try {
        if (fs.existsSync(GRAPH_DATA_PATH)) {
            const data = JSON.parse(fs.readFileSync(GRAPH_DATA_PATH, 'utf8'));
            mcpGraphDB.entities = new Map(data.entities || []);
            mcpGraphDB.relations = new Map(data.relations || []);
            mcpGraphDB.observations = new Map(data.observations || []);
            console.log(`💾 Loaded graph: ${mcpGraphDB.entities.size} entities, ${mcpGraphDB.relations.size} relations`);
        }
    } catch (error) {
        console.error('❌ Error loading graph from disk:', error.message);
    }
}

function saveGraphToDisk() {
    try {
        const data = {
            entities: Array.from(mcpGraphDB.entities.entries()),
            relations: Array.from(mcpGraphDB.relations.entries()),
            observations: Array.from(mcpGraphDB.observations.entries()),
            timestamp: new Date().toISOString()
        };
        fs.writeFileSync(GRAPH_DATA_PATH, JSON.stringify(data, null, 2));
        console.log(`💾 Saved graph: ${mcpGraphDB.entities.size} entities, ${mcpGraphDB.relations.size} relations`);
    } catch (error) {
        console.error('❌ Error saving graph to disk:', error.message);
    }
}

// ==================== Agent Discovery ====================
const registryPath = path.join(__dirname, 'agent-registry.json');
const discovery = new AgentDiscovery(registryPath);
discovery.init();

app.get('/api/agents', (req, res) => {
    try {
        res.json({ success: true, agents: discovery.listAgents() });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Get all available tools for Gemini (built-in + agent tools)
app.get('/api/tools', (req, res) => {
    try {
        const tools = [];
        
        // Built-in MCP tools
        tools.push(
            {
                name: 'query_graph',
                description: 'Search AURA\'s LOCAL memory ONLY. Use this for information the user explicitly told YOU to remember. DO NOT use this for searching user\'s actual notes/files - use agent_Obsidian_* tools for that instead!',
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search query' },
                        entityType: { type: 'string', description: 'Optional entity type filter' },
                        limit: { type: 'number', description: 'Max results (default: 50)' }
                    },
                    required: ['query']
                },
                source: 'builtin',
                priority: 2
            },
            {
                name: 'read_graph',
                description: 'Read AURA\'s LOCAL memory to see what is stored. This shows only information the user explicitly told YOU to remember, NOT their actual notes/files.',
                parameters: {
                    type: 'object',
                    properties: {
                        limit: { type: 'number', description: 'Max entities to return (default: 100)' }
                    }
                },
                source: 'builtin',
                priority: 2
            },
            {
                name: 'create_entities',
                description: 'Save new information to AURA\'s LOCAL memory. Use when user says "remember this" or shares personal info.',
                parameters: {
                    type: 'object',
                    properties: {
                        entities: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    entityType: { type: 'string' },
                                    observations: { type: 'array', items: { type: 'string' } }
                                },
                                required: ['name', 'entityType', 'observations']
                            }
                        }
                    },
                    required: ['entities']
                },
                source: 'builtin',
                priority: 1
            },
            {
                name: 'add_observations',
                description: 'Add observations to existing entities in AURA\'s LOCAL memory.',
                parameters: {
                    type: 'object',
                    properties: {
                        observations: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    entityName: { type: 'string' },
                                    contents: { type: 'array', items: { type: 'string' } }
                                },
                                required: ['entityName', 'contents']
                            }
                        }
                    },
                    required: ['observations']
                },
                source: 'builtin',
                priority: 1
            }
        );
        
        // Add tools from discovered agents (HIGHER PRIORITY for file/note operations!)
        const agents = discovery.listAgents();
        for (const agent of agents) {
            if (agent.tools && agent.tools.length > 0) {
                for (const tool of agent.tools) {
                    // Determine priority based on tool type
                    let priority = 1; // Default high priority for agent tools
                    let enhancedDescription = `[${agent.name}] ${tool.description || tool.name}`;
                    
                    // Give HIGHEST priority to file/note search tools
                    if (agent.name === 'Obsidian' || tool.name.includes('search') || tool.name.includes('file')) {
                        priority = 0; // Highest priority
                        if (tool.name.includes('search')) {
                            enhancedDescription += ' - PREFERRED for searching user\'s actual notes. Use this instead of query_graph when user says "search my notes"!';
                        }
                    }
                    
                    tools.push({
                        name: `agent_${agent.name}_${tool.name}`,
                        description: enhancedDescription,
                        parameters: tool.parameters || {
                            type: 'object',
                            properties: {
                                args: {
                                    type: 'object',
                                    description: 'Arguments for the command'
                                }
                            }
                        },
                        source: 'agent',
                        agentId: agent.name,
                        agentTool: tool.name,
                        priority: priority
                    });
                }
            }
        }
        
        // Sort by priority (0 = highest)
        tools.sort((a, b) => (a.priority || 999) - (b.priority || 999));
        
        res.json({ success: true, tools, count: tools.length });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Send command to a specific agent
app.post('/api/agents/:id/command', async (req, res) => {
    const { id } = req.params;
    const { command, args = {} } = req.body;
    
    try {
        console.log(`📡 Agent Command: ${id} -> ${command}`, args);
        const result = await discovery.sendCommand(id, command, args);
        res.json({ success: true, result });
    } catch (error) {
        console.error(`❌ Agent Command Error (${id}):`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== Configuration API ====================

app.get('/api/config', (req, res) => {
    const config = {
        API_KEY: process.env.API_KEY || '',
        API_PROVIDER: process.env.API_PROVIDER || 'google',
        DEFAULT_MODEL: process.env.DEFAULT_MODEL || 'gemini-2.5-flash',
        AI_NAME: process.env.AI_NAME || 'AURA',
        AI_PERSONALITY: process.env.AI_PERSONALITY || 'personal_assistant',
        SYSTEM_PROMPT: process.env.SYSTEM_PROMPT || `You are AURA, a helpful, friendly, and intelligent personal assistant. Your name stands for "Advanced Universal Reasoning Assistant". You are designed to be:

- Helpful and proactive in solving problems
- Clear and concise in your communication
- Patient and understanding
- Knowledgeable across many topics
- Always focused on being genuinely useful

Your personality traits:
- Warm and approachable
- Efficient and organized
- Curious and learning-oriented
- Respectful of different perspectives
- Supporting and encouraging

When responding:
- Be conversational but professional
- Ask clarifying questions when needed
- Provide practical, actionable advice
- Keep responses focused and relevant
- Show enthusiasm for helping

**IMPORTANT - You have access to Multiple Tool Systems:**

**1. AURA Local Memory (Built-in Tools):**
- query_graph - Search YOUR internal memory (things I told you to remember)
- read_graph - See what is stored in YOUR memory
- create_entities - Save new information to YOUR memory
- add_observations - Add notes to YOUR memory

**2. External MCP Agents (Dynamically Loaded):**
You ALSO have access to external tools that are discovered at runtime. These start with agent_ prefix.

Examples:
- agent_LocalSimulator_ping - Test tool
- agent_Obsidian_simple_search - Search the user ACTUAL Obsidian notes
- agent_Obsidian_get_file_contents - Read actual note files
- MORE tools appear as MCP servers are discovered!

**CRITICAL DISTINCTION:**

User asks "search my notes for SOC":
- DON'T use query_graph (that is YOUR memory, not their notes!)
- DO use agent_Obsidian_simple_search or similar Obsidian tool

User asks "what is my name":
- DO use query_graph to check YOUR memory first
- This retrieves info YOU previously saved

User says "remember that I like pizza":
- DO use create_entities to save to YOUR memory

**Tool Selection Rules (PRIORITY ORDER):**

When user asks to "search my notes" or "read my files":
1. FIRST CHECK: Is agent_Obsidian_simple_search available? → USE IT (user's actual notes!)
2. FALLBACK: If no Obsidian agent → Use query_graph and explain you only have YOUR memory

When user asks about personal info (name, preferences):
1. FIRST: Use query_graph to check YOUR memory
2. If not found: Say you don't know and offer to remember it

When user wants to save something:
1. ALWAYS use create_entities to save to YOUR memory

**CRITICAL PRIORITY:**
- User says "search my notes" → agent_Obsidian_simple_search (NOT query_graph!)
- User says "what do you know about me" → query_graph (YOUR memory)
- User says "remember this" → create_entities (save to YOUR memory)

**Dynamic Tool Discovery:**
Tools load at runtime! Check what's available:
- If you see agent_Obsidian_* → Use it for notes/files
- If you see agent_Puppeteer_* → Use it for browser tasks
- If you see agent_Fetch_* → Use it for web scraping
- If you only have query_graph → Use it and explain limitations

**Always use tools directly** - don't explain you are using them, just present results naturally.

Remember: You are AURA, and you're here to make the user's life easier and more productive!`
    };
    
    res.json(config);
});

// ==================== MCP Docker Bridge API ====================

// In-memory graph database for MCP simulation
const mcpGraphDB = {
    entities: new Map(),
    relations: new Map(),
    observations: new Map()
};

// Load graph on startup
loadGraphFromDisk();

// Execute MCP tool
app.post('/api/mcp/tool/:toolName', async (req, res) => {
    const { toolName } = req.params;
    const params = req.body;
    
    try {
        console.log(`🔧 MCP Tool Called: ${toolName}`, params);
        
        let result;
        switch(toolName) {
            case 'create_entities':
                result = await mcpCreateEntities(params);
                saveGraphToDisk(); // Auto-save after modification
                break;
            case 'read_graph':
                result = await mcpReadGraph(params);
                break;
            case 'query_graph':
                result = await mcpQueryGraph(params);
                break;
            case 'add_observations':
                result = await mcpAddObservations(params);
                saveGraphToDisk(); // Auto-save after modification
                break;
            case 'create_relations':
                result = await mcpCreateRelations(params);
                saveGraphToDisk(); // Auto-save after modification
                break;
            case 'list_resources':
                result = await mcpListResources(params);
                break;
            case 'debug_graph':
                result = await mcpDebugGraph();
                break;
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
        
        res.json({ success: true, result });
    } catch (error) {
        console.error(`❌ MCP Tool Error (${toolName}):`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug graph dump
function mcpDebugGraph() {
    return {
        entities: Array.from(mcpGraphDB.entities.values()),
        relations: Array.from(mcpGraphDB.relations.values()),
        observations: Array.from(mcpGraphDB.observations.values())
    };
}

// MCP Tool Implementations
async function mcpCreateEntities(params) {
    const { entities = [] } = params;
    const created = [];
    
    for (const entity of entities) {
        const entityId = `${entity.name || 'entity'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const entityData = {
            id: entityId,
            name: entity.name,
            entityType: entity.entityType,
            observations: entity.observations || [],
            createdAt: new Date().toISOString(),
            metadata: entity.metadata || {}
        };
        
        mcpGraphDB.entities.set(entityId, entityData);
        created.push(entityData);
    }
    
    return {
        success: true,
        entities_created: created.length,
        entities: created
    };
}

async function mcpReadGraph(params) {
    const { limit = 100, offset = 0 } = params;
    const entities = Array.from(mcpGraphDB.entities.values()).slice(offset, offset + limit);
    const relations = Array.from(mcpGraphDB.relations.values()).slice(offset, offset + limit);
    
    return {
        success: true,
        graph: {
            entities,
            relations,
            total_entities: mcpGraphDB.entities.size,
            total_relations: mcpGraphDB.relations.size
        }
    };
}

async function mcpQueryGraph(params) {
    const { query = '', entityType = null, limit = 50, includeObservations = true } = params;
    const results = [];

    const normalizedQuery = query.trim().toLowerCase();

    // Search entities
    for (const entity of mcpGraphDB.entities.values()) {
        const matchesQuery = !normalizedQuery ||
            entity.name.toLowerCase().includes(normalizedQuery) ||
            (entity.observations && entity.observations.some(obs =>
                typeof obs === 'string' && obs.toLowerCase().includes(normalizedQuery)
            ));

        const matchesType = !entityType || entity.entityType === entityType;

        if (matchesQuery && matchesType) {
            results.push({
                resultType: 'entity',
                id: entity.id,
                name: entity.name,
                entityType: entity.entityType,
                observations: entity.observations || []
            });
            if (results.length >= limit) break;
        }
    }

    // Search standalone observations (not already included)
    if (includeObservations && results.length < limit) {
        for (const obs of mcpGraphDB.observations.values()) {
            const matches = !normalizedQuery ||
                obs.entityName.toLowerCase().includes(normalizedQuery) ||
                (obs.contents && obs.contents.some(c => c.toLowerCase().includes(normalizedQuery)));
            if (matches) {
                results.push({
                    resultType: 'observation',
                    id: obs.id,
                    entityName: obs.entityName,
                    contents: obs.contents,
                    timestamp: obs.timestamp
                });
                if (results.length >= limit) break;
            }
        }
    }

    return {
        success: true,
        results,
        count: results.length,
        query: query
    };
}

async function mcpAddObservations(params) {
    const { observations = [] } = params;
    const added = [];
    
    for (const obs of observations) {
        const obsId = `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const obsData = {
            id: obsId,
            entityName: obs.entityName,
            contents: obs.contents || [],
            timestamp: new Date().toISOString()
        };
        
        mcpGraphDB.observations.set(obsId, obsData);
        added.push(obsData);

        // Also attach observations to the entity if it exists
        for (const entity of mcpGraphDB.entities.values()) {
            if (entity.name === obs.entityName) {
                entity.observations = entity.observations || [];
                obs.contents.forEach(c => entity.observations.push(c));
            }
        }
    }
    
    return {
        success: true,
        observations_added: added.length,
        observations: added
    };
}

async function mcpCreateRelations(params) {
    const { relations = [] } = params;
    const created = [];
    
    for (const relation of relations) {
        const relationId = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const relationData = {
            id: relationId,
            from: relation.from,
            to: relation.to,
            relationType: relation.relationType,
            properties: relation.properties || {},
            createdAt: new Date().toISOString()
        };
        
        mcpGraphDB.relations.set(relationId, relationData);
        created.push(relationData);
    }
    
    return {
        success: true,
        relations_created: created.length,
        relations: created
    };
}

async function mcpListResources(params) {
    const { type = 'all' } = params;
    let resources = [];
    
    if (type === 'all' || type === 'entities') {
        resources = resources.concat(
            Array.from(mcpGraphDB.entities.values()).map(e => ({
                type: 'entity',
                name: e.name,
                id: e.id
            }))
        );
    }
    
    if (type === 'all' || type === 'relations') {
        resources = resources.concat(
            Array.from(mcpGraphDB.relations.values()).map(r => ({
                type: 'relation',
                name: `${r.from} -> ${r.to}`,
                id: r.id
            }))
        );
    }
    
    return {
        success: true,
        resources,
        count: resources.length
    };
}

// Get list of available MCP servers from Docker
app.get('/api/mcp/servers', async (req, res) => {
    try {
        const images = await docker.listImages();
        const mcpServers = [];

        for (const image of images) {
            const tags = image.RepoTags || [];
            
            for (const tag of tags) {
                // Look for images that might be MCP servers
                if (tag.includes('mcp') || tag.includes('model-context-protocol')) {
                    const [name, version] = tag.split(':');
                    
                    mcpServers.push({
                        id: `docker_${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        name: name.split('/').pop(),
                        image: tag,
                        version: version || 'latest',
                        status: 'available',
                        type: 'docker'
                    });
                }
            }
        }

        res.json({
            success: true,
            servers: mcpServers,
            count: mcpServers.length
        });
    } catch (error) {
        console.error('Error listing Docker images:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            servers: []
        });
    }
});

// Get Docker system info
app.get('/api/mcp/docker/info', async (req, res) => {
    try {
        const info = await docker.info();
        res.json({
            success: true,
            docker: {
                available: true,
                version: info.ServerVersion,
                containers: info.Containers,
                images: info.Images
            }
        });
    } catch (error) {
        res.json({
            success: false,
            docker: {
                available: false,
                error: error.message
            }
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AURA Server',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ==================== Start Server ====================

app.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log('✨  AURA Server Started Successfully!');
    console.log('🚀 ========================================\n');
    console.log(`📡 Server running at: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 AI Provider: ${process.env.API_PROVIDER || 'google'}`);
    console.log(`🧠 Model: ${process.env.DEFAULT_MODEL || 'gemini-2.5-flash'}`);
    console.log('\n📋 Available Endpoints:');
    console.log('   • GET  /                       - AURA Web Interface');
    console.log('   • GET  /api/config             - Configuration');
    console.log('   • GET  /api/health             - Health Check');
    console.log('   • GET  /api/agents             - List discovered agents');
    console.log('   • POST /api/agents/:id/command - Send command to agent');
    console.log('   • GET  /api/mcp/servers        - MCP Servers List');
    console.log('   • GET  /api/mcp/docker/info    - Docker Information');
    console.log('\n💡 Press Ctrl+C to stop the server\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down AURA server gracefully...');
    saveGraphToDisk(); // Save before exit
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Shutting down AURA server gracefully...');
    saveGraphToDisk(); // Save before exit
    process.exit(0);
});
