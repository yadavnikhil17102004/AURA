/**
 * MCP Docker Auto-Configuration System
 * Automatically detects and configures available Docker MCP servers
 */

class MCPDockerAutoConfig {
  constructor() {
    this.configFile = 'mcp-config.json';
    this.dockerPath = '/var/run/docker.sock'; // Docker socket on macOS/Linux
    this.detectedServers = new Map();
    this.lastSyncTime = null;
    this.syncInterval = 30000; // 30 seconds
  }

  /**
   * Initialize auto-configuration
   */
  async initialize() {
    console.log('🔧 MCP Docker Auto-Config Initializing...');
    
    try {
      // Fetch current Docker MCP servers
      await this.detectDockerMCPServers();
      
      // Setup periodic sync
      this.startAutoSync();
      
      console.log('✅ MCP Docker Auto-Config Ready');
      return true;
    } catch (error) {
      console.error('❌ MCP Auto-Config error:', error);
      return false;
    }
  }

  /**
   * Detect available Docker MCP servers
   */
  async detectDockerMCPServers() {
    try {
      console.log('🔍 Scanning for Docker MCP servers...');
      
      // Fetch the Docker image list
      const response = await fetch('/api/docker/images');
      
      if (!response.ok) {
        // If API not available, use fallback
        await this.detectFromLocalStorage();
        return;
      }
      
      const images = await response.json();
      this.parseDockerImages(images);
      
    } catch (error) {
      console.warn('⚠️ Could not fetch Docker images via API:', error);
      await this.detectFromLocalStorage();
    }
  }

  /**
   * Parse Docker images and identify MCP servers
   */
  parseDockerImages(images) {
    const mcpServers = {};
    
    // Common MCP image patterns
    const mcpPatterns = {
      'playwright': { name: 'Playwright', description: 'Browser automation' },
      'elevenlabs': { name: 'ElevenLabs', description: 'Text-to-speech' },
      'obsidian': { name: 'Obsidian', description: 'Note management' },
      'fetch': { name: 'Fetch', description: 'HTTP requests' },
      'context7': { name: 'Context7', description: 'Code context' },
      'puppeteer': { name: 'Puppeteer', description: 'Headless browser' },
      'sequentialthinking': { name: 'Sequential Thinking', description: 'Reasoning' },
      'memory': { name: 'Memory', description: 'Persistent storage' }
    };
    
    images.forEach(image => {
      const imageName = image.name || image.RepoTags?.[0] || '';
      
      // Check against known patterns
      for (const [pattern, config] of Object.entries(mcpPatterns)) {
        if (imageName.toLowerCase().includes(pattern)) {
          const serverId = `MCP_${pattern.toUpperCase()}`;
          
          mcpServers[serverId] = {
            name: config.name,
            image: imageName,
            command: 'docker',
            args: ['run', '--rm', imageName],
            type: 'stdio',
            description: config.description,
            detected: new Date().toISOString(),
            imageId: image.Id || image.imageId
          };
          
          console.log(`✅ Found MCP Server: ${config.name} (${imageName})`);
        }
      }
    });
    
    this.detectedServers = new Map(Object.entries(mcpServers));
    this.saveConfiguration(mcpServers);
  }

  /**
   * Detect from localStorage if API not available
   */
  async detectFromLocalStorage() {
    console.log('📦 Loading MCP servers from cache...');
    
    const cached = localStorage.getItem('mcp_servers_cache');
    if (cached) {
      const servers = JSON.parse(cached);
      this.detectedServers = new Map(Object.entries(servers));
      console.log(`📦 Loaded ${this.detectedServers.size} cached MCP servers`);
    }
  }

  /**
   * Save configuration to localStorage and file
   */
  saveConfiguration(mcpServers) {
    const config = {
      servers: mcpServers,
      lastUpdated: new Date().toISOString(),
      autoDetected: true
    };
    
    // Save to localStorage
    localStorage.setItem('mcp_servers_cache', JSON.stringify(mcpServers));
    localStorage.setItem('mcp_config', JSON.stringify(config));
    
    // Update global configuration
    if (window.MCP_CONFIG) {
      window.MCP_CONFIG.servers = mcpServers;
      window.MCP_CONFIG.lastUpdated = config.lastUpdated;
    }
    
    console.log(`💾 MCP Configuration saved (${Object.keys(mcpServers).length} servers)`);
  }

  /**
   * Start periodic auto-sync
   */
  startAutoSync() {
    setInterval(async () => {
      try {
        await this.detectDockerMCPServers();
      } catch (error) {
        console.error('Auto-sync error:', error);
      }
    }, this.syncInterval);
  }

  /**
   * Get all detected servers
   */
  getDetectedServers() {
    return Array.from(this.detectedServers.entries()).map(([id, config]) => ({
      id,
      ...config
    }));
  }

  /**
   * Get server by ID
   */
  getServer(serverId) {
    return this.detectedServers.get(serverId);
  }

  /**
   * Add custom server
   */
  addCustomServer(serverId, config) {
    this.detectedServers.set(serverId, config);
    this.saveConfiguration(Object.fromEntries(this.detectedServers));
    console.log(`✅ Custom server added: ${serverId}`);
  }

  /**
   * Remove server
   */
  removeServer(serverId) {
    this.detectedServers.delete(serverId);
    this.saveConfiguration(Object.fromEntries(this.detectedServers));
    console.log(`🗑️ Server removed: ${serverId}`);
  }

  /**
   * Get configuration as JSON
   */
  getConfigJSON() {
    return {
      servers: Object.fromEntries(this.detectedServers),
      lastUpdated: new Date().toISOString(),
      totalServers: this.detectedServers.size
    };
  }
}

// Global instance
let mcpAutoConfig = null;

/**
 * Initialize MCP Auto-Config
 */
async function initializeMCPAutoConfig() {
  if (!mcpAutoConfig) {
    mcpAutoConfig = new MCPDockerAutoConfig();
    await mcpAutoConfig.initialize();
  }
  return mcpAutoConfig;
}

/**
 * Get MCP Auto-Config instance
 */
function getMCPAutoConfig() {
  if (!mcpAutoConfig) {
    throw new Error('MCP Auto-Config not initialized');
  }
  return mcpAutoConfig;
}

/**
 * Export for use
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MCPDockerAutoConfig,
    initializeMCPAutoConfig,
    getMCPAutoConfig
  };
}
