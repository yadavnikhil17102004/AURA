#!/usr/bin/env node

/**
 * AURA MCP Docker Bridge Server
 * Bridges browser communication with Docker MCP servers
 * Run this server alongside your AURA application
 */

const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

class MCPDockerBridge {
  constructor(port = 3000) {
    this.port = port;
    this.server = null;
    this.mcpServers = new Map();
    this.detectionInterval = 30000; // 30 seconds
  }

  /**
   * Start the bridge server
   */
  async start() {
    console.log('🚀 Starting MCP Docker Bridge Server...');
    
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });
    
    this.server.listen(this.port, () => {
      console.log(`✅ MCP Bridge Server running on http://localhost:${this.port}`);
    });
    
    // Start auto-detection
    this.startAutoDetection();
  }

  /**
   * Handle HTTP requests
   */
  async handleRequest(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    try {
      if (pathname === '/api/docker/images') {
        await this.getDockerImages(res);
      } else if (pathname === '/api/mcp/servers') {
        this.getMCPServers(res);
      } else if (pathname === '/api/mcp/config') {
        this.getMCPConfig(res);
      } else if (pathname === '/api/docker/ps') {
        await this.getDockerProcesses(res);
      } else if (pathname === '/api/docker/logs') {
        const serverId = url.searchParams.get('server');
        await this.getDockerLogs(serverId, res);
      } else if (pathname === '/api/mcp/exec' && req.method === 'POST') {
        await this.executeMCPCommand(req, res);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      console.error('Request error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  /**
   * Get Docker images (especially MCP ones)
   */
  async getDockerImages(res) {
    try {
      const { stdout } = await execAsync('docker images --format "{{json .}}"');
      const images = stdout
        .split('\n')
        .filter(line => line)
        .map(line => JSON.parse(line));

      const mcpImages = images.filter(img => 
        img.Repository.includes('mcp') || img.Repository.includes('MCP')
      );

      res.writeHead(200);
      res.end(JSON.stringify({
        total: images.length,
        mcp_total: mcpImages.length,
        mcp_images: mcpImages,
        all_images: images
      }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  /**
   * Get running Docker containers
   */
  async getDockerProcesses(res) {
    try {
      const { stdout } = await execAsync('docker ps --format "{{json .}}"');
      const containers = stdout
        .split('\n')
        .filter(line => line)
        .map(line => JSON.parse(line));

      res.writeHead(200);
      res.end(JSON.stringify({
        running: containers.length,
        containers: containers
      }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  /**
   * Get Docker logs for a container
   */
  async getDockerLogs(serverId, res) {
    try {
      const { stdout } = await execAsync(`docker logs ${serverId} --tail 100`);
      res.writeHead(200);
      res.end(JSON.stringify({
        server: serverId,
        logs: stdout
      }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  /**
   * Get MCP servers map
   */
  getMCPServers(res) {
    const servers = Array.from(this.mcpServers.entries()).map(([id, config]) => ({
      id,
      ...config
    }));

    res.writeHead(200);
    res.end(JSON.stringify({
      total: servers.length,
      servers: servers
    }));
  }

  /**
   * Get MCP configuration
   */
  getMCPConfig(res) {
    const config = {
      servers: Object.fromEntries(this.mcpServers),
      lastDetected: new Date().toISOString(),
      total: this.mcpServers.size
    };

    res.writeHead(200);
    res.end(JSON.stringify(config));
  }

  /**
   * Execute MCP command
   */
  async executeMCPCommand(req, res) {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const { server, command, args } = JSON.parse(body);
        
        const fullCommand = `docker run --rm ${server} ${command} ${args.join(' ')}`;
        const { stdout } = await execAsync(fullCommand);

        res.writeHead(200);
        res.end(JSON.stringify({
          server,
          command,
          output: stdout
        }));
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }

  /**
   * Start auto-detection of MCP servers
   */
  startAutoDetection() {
    this.detectMCPServers();
    
    setInterval(() => {
      this.detectMCPServers();
    }, this.detectionInterval);
  }

  /**
   * Detect available MCP servers from Docker images
   */
  async detectMCPServers() {
    try {
      const { stdout } = await execAsync('docker images --format "{{json .}}"');
      
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

      const images = stdout
        .split('\n')
        .filter(line => line)
        .map(line => JSON.parse(line));

      this.mcpServers.clear();

      images.forEach(image => {
        const repo = image.Repository || '';
        
        for (const [pattern, config] of Object.entries(mcpPatterns)) {
          if (repo.toLowerCase().includes(pattern)) {
            const serverId = `MCP_${pattern.toUpperCase()}`;
            this.mcpServers.set(serverId, {
              name: config.name,
              description: config.description,
              image: repo,
              tag: image.Tag || 'latest',
              imageId: image.ID,
              size: image.Size,
              created: image.CreatedAt,
              detected: new Date().toISOString()
            });
          }
        }
      });

      console.log(`🔍 Detected ${this.mcpServers.size} MCP servers`);
    } catch (error) {
      console.error('Detection error:', error.message);
    }
  }

  /**
   * Stop the server
   */
  stop() {
    if (this.server) {
      this.server.close();
      console.log('✅ MCP Bridge Server stopped');
    }
  }
}

// Start the server
if (require.main === module) {
  const port = process.env.MCP_BRIDGE_PORT || 3000;
  const bridge = new MCPDockerBridge(port);
  
  bridge.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    bridge.stop();
    process.exit(0);
  });
}

module.exports = MCPDockerBridge;
