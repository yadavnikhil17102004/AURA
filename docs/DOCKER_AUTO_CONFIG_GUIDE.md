# 🚀 MCP Docker Auto-Configuration Guide

## Overview

AURA now includes an **automatic Docker MCP server detection and configuration system**. When you install new MCP servers via Docker, AURA automatically detects and configures them!

---

## 🔧 How It Works

### System Architecture

```
┌─────────────────────────────────────────────────┐
│         AURA Browser Application                │
│  (mcp-integration.js + mcp-docker-autoconfig.js)│
└────────────────┬────────────────────────────────┘
                 │ HTTP API
                 ▼
┌─────────────────────────────────────────────────┐
│    MCP Docker Bridge Server (Node.js)           │
│   (mcp-docker-bridge.js)                        │
│   - Detects Docker MCP images                   │
│   - Provides configuration API                  │
│   - Auto-scans every 30 seconds                 │
└────────────────┬────────────────────────────────┘
                 │ Docker API
                 ▼
┌─────────────────────────────────────────────────┐
│          Docker MCP Servers                     │
│  ✅ mcp/playwright                              │
│  ✅ mcp/elevenlabs                              │
│  ✅ mcp/obsidian                                │
│  ✅ mcp/fetch                                   │
│  ✅ mcp/context7                                │
│  ✅ mcp/puppeteer                               │
│  ✅ mcp/sequentialthinking                      │
│  ✅ mcp/memory                                  │
└─────────────────────────────────────────────────┘
```

---

## ⚙️ Setup Instructions

### Step 1: Start the Docker Bridge Server

```bash
# Navigate to AURA directory
cd /Users/nikhilyadav/Desktop/AURA

# Start the bridge server
node mcp-docker-bridge.js
```

Or run in background:
```bash
nohup node mcp-docker-bridge.js > mcp-bridge.log 2>&1 &
```

### Step 2: Configure Port (Optional)

By default, the bridge runs on `http://localhost:3000`. To use a different port:

```bash
MCP_BRIDGE_PORT=3001 node mcp-docker-bridge.js
```

### Step 3: Update Browser App

Restart your AURA application:
1. Refresh `index.html` in your browser
2. Check browser console for confirmation
3. Look for: `✅ Docker Bridge detected`

---

## 🔍 Auto-Detection Features

### What Gets Detected

The system automatically detects these MCP servers:

| Server | Pattern | Function |
|--------|---------|----------|
| **Playwright** | `mcp/playwright` | Browser automation & scraping |
| **ElevenLabs** | `mcp/elevenlabs` | Text-to-speech synthesis |
| **Obsidian** | `mcp/obsidian` | Note management & search |
| **Fetch** | `mcp/fetch` | HTTP requests & web APIs |
| **Context7** | `mcp/context7` | Code analysis & context |
| **Puppeteer** | `mcp/puppeteer` | Headless browser control |
| **Sequential Thinking** | `mcp/sequentialthinking` | Reasoning & analysis |
| **Memory** | `mcp/memory` | Persistent data storage |

### Detection Interval

- **Initial scan**: On server startup
- **Auto-scan**: Every 30 seconds
- **Manual refresh**: `Cmd/Ctrl + M` in AURA

---

## 📦 Installing New MCP Servers

### Add a New Server

```bash
# Pull the MCP image
docker pull mcp/<server-name>

# The bridge will automatically detect it
# No restart needed!
```

### Example: Install Fetch Server

```bash
docker pull mcp/fetch
# Wait 30 seconds or restart AURA
# It will now appear in available servers!
```

---

## 🎯 Using Auto-Detected Servers

### Browser Console

```javascript
// Get all detected servers
const config = getMCPAutoConfig();
const servers = config.getDetectedServers();
console.log(servers);

// Get specific server
const playwriteServer = config.getServer('MCP_PLAYWRIGHT');
console.log(playwriteServer);

// Get configuration
const fullConfig = config.getConfigJSON();
console.log(fullConfig);
```

### API Endpoints

The bridge provides these endpoints:

#### `/api/docker/images`
Get all Docker images (especially MCP ones)
```bash
curl http://localhost:3000/api/docker/images
```

#### `/api/mcp/servers`
Get all detected MCP servers
```bash
curl http://localhost:3000/api/mcp/servers
```

#### `/api/mcp/config`
Get MCP configuration JSON
```bash
curl http://localhost:3000/api/mcp/config
```

#### `/api/docker/ps`
Get running containers
```bash
curl http://localhost:3000/api/docker/ps
```

#### `/api/docker/logs?server=<id>`
Get container logs
```bash
curl "http://localhost:3000/api/docker/logs?server=MY_CONTAINER_ID"
```

---

## 🔄 Auto-Update Process

### When You Install a New MCP Server

```
1. You run: docker pull mcp/newserver
   ↓
2. Bridge detects new image (30 sec scan)
   ↓
3. Bridge configuration updates
   ↓
4. Browser syncs automatically
   ↓
5. New server available in AURA!
```

