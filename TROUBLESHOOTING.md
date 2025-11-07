# 🔧 AURA Frontend-Backend Bridge Troubleshooting

## Quick Diagnosis

Run this anytime you suspect connection issues:

```bash
./check_bridge.sh
```

Expected output: `✓ Frontend-Backend Bridge is HEALTHY`

---

## Common Issues & Fixes

### 🔴 Issue 1: `ERR_CONNECTION_REFUSED`

**Symptom:** Browser console shows `net::ERR_CONNECTION_REFUSED`

**Cause:** Server not running or wrong port

**Fix:**
```bash
# Check if server is running
lsof -i :8000

# If nothing shown, start server
npm start

# Then open browser to:
http://localhost:8000
```

---

### 🔴 Issue 2: "I don't remember your name"

**Symptom:** AURA can't recall previously saved information

**Cause:** Graph not loading or frontend can't reach backend

**Steps to diagnose:**

1. **Check if server is running:**
   ```bash
   lsof -i :8000
   ```

2. **Check if graph loaded:**
   Look for this in server logs:
   ```
   💾 Loaded graph: X entities, Y relations
   ```

3. **Check graph file:**
   ```bash
   cat graph-data.json | jq '.entities | length'
   ```

4. **Test query manually:**
   ```bash
   curl -X POST http://localhost:8000/api/mcp/tool/query_graph \
     -H "Content-Type: application/json" \
     -d '{"query":"Nikhil"}'
   ```

**Fix:**
- If server not running: `npm start`
- If graph empty: Re-add your info in chat, it will persist
- If query fails: Check browser console for actual error

---

### 🔴 Issue 3: Opened `file:///` instead of `http://`

**Symptom:** Address bar shows `file:///Users/.../index.html`

**Cause:** Opened HTML file directly instead of through server

**Why it breaks:**
- Browser blocks `fetch()` calls from `file://` origin
- No server to handle `/api/*` routes
- CORS issues

**Fix:**
```bash
# Start server
npm start

# Open browser to:
http://localhost:8000

# NOT file:///Users/.../index.html
```

---

### 🔴 Issue 4: Wrong Port (3000 vs 8000)

**Symptom:** Network tab shows requests to `localhost:3000` but server is on `8000`

**Cause:** Using a dev server (Vite, React, etc.) on different port

**Fix:**

AURA serves everything from one port (8000). Don't use external dev servers.

```bash
# Stop any other servers
pkill -f "node"  # or stop your dev server

# Start AURA
npm start

# Use only:
http://localhost:8000
```

---

### 🔴 Issue 5: Hardcoded localhost URLs

**Symptom:** Works on localhost but breaks when deployed

**Cause:** Old code had `http://localhost:8000` hardcoded

**Check:**
```bash
grep -n "localhost:8000" script.js
```

**Fix:**

Modern AURA uses `window.location.origin`:

```javascript
const API_BASE = window.location.origin;
fetch(`${API_BASE}/api/mcp/tool/query_graph`, ...)
```

If you see hardcoded URLs, update `script.js` to use the pattern above.

---

### 🔴 Issue 6: CORS Errors

**Symptom:** Console shows `CORS policy: No 'Access-Control-Allow-Origin' header`

**Cause:** Accessing from wrong origin

**Fix:**

AURA's server includes CORS middleware. Ensure you're accessing from `http://localhost:8000` (same origin).

If you need external access, edit `server.js`:

```javascript
app.use(cors({
    origin: ['http://localhost:8000', 'http://your-domain.com'],
    credentials: true
}));
```

---

### 🔴 Issue 7: Graph Not Persisting

**Symptom:** Data disappears after restart

**Cause:** Server crashed before saving or file permissions issue

**Check:**
```bash
# Verify file exists
ls -la graph-data.json

# Check if writable
touch graph-data.json && echo "Writable ✅" || echo "Not writable ❌"

# Check server logs for save confirmation
# Should see: "💾 Saved graph: X entities, Y relations"
```

**Fix:**
- Always stop server with Ctrl+C (not kill -9)
- Check file permissions: `chmod 644 graph-data.json`
- Verify auto-save works: Add an entity, check file updates

---

### 🔴 Issue 8: Function Calls Not Working

**Symptom:** Gemini responds but doesn't execute tools

**Cause:** Function calling not enabled or tools not registered

**Check:**

Look for this in browser console when you send a message:
```
🔧 Function call requested: query_graph {...}
🎯 Executing MCP function: query_graph {...}
✅ Function result: {...}
```

If missing, check:

1. **Tools registered:**
   ```javascript
   // In script.js, look for:
   tools: [{
       functionDeclarations: [
           { name: 'query_graph', ... },
           { name: 'create_entities', ... },
           { name: 'agent_command', ... }
       ]
   }]
   ```

2. **Function execution handler:**
   ```javascript
   async function executeMCPFunction(functionName, args) {
       // Should route to /api/mcp/tool/${functionName}
   }
   ```

---

## Prevention Checklist

Before you start working:

- [ ] Server is running: `lsof -i :8000`
- [ ] Bridge is healthy: `./check_bridge.sh`
- [ ] Browser at `http://localhost:8000` (not file://)
- [ ] Console shows no errors
- [ ] Graph loaded: Check server logs

---

## Emergency Reset

If everything's broken:

```bash
# 1. Kill all processes
pkill -f "node server.js"

# 2. Backup your graph (if you want to keep data)
cp graph-data.json graph-data.backup.json

# 3. Clean start
npm start

# 4. Test bridge
./check_bridge.sh

# 5. Open browser
open http://localhost:8000
```

---

## Diagnostic Commands

### Quick health check:
```bash
curl -s http://localhost:8000/api/health | jq
```

### Test graph query:
```bash
curl -X POST http://localhost:8000/api/mcp/tool/query_graph \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}' | jq
```

### Test agent command:
```bash
curl -X POST http://localhost:8000/api/agents/LocalSimulator/command \
  -H "Content-Type: application/json" \
  -d '{"command":"ping"}' | jq
```

### Check graph contents:
```bash
cat graph-data.json | jq '.entities | length'
cat graph-data.json | jq '.entities[] | .name'
```

---

## When to Use Which Tool

| Tool | Purpose | When to Run |
|------|---------|-------------|
| `./verify.sh` | Full backend verification (21 tests) | After code changes, before deployment |
| `./check_bridge.sh` | Frontend-backend connection check (17 tests) | When UI isn't working, daily sanity check |
| `npm start` | Start the server | Every time you work on AURA |
| `curl` commands | Manual API testing | Debugging specific endpoints |

---

## Still Broken?

If none of the above helps:

1. Run full diagnostics:
   ```bash
   ./verify.sh && ./check_bridge.sh
   ```

2. Check browser console (F12) for exact error messages

3. Check server logs for backend errors

4. Look for this pattern in console:
   ```
   ❌ Function execution error (query_graph): [exact error message]
   ```

5. Share that error message for specific debugging

---

**Remember:** AURA is production-ready when:
- `./verify.sh` → 21/21 tests pass ✅
- `./check_bridge.sh` → 17/17 tests pass ✅
- Browser console shows no errors ✅
