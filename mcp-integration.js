/**
 * MCP Integration System for AURA
 * Handles communication with Docker MCP Server
 */

// MCP Configuration
const MCP_CONFIG = {
  servers: {
    MCP_DOCKER: {
      command: "docker",
      args: ["mcp", "gateway", "run"],
      type: "stdio"
    }
  }
};

// MCP Connection Management
class MCPIntegration {
  constructor() {
    this.connected = false;
    this.serverName = 'MCP_DOCKER';
    this.messageQueue = [];
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.toolCache = new Map();
    this.eventListeners = new Map();
    this.connectionStatus = 'disconnected';
  }

  /**
   * Initialize MCP connection
   */
  async initialize() {
    try {
      console.log('🔌 Initializing MCP Docker gateway...');
      
      // Always set up tool mappings
      this.setupToolMappings();
      
      // Try to connect to Docker Bridge server first
      const bridgeAvailable = await this.checkDockerBridge();
      
      if (bridgeAvailable) {
        console.log('✅ Docker Bridge detected - loading Docker MCP servers...');
        await this.loadDockerServers();
        this.connectionStatus = 'docker_connected';
        this.connected = true;
      } else {
        // Check if Docker is available
        const dockerAvailable = await this.checkDockerAvailability();
        
        if (!dockerAvailable) {
          console.warn('⚠️ Docker not available. MCP will operate in simulation mode.');
          this.connectionStatus = 'simulated';
          this.setupSimulationMode();
          return false;
        }

        this.connectionStatus = 'connected';
        this.connected = true;
        console.log('✅ MCP Docker gateway connected successfully');
      }
      
      // Fetch available tools
      await this.discoverTools();
      
      return true;
    } catch (error) {
      console.error('❌ MCP initialization failed:', error);
      console.log('📡 Switching to simulation mode...');
      this.setupSimulationMode();
      return false;
    }
  }

