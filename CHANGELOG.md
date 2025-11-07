# AURA Changelog

## [2.1.1] - 2025-11-08

### 🎯 Priority System for Docker MCP

#### Intelligent Tool Selection
- **NEW**: Priority-based tool selection system
- **UPDATED**: Tool descriptions now explicitly state when to use each tool
- **UPDATED**: System prompt teaches Gemini to prefer Docker MCP agents over local memory
- **IMPROVED**: Gemini now understands: "search my notes" → use Obsidian agent (not local memory)

#### Enhanced Tool Descriptions
- `query_graph` - Now clearly states "LOCAL memory ONLY" and "DO NOT use for notes/files"
- `read_graph` - Emphasizes this is AURA's internal memory
- Agent tools - Marked as PREFERRED for user's actual data
- Clear distinction between AURA memory vs user files

#### System Prompt Updates
- **Priority Order Rules**: Check for Docker MCP agents first, fallback to local memory
- **Explicit Examples**: "search my notes" → agent_Obsidian_*, NOT query_graph
- **Dynamic Discovery Instructions**: Always check what agents are available

### 🐛 Bug Fixes
- Fixed tool selection ambiguity (Gemini using wrong tool for note searches)
- Clarified when to use local memory vs external agents

---

## [2.1.0] - 2025-11-08

### 🚀 Major Features

#### Dynamic MCP Tool Discovery
- **NEW**: `/api/tools` endpoint that returns all available tools (built-in + agents)
- **NEW**: `fetchAvailableTools()` in frontend dynamically loads tools at runtime
- **NEW**: Gemini automatically learns about ALL MCP servers as they're discovered
- **NEW**: Smart tool routing: `agent_AgentName_toolName` format for agent tools
- **NEW**: 30-second tool caching to minimize API calls
- **BREAKING**: Tool declarations no longer static - loaded dynamically from server

#### Intelligent Tool Selection
- **UPDATED**: System prompt now explicitly distinguishes:
  - Local AURA memory (query_graph, create_entities) → For info YOU told AURA
  - External agents (agent_Obsidian_*) → For searching actual user files
- **FIXED**: "Search my notes" now routes to Obsidian MCP instead of local memory
- **IMPROVED**: Gemini understands when to use which tool system

#### Enhanced Agent Routing
- **UPDATED**: `executeMCPFunction()` now parses agent tool names
- **NEW**: Format `agent_Name_tool` automatically routes to correct agent
- **IMPROVED**: Backward compatible with legacy `agent_command` format

### 🔧 Improvements

#### Server Enhancements
- Built-in tools now clearly labeled as "LOCAL" in descriptions
- Tool source tracking ("builtin" vs "agent")
- Agent metadata included in tool declarations

#### Frontend Enhancements  
- Automatic tool refresh every 30 seconds
- Graceful fallback to static tools if `/api/tools` unavailable
- Console logging shows exactly which tools are loaded

### 📚 Documentation
- Added `DYNAMIC_MCP_SETUP.md` with complete architecture guide
- Includes setup instructions for Obsidian MCP
- Debugging guide for tool discovery issues

---

## [2.0.1] - 2025-11-08

### 🐛 Bug Fixes

#### Proactive Memory Retrieval
- **FIXED**: AI now proactively checks knowledge graph for personal information
- **FIXED**: Added explicit instructions to query stored data before responding "I don't know"
- **UPDATED**: System prompt with critical examples:
  - User asks "what's my name?" → Uses `query_graph` to check stored data
  - User asks "what do you know about me?" → Uses `read_graph` to list information
  - User mentions preferences → Saves with `create_entities`
- **NEW**: `test_memory.sh` verification script (5 comprehensive tests)
- **Impact**: Users can now retrieve personal information that was previously saved but not accessed

### 📚 Documentation
- Added `MEMORY_FIX.md` with detailed root cause analysis
- Documented prompt engineering lessons learned
- Added testing procedures for memory retrieval

---

## [2.0.0] - 2025-11-08

### 🚀 Major Features

#### Agent Command Bus
- **NEW**: `/api/agents/:id/command` endpoint for sending commands to discovered agents
- **NEW**: `sendCommand()` method in `AgentDiscovery` class for STDIO communication
- **NEW**: `agent_command` function exposed to Gemini for AI-driven agent interaction
- Updated `mcp-agent-simulator.js` to handle command protocol (backwards compatible)

#### Persistent Memory
- **NEW**: Automatic graph persistence to `graph-data.json`
- Loads knowledge graph on server startup
- Auto-saves after entity/relation/observation modifications
- Graceful shutdown saves graph before exit
- No more memory loss between sessions! 🎉

#### Testing Infrastructure
- **NEW**: Jest test framework integration
- **NEW**: Basic integration tests for MCP endpoints
- **NEW**: Tests for agent discovery
- **NEW**: Health check and configuration tests
- Run with `npm test`

### 🔧 Improvements

#### Server Enhancements
- Added `fs` module for file I/O operations
- Enhanced startup logging to show new endpoints
- Graceful shutdown now persists memory before exit
- Updated endpoint list in console output

#### Frontend Updates
- Added `agent_command` to Gemini's function declarations
- Enhanced `executeMCPFunction()` to route agent commands properly
- Better error handling for agent communication

#### Configuration
- Updated `.env.example` with comprehensive documentation
- Added optional `SYSTEM_PROMPT` customization
- Clearer comments and structure

#### Discovery System
- Enhanced `discovery.js` with bidirectional STDIO communication
- 30-second timeout for agent commands
- Request/response correlation via unique IDs
- Better error messages for offline agents

### 📚 Documentation
- Created `CHANGELOG.md` (this file!)
- Updated `README.md` with production-ready messaging
- Added badges and clear feature highlights

### 🐛 Bug Fixes
- Fixed duplicate code block in `server.js` after refactor
- Corrected STDIO protocol in simulator agent
- Ensured proper cleanup on process termination

### 🔮 What This Enables

With these changes, AURA can now:
- **Remember** across sessions (persistent graph)
- **Command** external agents (not just query them)
- **Test** its own functionality (integration suite)
- **Scale** as a true AI runtime platform

This is production-grade territory. 🔥

---

## [1.0.0] - 2025-11-07

### Initial Release
- Gemini 2.5 Flash integration
- MCP knowledge graph (in-memory)
- Docker auto-discovery
- VS Code-style agent discovery
- Function calling for tool use
- Unified Node.js/Express server
- Secure `.env` configuration
