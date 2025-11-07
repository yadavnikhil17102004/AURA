# ✨ AURA - Advanced Universal Reasoning Assistant

> **Where Intelligence Meets Innovation** 🚀

AURA isn't just another chatbot. It's a next-generation AI assistant that bridges the gap between conversational AI and structured knowledge management through cutting-edge **Model Context Protocol (MCP)** integration.

---

## 🎯 What Makes AURA Extraordinary

### 🧠 **Dual-Brain Architecture**
AURA operates on two levels simultaneously:
- **Conversational Intelligence**: Powered by Google's Gemini 2.5 Flash for lightning-fast, contextual responses
- **Knowledge Graph Memory**: Real-time MCP integration that maintains a persistent, queryable memory structure

### 🐳 **Docker-Native MCP Integration**
Unlike other assistants, AURA automatically detects and connects to Docker-based MCP servers running on your machine. It's not simulated—it's the real deal.

- **Auto-Discovery**: Scans your Docker environment for MCP images
- **Live Bridge**: Node.js-powered bridge connects browser to Docker daemon
- **Zero Configuration**: If you have Docker MCP servers, AURA finds them

### 🔐 **Security-First Design**
- Environment-based secrets management (`.env` files, never committed)
- Server-side configuration endpoint prevents API key exposure
- Clean separation between public and private data

### ⚡ **Instant Deployment**
One command. That's all:
```bash
python start.py
```
The Python orchestrator handles everything:
- Launches the web interface
- Spins up the MCP bridge server
- Serves secure configuration
- Manages all processes

---

## 🌟 Core Capabilities

### 💬 **Intelligent Conversations**
- Multi-turn context retention
- Streaming responses with typing indicators
- Support for multiple AI providers (OpenRouter, Google AI)
- Markdown-rich formatting

### 🕸️ **Knowledge Graph Operations**
Through MCP integration, AURA can:
- Create and manage **entities** (people, concepts, projects)
- Define **relationships** between entities
- Store **observations** for historical context
- Query the graph for complex insights

### 🎨 **Beautiful User Experience**
- Glassmorphic UI with smooth animations
- Dark mode optimized design
- Fully responsive (desktop, tablet, mobile)
- Keyboard shortcuts for power users

### � **Data Portability**
- Export conversations as JSON
- MCP graph data export
- Import historical context

---

## 🛠️ Technical Excellence

### **Multi-Provider AI Support**
```javascript
// Seamlessly switch between providers
API_PROVIDER=google          // Google Gemini
API_PROVIDER=openrouter      // 200+ models via OpenRouter
```

### **MCP Protocol Implementation**
- Full stdio-based MCP communication
- Docker container orchestration
- Fallback simulation mode
- Real-time status monitoring

### **Modern Stack**
- **Frontend**: Vanilla JavaScript (ES6+), no framework bloat
- **Backend**: Node.js + Express (unified server)
- **Docker Integration**: Native Docker API via dockerode
- **Protocol**: Model Context Protocol (MCP)

---

## 🎪 Live Features

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Focus input
- `Ctrl/Cmd + L`: Clear chat
- `Ctrl/Cmd + E`: Export conversation
- `Ctrl/Cmd + M`: Manage MCP

### MCP Operations
```javascript
// Create entities
create_entities({ 
  name: "Project_X",
  entityType: "Software",
  observations: ["Built with MCP", "AI-powered"]
})

// Define relationships
create_relations({
  from: "AURA",
  to: "Project_X",
  relationType: "powers"
})

// Search the graph
search_nodes({ query: "AI projects" })
```

---

## 🚀 Quick Launch

### Requirements
- Node.js 14+ (includes npm)
- Docker (optional, for real MCP servers)

### Start AURA
```bash
# 1. Set your API key
echo "API_KEY=your_key_here" > .env
echo "API_PROVIDER=google" >> .env
echo "DEFAULT_MODEL=gemini-2.5-flash" >> .env

# 2. Install dependencies
npm install

# 3. Launch
npm start
```

### Open your browser
Navigate to `http://localhost:8000` and experience the future of AI assistants.

---

## 🧬 Architecture Highlights

```
┌─────────────────────────────────────────┐
│           Browser (Frontend)            │
│  ┌─────────────────────────────────┐   │
│  │    AURA Chat Interface          │   │
│  │  • Conversation UI              │   │
│  │  • MCP Client                   │   │
│  └─────────────────────────────────┘   │
└─────────────┬───────────────────────────┘
              │ HTTP / REST API
              ↓
┌─────────────────────────────────────────┐
│       server.js (Node.js/Express)       │
│  • Static file serving                  │
│  • /api/config endpoint                 │
│  • /api/mcp/* MCP Docker bridge         │
│  • Unified service orchestration        │
└─────────────┬───────────────────────────┘
              │ Docker API
              ↓
┌─────────────────────────────────────────┐
│          Docker Daemon                  │
│  • MCP Containers                       │
│  • Knowledge Graph Storage              │
└─────────────────────────────────────────┘
```

---

## 🎓 Innovation Stack

- **MCP Protocol**: Industry-standard knowledge graph protocol
- **Docker Integration**: Native container orchestration
- **Hybrid Architecture**: Client-side UI + Server-side security
- **Auto-Configuration**: Zero-touch MCP server discovery
- **Graceful Degradation**: Simulation mode when Docker unavailable

---

## 📈 Use Cases

### Personal Knowledge Management
Build a persistent memory system that grows with every conversation.