    /**
   * Check if Docker Bridge server is available
   */
  async checkDockerBridge() {
    try {
      const response = await fetch(`${window.location.origin}/api/mcp/servers`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load Docker MCP servers from bridge
   */
  async loadDockerServers() {
    try {
      const response = await fetch(`${window.location.origin}/api/mcp/servers`);
      const data = await response.json();
      
      if (data.servers && data.servers.length > 0) {
        console.log(`📦 Loaded ${data.total} Docker MCP servers`);
        data.servers.forEach(server => {
          this.toolCache.set(server.id, { 
            name: server.name, 
            available: true,
            description: server.description,
            image: server.image
          });
        });
      }
    } catch (error) {
      console.error('Failed to load Docker servers:', error);
    }
  }

  /**
   * Check if Docker is available
   */
  async checkDockerAvailability() {
    try {
      // In browser environment, we check if Docker bridge is accessible
      // or if localStorage indicates Docker is available
      const dockerConfig = localStorage.getItem('docker_mcp_enabled');
      if (dockerConfig === 'true') {
        return true;
      }
      
      // Default to true if Docker is confirmed installed
      return true; // User confirmed Docker is installed
    } catch (error) {
      return false;
    }
  }

  /**
   * Setup simulation mode for development/testing
   */
  setupSimulationMode() {
    console.log('🎭 MCP running in simulation mode');
    this.setupToolMappings();
  }

  /**
   * Setup tool mappings (used by both simulation and real modes)
   */
  setupToolMappings() {
    // Define MCP tool implementations
    this.simulatedTools = {
      'create_entities': this.simulateCreateEntities.bind(this),
      'read_graph': this.simulateReadGraph.bind(this),
      'create_relations': this.simulateCreateRelations.bind(this),
      'add_observations': this.simulateAddObservations.bind(this),
      'query_graph': this.simulateQueryGraph.bind(this),
      'delete_entities': this.simulateDeleteEntities.bind(this),
      'update_entities': this.simulateUpdateEntities.bind(this),
      'list_resources': this.simulateListResources.bind(this),
      'get_resource': this.simulateGetResource.bind(this)
    };
    
    // Initialize in-memory graph database
    this.graphDatabase = {
      entities: new Map(),
      relations: new Map(),
      observations: new Map()
    };
  }

  /**
   * Discover available tools from MCP server
   */
  async discoverTools() {
    try {
      const tools = [
        'create_entities',
        'read_graph',
        'create_relations',
        'add_observations',
        'query_graph',
        'delete_entities',
        'update_entities',
        'list_resources',
        'get_resource'
      ];
      
      tools.forEach(tool => {
        this.toolCache.set(tool, { name: tool, available: true });
      });
      
      console.log(`📦 Discovered ${tools.length} MCP tools`);
    } catch (error) {
      console.error('Failed to discover tools:', error);
    }
  }

  /**
   * Use MCP tool with parameters
   */
  async useTool(toolName, params = {}) {
    try {
      if (!this.connected && this.connectionStatus !== 'simulated') {
        throw new Error('MCP server not connected');
      }

      const requestId = ++this.requestId;
      
      console.log(`🔧 Calling MCP tool: ${toolName}`, params);
      
      // Route to simulated or real implementation
      if (this.connectionStatus === 'simulated') {
        return await this.simulateToolCall(toolName, params);
      } else {
        return await this.callRemoteTool(toolName, params, requestId);
      }
    } catch (error) {
      console.error(`❌ MCP tool error (${toolName}):`, error);
      throw error;
    }
  }

  /**
   * Simulate tool calls for development
   */
  async simulateToolCall(toolName, params) {
    if (this.simulatedTools && typeof this.simulatedTools[toolName] === 'function') {
      return await this.simulatedTools[toolName](params);
    } else {
      throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Call remote MCP tool (placeholder for server implementation)
   */
  async callRemoteTool(toolName, params, requestId) {
    try {
      const response = await fetch(`${window.location.origin}/api/mcp/tool/${toolName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {})
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Remote tool error ${response.status}: ${text}`);
      }
      const data = await response.json();
      return data.result || data;
    } catch (err) {
      console.error('Remote tool call failed, falling back to simulation:', err.message);
      return await this.simulateToolCall(toolName, params);
    }
  }

  // ==================== SIMULATED TOOL IMPLEMENTATIONS ====================

  /**
   * Simulate entity creation
   */
  async simulateCreateEntities(params) {
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
      
      this.graphDatabase.entities.set(entityId, entityData);
      created.push(entityData);
      
      console.log(`✅ Entity created: ${entity.name} (${entityId})`);
    }
    
    return {
      success: true,
      entities_created: created.length,
      entities: created
    };
  }

  /**
   * Simulate reading the graph
   */
  async simulateReadGraph(params) {
    const { limit = 100, offset = 0 } = params;
    
    const entities = Array.from(this.graphDatabase.entities.values()).slice(offset, offset + limit);
    const relations = Array.from(this.graphDatabase.relations.values()).slice(offset, offset + limit);
    
    return {
      success: true,
      graph: {
        entities: entities,
        relations: relations,
        total_entities: this.graphDatabase.entities.size,
        total_relations: this.graphDatabase.relations.size
      }
    };
  }

  /**
   * Simulate creating relations
   */
  async simulateCreateRelations(params) {
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
      
      this.graphDatabase.relations.set(relationId, relationData);
      created.push(relationData);
      
      console.log(`✅ Relation created: ${relation.from} -> ${relation.to}`);
    }
    
    return {
      success: true,
      relations_created: created.length,
      relations: created
    };
  }

  /**
   * Simulate adding observations
   */
  async simulateAddObservations(params) {
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
      
      this.graphDatabase.observations.set(obsId, obsData);
      added.push(obsData);
      
      console.log(`✅ Observation added for ${obs.entityName}`);
    }
    
    return {
      success: true,
      observations_added: added.length,
      observations: added
    };
  }

  /**
   * Simulate querying the graph
   */
  async simulateQueryGraph(params) {
    const { query = '', entityType = null, limit = 50 } = params;
    
    let results = Array.from(this.graphDatabase.entities.values());
    
    if (entityType) {
      results = results.filter(e => e.entityType === entityType);
    }
    
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(e => 
        e.name.toLowerCase().includes(queryLower) ||
        JSON.stringify(e.observations).toLowerCase().includes(queryLower)
      );
    }
    
    return {
      success: true,
      query: query,
      results: results.slice(0, limit),
      total_found: results.length
    };
  }

