#!/usr/bin/env node
/**
 * MCP Agent Simulator
 * Emits a handshake + supports simple JSON RPC-like requests over STDIO.
 * Protocol:
 *  - On start: outputs a single-line JSON handshake
 *  - Then listens for JSON lines with { id, type, method, params }
 *  - Responds with { id, result } or { id, error }
 */

const readline = require('readline');

// Emit handshake
const handshake = {
  type: 'register',
  name: 'LocalSimulator',
  capabilities: ['knowledge-graph', 'memory', 'search'],
  tools: [
    { name: 'ping', description: 'Responds with pong' },
    { name: 'echo', description: 'Echoes back input text' }
  ],
  version: '1.0.0',
  protocol: 'mcp-sim-stdio'
};
process.stdout.write(JSON.stringify(handshake) + '\n');

// Simple request handler
function handleRequest(msg) {
  if (!msg || typeof msg !== 'object') {
    return { error: 'Invalid message format' };
  }
  
  const { id, type, command, method, params, args, requestId } = msg;
  
  // Handle new command protocol
  if (type === 'command') {
    switch (command) {
      case 'ping':
        return { type: 'response', requestId: id || requestId, result: 'pong' };
      case 'echo':
        return { type: 'response', requestId: id || requestId, result: args?.text || params?.text || '' };
      case 'getTools':
        return { type: 'response', requestId: id || requestId, result: handshake.tools };
      case 'search':
        return { 
          type: 'response', 
          requestId: id || requestId, 
          result: { 
            query: args?.query || '',
            results: ['Sample result 1', 'Sample result 2']
          }
        };
      default:
        return { type: 'response', requestId: id || requestId, error: `Unknown command: ${command}` };
    }
  }
  
  // Handle old method protocol (backwards compatibility)
  switch (method) {
    case 'ping':
      return { id, result: 'pong' };
    case 'echo':
      return { id, result: params?.text || '' };
    case 'getTools':
      return { id, result: handshake.tools };
    default:
      return { id, error: `Unknown method: ${method}` };
  }
}

// Read lines from stdin
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', line => {
  line = line.trim();
  if (!line) return;
  try {
    const parsed = JSON.parse(line);
    const response = handleRequest(parsed);
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: err.message }) + '\n');
  }
});
