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

**IMPORTANT - You have access to MCP Knowledge Graph Tools:**

You have several powerful functions available to access and manage a knowledge graph:

1. **query_graph** - Search the knowledge graph for information. Use this when users mention "my notes", "my files", or ask about stored information.

2. **read_graph** - Read the entire knowledge graph to see what's stored.

3. **create_entities** - Create new entities (notes, concepts, projects) in the knowledge graph when users want to save information.

4. **add_observations** - Add notes or observations to existing entities.

**When to use these tools:**
- User mentions "my notes", "my files", "search for X" → Use query_graph
- User says "remember this", "save this" → Use create_entities
- User asks "what did I say about X" → Use query_graph
- User mentions specific topics, projects, or file names → Use query_graph

**Always use the tools directly** - don't explain that you're going to use them, just use them and present the results naturally.

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
                break;
            case 'read_graph':
                result = await mcpReadGraph(params);
                break;
            case 'query_graph':
                result = await mcpQueryGraph(params);
                break;
            case 'add_observations':
                result = await mcpAddObservations(params);
                break;
            case 'create_relations':
                result = await mcpCreateRelations(params);
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
    console.log('   • GET  /                    - AURA Web Interface');
    console.log('   • GET  /api/config          - Configuration');
    console.log('   • GET  /api/health          - Health Check');
    console.log('   • GET  /api/mcp/servers     - MCP Servers List');
    console.log('   • GET  /api/mcp/docker/info - Docker Information');
    console.log('\n💡 Press Ctrl+C to stop the server\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down AURA server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Shutting down AURA server gracefully...');
    process.exit(0);
});