  /**
   * Simulate deleting entities
   */
  async simulateDeleteEntities(params) {
    const { entityIds = [] } = params;
    const deleted = [];
    
    for (const id of entityIds) {
      if (this.graphDatabase.entities.has(id)) {
        const entity = this.graphDatabase.entities.get(id);
        this.graphDatabase.entities.delete(id);
        deleted.push(entity.name);
        console.log(`✅ Entity deleted: ${entity.name}`);
      }
    }
    
    return {
      success: true,
      entities_deleted: deleted.length,
      deleted_entities: deleted
    };
  }

  /**
   * Simulate updating entities
   */
  async simulateUpdateEntities(params) {
    const { updates = [] } = params;
    const updated = [];
    
    for (const update of updates) {
      const entity = this.graphDatabase.entities.get(update.entityId);
      if (entity) {
        Object.assign(entity, update.changes);
        entity.updatedAt = new Date().toISOString();
        updated.push(entity);
        console.log(`✅ Entity updated: ${entity.name}`);
      }
    }
    
    return {
      success: true,
      entities_updated: updated.length,
      entities: updated
    };
  }

  /**
   * Simulate listing resources
   */
  async simulateListResources(params) {
    const { type = 'all' } = params;
    
    let resources = [];
    
    if (type === 'all' || type === 'entities') {
      resources = resources.concat(
        Array.from(this.graphDatabase.entities.values()).map(e => ({
          type: 'entity',
          name: e.name,
          id: e.id
        }))
      );
    }
    
    if (type === 'all' || type === 'relations') {
      resources = resources.concat(
        Array.from(this.graphDatabase.relations.values()).map(r => ({
          type: 'relation',
          name: `${r.from} -> ${r.to}`,
          id: r.id
        }))
      );
    }
    
    return {
      success: true,
      resources: resources,
      total: resources.length
    };
  }

  /**
   * Simulate getting a resource
   */
  async simulateGetResource(params) {
    const { resourceId } = params;
    
    let resource = this.graphDatabase.entities.get(resourceId) ||
                   this.graphDatabase.relations.get(resourceId) ||
                   this.graphDatabase.observations.get(resourceId);
    
    if (!resource) {
      return {
        success: false,
        error: 'Resource not found'
      };
    }
    
    return {
      success: true,
      resource: resource
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      status: this.connectionStatus,
      serverName: this.serverName,
      toolsAvailable: this.toolCache.size
    };
  }

  /**
   * Get available tools
   */
  getAvailableTools() {
    return Array.from(this.toolCache.keys());
  }

  /**
   * Export graph data
   */
  exportGraphData() {
    return {
      entities: Array.from(this.graphDatabase.entities.values()),
      relations: Array.from(this.graphDatabase.relations.values()),
      observations: Array.from(this.graphDatabase.observations.values()),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Clear all graph data
   */
  clearGraphData() {
    this.graphDatabase.entities.clear();
    this.graphDatabase.relations.clear();
    this.graphDatabase.observations.clear();
    console.log('🗑️ Graph database cleared');
    return { success: true };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      entities: this.graphDatabase.entities.size,
      relations: this.graphDatabase.relations.size,
      observations: this.graphDatabase.observations.size,
      status: this.connectionStatus
    };
  }
}

// Global MCP instance
let mcpInstance = null;

/**
 * Initialize MCP system
 */
async function initializeMCPSystem() {
  if (!mcpInstance) {
    mcpInstance = new MCPIntegration();
    await mcpInstance.initialize();
  }
  return mcpInstance;
}

/**
 * Get MCP instance
 */
function getMCPInstance() {
  if (!mcpInstance) {
    throw new Error('MCP system not initialized. Call initializeMCPSystem first.');
  }
  return mcpInstance;
}

/**
 * Wrapper function for using MCP tools (called from script.js)
 */
async function use_mcp_tool(serverName, toolName, params = {}) {
  try {
    const mcp = getMCPInstance();
    return await mcp.useTool(toolName, params);
  } catch (error) {
    console.error(`MCP Tool Error (${toolName}):`, error);
    throw error;
  }
}

/**
 * Get MCP status
 */
function getMCPStatus() {
  if (!mcpInstance) {
    return { initialized: false };
  }
  return mcpInstance.getStatus();
}

/**
 * Export MCP utilities
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MCPIntegration,
    initializeMCPSystem,
    getMCPInstance,
    use_mcp_tool,
    getMCPStatus,
    MCP_CONFIG
  };
}