### No Restart Required!

The system detects changes automatically every 30 seconds.

---

## 📊 Dashboard & Monitoring

### Check Server Status

```javascript
// In browser console
const bridge = fetch('http://localhost:3000/api/mcp/servers')
  .then(r => r.json())
  .then(data => {
    console.log(`Total servers: ${data.total}`);
    data.servers.forEach(s => {
      console.log(`✅ ${s.name} (${s.image})`);
    });
  });
```

### View Running Containers

```bash
# Terminal
curl http://localhost:3000/api/docker/ps | jq
```

---

## 🛠️ Configuration Files

### Key Files

| File | Purpose |
|------|---------|
| `mcp-docker-bridge.js` | Bridge server (Node.js) |
| `mcp-docker-autoconfig.js` | Browser auto-config client |
| `mcp-integration.js` | MCP integration (updated) |
| `index.html` | Frontend (updated) |

### localStorage Keys

```javascript
localStorage.getItem('mcp_servers_cache')   // Cached servers
localStorage.getItem('mcp_config')          // Full config
localStorage.getItem('docker_mcp_enabled')  // Docker enabled flag
```

---

## 🚨 Troubleshooting

### Bridge Not Connecting

```bash
# Check if server is running
curl http://localhost:3000/api/mcp/servers

# Check logs
tail -f mcp-bridge.log

# Restart bridge
node mcp-docker-bridge.js
```

### Docker Images Not Detected

```bash
# Check Docker is running
docker ps

# Check MCP images
docker images | grep mcp

# Manually trigger detection
curl http://localhost:3000/api/docker/images | jq
```

### Port Already in Use

```bash
# Use different port
MCP_BRIDGE_PORT=3001 node mcp-docker-bridge.js

# Find process using port 3000
lsof -i :3000
```

---

## 🔐 Security Notes

- ✅ Bridge runs locally only (`localhost:3000`)
- ✅ Docker socket only accessible to Docker user
- ✅ No authentication needed for local development
- ⚠️ For production, add authentication middleware

---

## 📈 Monitoring Setup (Optional)

### Add Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start bridge with PM2
pm2 start mcp-docker-bridge.js --name "mcp-bridge"

# Monitor
pm2 monit

# Logs
pm2 logs mcp-bridge
```

### Auto-start on System Boot

```bash
pm2 startup
pm2 save
```

---

## 🔄 Manual Configuration (Advanced)

### Edit mcp-config.json Directly

```bash
# Current config
cat mcp-config.json

# Edit manually
nano mcp-config.json

# Validate JSON
jq . mcp-config.json
```

### Add Custom MCP Server

```javascript
// In browser console
const config = getMCPAutoConfig();
config.addCustomServer('MCP_CUSTOM', {
  name: 'Custom Server',
  description: 'My custom MCP server',
  image: 'my-mcp-server:latest',
  command: 'docker',
  args: ['run', '--rm', 'my-mcp-server:latest']
});
```

---

## 📝 Example: Full Workflow

### 1. Start Systems

```bash
# Terminal 1: Start bridge
cd /Users/nikhilyadav/Desktop/AURA
node mcp-docker-bridge.js

# Terminal 2: Verify Docker
docker ps
docker images | grep mcp
```

### 2. Open AURA

```bash
# Browser: open index.html
# Check console for:
# ✅ Docker Bridge detected
# ✅ MCP system initialized
```

### 3. Check Available Servers

```javascript
// Browser console
const config = getMCPAutoConfig();
config.getDetectedServers().forEach(s => {
  console.log(`📦 ${s.name}: ${s.image}`);
});
```

### 4. Install New Server

```bash
# Terminal
docker pull mcp/playwright
# Wait 30 seconds

# Browser console: refresh and check again
config.getDetectedServers();
// Now includes Playwright!
```

---

## 🎯 Quick Commands Reference

```bash
# Start bridge
node mcp-docker-bridge.js

# Check bridge status
curl http://localhost:3000/api/mcp/servers

# List Docker MCP images
docker images | grep mcp

# Pull new MCP server
docker pull mcp/<server>

# View bridge logs
tail -f mcp-bridge.log

# Stop bridge
pkill -f "mcp-docker-bridge"
```

---

## 🚀 Next Steps

1. ✅ Start the bridge server
2. ✅ Open AURA in browser
3. ✅ Check console for detection
4. ✅ View available servers
5. ✅ Use MCP tools from AURA
6. ✅ Install more MCP servers as needed

---

## 📞 Support

For issues or questions:

1. **Check console**: Browser DevTools (F12)
2. **Check bridge logs**: `tail -f mcp-bridge.log`
3. **Verify Docker**: `docker ps && docker images`
4. **Restart bridge**: Kill process and restart

---

**System Status**: ✅ Ready to use  
**Auto-Detection**: ✅ Enabled  
**Docker Support**: ✅ Full  
**Version**: 1.0.0  

**Happy MCPing! 🎉**