### Research Assistant
Connect AURA to domain-specific MCP servers for specialized knowledge.

### Development Companion
Integrate with code repositories, documentation, and project management tools via MCP.

### Creative Projects
Maintain context across brainstorming sessions with the knowledge graph.

---

## 🔮 Future Vision

AURA is designed to evolve:
- **Multi-MCP Support**: Connect to multiple knowledge sources simultaneously
- **Custom Plugins**: Extend functionality with JavaScript tools
- **Voice Interface**: Hands-free interaction
- **Collaborative Graphs**: Shared knowledge spaces

---

## 💎 Why AURA?

Because you deserve an AI assistant that:
- ✅ **Remembers** through persistent knowledge graphs
- ✅ **Adapts** with multi-provider AI support
- ✅ **Integrates** natively with your Docker environment
- ✅ **Protects** your data with security-first architecture
- ✅ **Scales** from simple chat to complex knowledge management

---

<div align="center">

**Built with 🧠 Intelligence • 🔐 Security • 🚀 Performance**

*AURA: Your thoughts, amplified.*

</div>
- `google/gemini-pro` - Google's Gemini
- `meta-llama/llama-2-70b-chat` - Meta's Llama
- `tngtech/deepseek-r1t2-chimera:free` - High performance free model

## 🔌 MCP Integration

### What is MCP?

The **Model Context Protocol (MCP)** is an open standard for AI applications to interact with external systems and data sources. AURA includes full MCP support for knowledge graph management.

### Features

- **Docker Integration**: Connect to Docker-based MCP servers
- **Knowledge Graph**: Store and query entities, relations, and observations
- **Dual Mode**: Works with Docker or in simulation mode
- **Full Tool Support**: Access all MCP server capabilities

### Quick Start

1. **Configure MCP**: Edit `mcp-config.json` with your MCP server details
2. **Launch AURA**: Open `index.html` in your browser
3. **Click "🔧 Manage MCP"**: Configure the knowledge graph
4. **Use MCP Tools**: Access all MCP capabilities through the chat interface

### Available MCP Tools

- `create_entities` - Create knowledge entities
- `read_graph` - View the knowledge graph
- `create_relations` - Link entities together
- `add_observations` - Add facts and observations
- `query_graph` - Search the graph
- `delete_entities` - Remove entities
- `update_entities` - Modify entity properties
- `list_resources` - View all resources
- `get_resource` - Retrieve specific resource

### MCP Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + M` | Manage MCP & Configure Graph |
| `Cmd/Ctrl + G` | View MCP Graph Data |
| `Cmd/Ctrl + S` | Get MCP Statistics |

### MCP Configuration

Edit `mcp-config.json`:

```json
{
  "servers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": ["mcp", "gateway", "run"],
      "type": "stdio"
    }
  }
}
```

### Using MCP with Docker

```bash
# Ensure Docker is running
docker ps

# Pull the latest MCP gateway
docker pull mcpserver/gateway:latest

# AURA will automatically connect!
```

For detailed MCP documentation, see [MCP_INTEGRATION.md](./MCP_INTEGRATION.md)

Visit [OpenRouter Models](https://openrouter.ai/models) for the complete list.

### Customization

You can customize various aspects in `script.js`:

- **API URL**: Change `OPENROUTER_API_URL` if needed
- **Max Tokens**: Modify `max_tokens` in the API call
- **Temperature**: Adjust `temperature` for creativity (0.0-1.0)
- **System Message**: Change the AI's behavior instructions

## 🏗️ File Structure

```
simple-chatbot/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## 🔧 Technical Details

### API Integration

- **Endpoint**: OpenRouter Chat Completions API
- **Method**: POST
- **Authentication**: Bearer token in Authorization header
- **Request Format**: OpenAI-compatible chat completion format

### Security

- **API Key Storage**: Stored locally in browser's localStorage
- **No Server**: Runs entirely client-side
- **HTTPS**: Recommended to run over HTTPS for security

### Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **JavaScript**: ES6+ features used
- **Local Storage**: Required for API key persistence

## 🐛 Troubleshooting

### Common Issues

**"Invalid API key" Error**
- Verify your API key is correct
- Check if the key is active in your OpenRouter account
- Ensure you have sufficient credits

**"Rate limit exceeded"**
- Wait a few seconds between messages
- Check your API usage limits in OpenRouter dashboard
- Consider using a rate limit handler

**Messages not sending**
- Check browser console for JavaScript errors
- Ensure you have an active internet connection
- Verify the API key is saved correctly

**UI not loading properly**
- Try refreshing the page
- Clear browser cache
- Disable browser extensions that might interfere

### Debug Mode

Open browser developer tools (F12) to view console messages. The chatbot logs helpful information for troubleshooting.

## 💰 Cost and Usage

### OpenRouter Pricing

- **Pay-per-use**: You only pay for the tokens you consume
- **Rate limits**: Vary by model and account tier
- **Free tier**: Some models have free usage limits
- **Credits**: Purchase credits as needed

### Token Usage

- **Input**: Each message costs tokens
- **Output**: AI responses consume tokens
- **History**: Conversation context adds to token usage
- **Optimization**: Chat history is limited to last 10 exchanges

## 🔒 Privacy and Security

- **Local Storage**: API key is stored only in your browser
- **No Data Collection**: No personal data is transmitted except to OpenRouter
- **Client-Side Only**: No server-side data storage
- **HTTPS Recommended**: For secure API communication

## 🤝 Contributing

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