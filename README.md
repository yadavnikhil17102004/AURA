<div align="center">

# ✨ AURA — Your Friendly Neighborhood AI Agent

Where great conversation meets real tools. Gemini + MCP + Docker auto‑discovery. Local‑first. Fast. Fun.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Node](https://img.shields.io/badge/Node-%3E%3D14-339933)
![Express](https://img.shields.io/badge/Express-unified%20server-black)
![Gemini](https://img.shields.io/badge/LLM-Gemini%202.5%20Flash-4285F4)
![Local LLM](https://img.shields.io/badge/LLM-Gemma%203%201B%20(Local)-orange)
![MCP](https://img.shields.io/badge/Protocol-MCP-blueviolet)
![Tests](https://img.shields.io/badge/Tests-46%2F46%20Passing-success)

</div>

---

## 🔥 Why AURA stands out

- Tool-using by default: Gemini Function Calling triggers real actions, not explanations
- VS Code‑style agent auto‑discovery (via STDIO handshakes and a registry)
- Docker‑native MCP bridge with zero‑config discovery of local servers
- Local‑first Node/Express server with secure `.env` configuration
- Knowledge graph memory: entities, relations, observations — searchable on demand
- Sleek, responsive UI that feels instant

---

## 🧠 What it can do

- “Search my notes on X” → queries your MCP knowledge graph
- “Remember this” → persists new entities and observations
- “What did I say about Y last week?” → retrieves context from your graph
- “Link A to B as ‘depends-on’” → creates relations
- “What agents are available?” → lists auto‑discovered agents at `/api/agents`

---

## 🏗️ Architecture at a glance

```
┌──────────────────────────────────────────┐
│               Browser UI                 │
│  • Chat + Streaming Responses            │
│  • Gemini Function Calling               │
│  • MCP Tool Invocations                  │
└───────────────┬──────────────────────────┘
                │ HTTP / JSON
                ↓
┌──────────────────────────────────────────┐
│     server.js (Node.js / Express)        │
│  • /api/config • /api/agents             │
│  • /api/mcp/tool/:toolName               │
│  • Docker bridge (dockerode)             │
└───────────────┬──────────────────────────┘
                │ Docker API
                ↓
┌──────────────────────────────────────────┐
│            MCP Servers (Docker)          │
│  • Knowledge graph backends              │
│  • Tools exposed via MCP                 │
└──────────────────────────────────────────┘
```

---

## ⚡ Quick start (30 seconds)

```bash
# 1) Install deps
npm install

# 2) Configure your key (see GOOGLE_AI_SETUP.md)
echo "API_PROVIDER=google" > .env
echo "DEFAULT_MODEL=gemini-2.5-flash" >> .env
echo "API_KEY=your_google_ai_key" >> .env

# 3) Launch
npm start
```

Open http://localhost:8000 and start chatting.

---

## � Built-in tools (MCP)

Available via POST `/api/mcp/tool/:toolName`:

- `query_graph` — search entities and observations
- `read_graph` — dump current graph snapshot
- `create_entities` — persist new entities
- `add_observations` — attach notes/contents to entities
- `create_relations` — connect entities
- `list_resources` — enumerate stored items

Agents auto‑discovered via GET `/api/agents` (powered by `discovery.js` + `agent-registry.json`).

---

## � Project Structure

```
AURA/
├── 🎨 Frontend
│   ├── index.html          # Main UI
│   ├── script.js           # Chat logic + dynamic MCP (1022 lines)
│   ├── styles.css          # Styling
│   └── config.js           # Config loader
│
├── ⚙️  Backend
│   ├── server.js           # Express server + API endpoints (679 lines)
│   ├── discovery.js        # Agent discovery system
│   ├── mcp-*.js           # MCP integration modules
│   └── graph-data.json    # Persistent knowledge graph
│
├── 🔧 Configuration
│   ├── .env               # LLM configuration (LOCAL or CLOUD)
│   ├── agent-registry.json # MCP agents (LocalSimulator active)
│   ├── mcp-config.json    # MCP servers
│   └── package.json       # Dependencies
│
├── 📚 Documentation (docs/)
│   ├── QUICKSTART.md
│   ├── DOCKER_MCP_GUIDE.md
│   ├── DYNAMIC_MCP_SETUP.md
│   ├── PRIORITY_SYSTEM_COMPLETE.md
│   ├── TROUBLESHOOTING.md
│   ├── GOOGLE_AI_SETUP.md
│   ├── MCP_INTEGRATION.md
│   ├── MCP_QUICK_REFERENCE.md
│   └── + 11 more guides
│
└── 🧪 Tests (tests/)
    ├── server.test.js      # Jest integration tests (21/21)
    ├── verify.sh           # Backend verification
    ├── check_bridge.sh     # Frontend-backend bridge (17/17)
    ├── test_memory.sh      # Memory system (5/5)
    ├── test_dynamic_tools.sh # Dynamic MCP (6/6)
    └── test_priority_system.sh # Priority routing (5/5)
```

**Current Configuration:**
- 🤖 **LLM**: Local Gemma 3 1B (port 8035) or Google Gemini 2.5 Flash
- 🔌 **MCP**: Dynamic tool discovery (6 tools: 4 built-in + 2 agent)
- 🐳 **Docker**: 8 MCP servers available (Obsidian, Puppeteer, Playwright, etc.)
- ✅ **Tests**: 46/46 passing

## 📚 Documentation

All guides moved to `docs/` directory:

- **Setup**: `docs/QUICKSTART.md`, `docs/GOOGLE_AI_SETUP.md`
- **MCP Integration**: `docs/MCP_INTEGRATION.md`, `docs/DOCKER_MCP_GUIDE.md`, `docs/DYNAMIC_MCP_SETUP.md`
- **Advanced**: `docs/PRIORITY_SYSTEM_COMPLETE.md`, `docs/DOCKER_AUTO_CONFIG_GUIDE.md`
- **Reference**: `docs/MCP_QUICK_REFERENCE.md`, `docs/TROUBLESHOOTING.md`
- **History**: `CHANGELOG.md` (root directory)

---

## ✅ Project status

- ✅ Unified Node/Express server (`server.js`)
- ✅ Gemini Function Calling with real tool execution
- ✅ Agent auto‑discovery + STDIO handshake
- ✅ Docker‑native MCP bridge + simulation fallback
- ✅ Secure `.env` configuration surface (`/api/config`)
- 🔜 Voice mode, multi‑MCP, richer plugins

---

## 🤝 Contributing

Issues and PRs are welcome. If you’ve got a wild tool idea or a neat agent, wire it up and show us what AURA can do.

---

## 📝 License

MIT © yadavnikhil17102004

Feel free to contribute to this project by:

1. **Bug Reports**: Submit issues for bugs or problems
2. **Feature Requests**: Suggest new features or improvements
3. **Code Contributions**: Submit pull requests with enhancements
4. **Documentation**: Improve README or add examples

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **OpenRouter**: For providing access to multiple AI models
- **Anthropic**: For the Claude models
- **Modern Web Standards**: For enabling rich web applications

## 📞 Support

If you need help:

1. **Check the troubleshooting section** above
2. **Open browser console** for error messages
3. **Review OpenRouter documentation** for API-related issues
4. **Create an issue** for bugs or feature requests

---

**Happy Chatting! 🎉**

*Built with ❤️ using modern web technologies*