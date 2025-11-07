/**
 * Agent Discovery Module
 * Loads agent-registry.json, spawns autoStart agents, listens for JSON handshake lines.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const EventEmitter = require('events');

class AgentDiscovery extends EventEmitter {
  constructor(registryPath) {
    super();
    this.registryPath = registryPath;
    this.agents = new Map(); // name -> agent info
    this.processes = new Map(); // name -> child process
  }

  loadRegistry() {
    try {
      const raw = fs.readFileSync(this.registryPath, 'utf8');
      const json = JSON.parse(raw);
      this.registry = json.agents || {};
      return true;
    } catch (e) {
      console.error('Failed to load agent registry:', e.message);
      this.registry = {};
      return false;
    }
  }

  async init() {
    this.loadRegistry();
    for (const [name, cfg] of Object.entries(this.registry)) {
      if (cfg.autoStart) {
        this.spawnAgent(name, cfg);
      }
    }
  }

  spawnAgent(name, cfg) {
    const child = spawn(cfg.command, cfg.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...(cfg.env || {}) },
      cwd: path.dirname(this.registryPath)
    });

    this.processes.set(name, child);

    let buffered = '';
    child.stdout.on('data', chunk => {
      buffered += chunk.toString();
      const lines = buffered.split(/\n/);
      buffered = lines.pop(); // keep incomplete
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          if (msg.type === 'register') {
            const agentInfo = {
              name: msg.name || name,
              capabilities: msg.capabilities || [],
              tools: msg.tools || [],
              version: msg.version || 'unknown',
              protocol: msg.protocol || 'unknown',
              status: 'online',
              pid: child.pid,
              description: cfg.description
            };
            this.agents.set(name, agentInfo);
            this.emit('agent-registered', agentInfo);
          } else {
            this.emit('agent-message', { name, msg });
          }
        } catch (err) {
          this.emit('agent-error', { name, error: err.message, raw: trimmed });
        }
      }
    });

    child.stderr.on('data', d => {
      this.emit('agent-stderr', { name, data: d.toString() });
    });

    child.on('exit', code => {
      const info = this.agents.get(name);
      if (info) info.status = 'exited';
      this.emit('agent-exit', { name, code });
    });
  }

  listAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Send a command to a specific agent via STDIO
   * @param {string} name - Agent name
   * @param {string} command - Command to execute
   * @param {object} args - Command arguments
   * @returns {Promise<any>} - Command result
   */
  async sendCommand(name, command, args = {}) {
    return new Promise((resolve, reject) => {
      const process = this.processes.get(name);
      const agent = this.agents.get(name);

      if (!process || !agent) {
        return reject(new Error(`Agent "${name}" not found or not running`));
      }

      if (agent.status !== 'online') {
        return reject(new Error(`Agent "${name}" is not online (status: ${agent.status})`));
      }

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const request = {
        type: 'command',
        id: requestId,
        command,
        args,
        timestamp: new Date().toISOString()
      };

      // Set up timeout
      const timeout = setTimeout(() => {
        listener.off('agent-message', responseHandler);
        reject(new Error(`Command timeout for agent "${name}"`));
      }, 30000); // 30s timeout

      // Listen for response
      const listener = this;
      const responseHandler = ({ name: respName, msg }) => {
        if (respName === name && msg.type === 'response' && msg.requestId === requestId) {
          clearTimeout(timeout);
          listener.off('agent-message', responseHandler);
          if (msg.error) {
            reject(new Error(msg.error));
          } else {
            resolve(msg.result);
          }
        }
      };

      this.on('agent-message', responseHandler);

      // Send command to agent's stdin
      try {
        process.stdin.write(JSON.stringify(request) + '\n');
      } catch (error) {
        clearTimeout(timeout);
        this.off('agent-message', responseHandler);
        reject(new Error(`Failed to send command to agent: ${error.message}`));
      }
    });
  }
}

module.exports = { AgentDiscovery };
