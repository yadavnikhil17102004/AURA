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
}

module.exports = { AgentDiscovery };
