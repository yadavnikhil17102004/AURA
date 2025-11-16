// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const closeError = document.getElementById('closeError');
const backgroundActivity = document.getElementById('backgroundActivity');
const activityList = document.getElementById('activityList');
const clearActivityButton = document.getElementById('clearActivity');

// OpenRouter API configuration (or Azure OpenAI or Local LLM)
let OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
let DEFAULT_MODEL = 'gpt-4o';
let AURA_CONFIG = null;

// Chat state
let conversationHistory = [];

// Background activity state
const activityEntries = new Map();
let activityCounter = 0;
const MAX_ACTIVITY_ENTRIES = 12;

// Conversation helpers
function buildModelMessages() {
    return [
        {
            role: 'system',
            content: AURA_CONFIG?.SYSTEM_PROMPT || 'You are AURA, a helpful personal AI assistant.'
        },
        ...conversationHistory
    ];
}

function normalizeContent(content) {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .map(part => {
                if (typeof part === 'string') return part;
                if (part && typeof part === 'object') {
                    if (typeof part.text === 'string') return part.text;
                    if (part.type === 'text' && typeof part.value === 'string') return part.value;
                }
                return '';
            })
            .join('');
    }
    if (typeof content === 'object') {
        if (typeof content.text === 'string') {
            return content.text;
        }
        try {
            return JSON.stringify(content, null, 2);
        } catch (error) {
            return String(content);
        }
    }
    return String(content);
}

function trimConversationHistory(maxMessages = 30) {
    if (conversationHistory.length > maxMessages) {
        conversationHistory = conversationHistory.slice(-maxMessages);
    }
}

function ensureActivityPanelState() {
    if (!backgroundActivity || !activityList) {
        return;
    }

    if (activityList.children.length > 0) {
        backgroundActivity.classList.add('active');
        backgroundActivity.classList.remove('hidden');
    } else {
        backgroundActivity.classList.add('hidden');
        backgroundActivity.classList.remove('active');
    }
}

function truncateForDisplay(value, maxLength = 220) {
    if (!value) return '';
    return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function formatAsReadable(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
        return JSON.stringify(value, null, 2);
    } catch (error) {
        return String(value);
    }
}

function summarizeArgs(args) {
    if (!args || typeof args !== 'object' || Object.keys(args).length === 0) {
        return 'No arguments provided.';
    }
    return truncateForDisplay(formatAsReadable(args), 260);
}

function summarizeResultForActivity(result) {
    if (result === undefined || result === null) {
        return 'Tool completed with no data returned.';
    }
    if (typeof result === 'string') {
        return truncateForDisplay(result, 260);
    }
    return truncateForDisplay(formatAsReadable(result), 260);
}

function createActivityEntry(label, detail = '', status = 'pending') {
    if (!backgroundActivity || !activityList) {
        return null;
    }

    const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : 'pending';
    const entryId = `activity-${Date.now()}-${activityCounter++}`;
    const item = document.createElement('li');
    item.className = 'activity-item';
    item.dataset.activityId = entryId;

    const statusBadge = document.createElement('span');
    statusBadge.className = `activity-status status-${normalizedStatus}`;
    statusBadge.textContent = normalizedStatus;

    const content = document.createElement('div');
    content.className = 'activity-content';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'activity-label';
    labelSpan.textContent = label;
    content.appendChild(labelSpan);

    const detailDiv = document.createElement('div');
    detailDiv.className = 'activity-detail';
    if (detail) {
        detailDiv.textContent = detail;
    } else {
        detailDiv.style.display = 'none';
    }
    content.appendChild(detailDiv);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'activity-meta';
    metaDiv.style.display = 'none';
    content.appendChild(metaDiv);

    item.appendChild(statusBadge);
    item.appendChild(content);

    activityList.prepend(item);

    activityEntries.set(entryId, {
        element: item,
        statusBadge,
        detailDiv,
        metaDiv,
        labelSpan
    });

    trimActivityEntries();
    ensureActivityPanelState();

    return entryId;
}

function updateActivityEntry(id, status, detail) {
    if (!id) return;
    const entry = activityEntries.get(id);
    if (!entry) return;

    if (status) {
        const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : 'pending';
        entry.statusBadge.textContent = normalizedStatus;
        entry.statusBadge.className = `activity-status status-${normalizedStatus}`;
    }

    if (detail !== undefined) {
        if (detail) {
            entry.detailDiv.textContent = detail;
            entry.detailDiv.style.display = 'block';
        } else {
            entry.detailDiv.textContent = '';
            entry.detailDiv.style.display = 'none';
        }
    }
}

function setActivityMeta(id, meta) {
    if (!id) return;
    const entry = activityEntries.get(id);
    if (!entry) return;

    if (meta) {
        entry.metaDiv.textContent = meta;
        entry.metaDiv.style.display = 'block';
    } else {
        entry.metaDiv.textContent = '';
        entry.metaDiv.style.display = 'none';
    }
}

function markActivityComplete(id) {
    if (!id) return;
    const entry = activityEntries.get(id);
    if (entry) {
        entry.element.classList.add('activity-completed');
    }
}

function clearActivityEntries() {
    activityEntries.clear();
    if (activityList) {
        activityList.innerHTML = '';
    }
    ensureActivityPanelState();
}

function trimActivityEntries() {
    if (!activityList) return;
    while (activityList.children.length > MAX_ACTIVITY_ENTRIES) {
        const last = activityList.lastElementChild;
        if (!last) {
            break;
        }
        const lastId = last.dataset.activityId;
        if (lastId) {
            activityEntries.delete(lastId);
        }
        activityList.removeChild(last);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the config to be loaded
    document.addEventListener('aura-config-loaded', initializeAURA);
    // If the config is already loaded (e.g., from a fast cache), initialize immediately
    if (window.AURA_CONFIG) {
        initializeAURA();
    }
});

// Initialize AURA with configuration
function initializeAURA() {
    // Load AURA configuration
    if (window.AURA_CONFIG) {
        AURA_CONFIG = window.AURA_CONFIG;
        DEFAULT_MODEL = AURA_CONFIG.DEFAULT_MODEL || DEFAULT_MODEL;
        
        // Update OpenRouter URL if custom base URL provided (for local LLMs)
        if (AURA_CONFIG.OPENAI_BASE_URL && AURA_CONFIG.API_PROVIDER === 'openai') {
            OPENROUTER_API_URL = AURA_CONFIG.OPENAI_BASE_URL + '/chat/completions';
            console.log(`🔧 Using custom LLM endpoint: ${OPENROUTER_API_URL}`);
        }
    }
    
    // Initialize MCP system
    initializeMCPSystem().then(() => {
        console.log('✅ MCP system initialized');
        updateMCPStatusIndicator();
    }).catch(error => {
        console.error('Error initializing MCP:', error);
    });
    
    setupEventListeners();
    ensureActivityPanelState();
    scrollToBottom();
    console.log('✨ AURA initialized successfully!');
}

// Setup event listeners
function setupEventListeners() {
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Send message on Enter key (but not Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Auto-resize textarea
    messageInput.addEventListener('input', autoResizeTextarea);
    
    // Close error message
    closeError.addEventListener('click', hideError);

    if (clearActivityButton) {
        clearActivityButton.addEventListener('click', () => {
            clearActivityEntries();
        });
    }
}

// Auto-resize textarea
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// Show AURA capabilities
function showAuraCapabilities() {
    const capabilities = `
        <div class="message bot-message">
            <div class="message-content">
                <p><strong>💡 Here's what I can help you with:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>📝 Writing and editing assistance</li>
                    <li>🧠 Complex problem solving and analysis</li>
                    <li>💻 Programming and technical guidance</li>
                    <li>📊 Research and data analysis</li>
                    <li>🎨 Creative projects and brainstorming</li>
                    <li>📚 Learning and educational support</li>
                    <li>🌟 Personal productivity tips</li>
                    <li>🔍 General knowledge questions</li>
                </ul>
                <p>Just ask me anything, and I'll do my best to help! 😊</p>
            </div>
        </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = capabilities;
    chatMessages.appendChild(tempDiv.firstElementChild);
    scrollToBottom();
}

// Send message to API (OpenRouter or Azure OpenAI)
async function sendMessage() {
    const message = messageInput.value.trim();
    const apiProvider = (AURA_CONFIG?.API_PROVIDER || 'openrouter').toLowerCase();
    const apiKey = apiProvider === 'azure'
        ? (localStorage.getItem('azure_oai_key') || AURA_CONFIG?.AZURE_OAI_KEY || null)
        : (localStorage.getItem('openrouter_api_key') || AURA_CONFIG?.API_KEY || null);
    
    if (!message) return;
    
    if (!apiKey) {
        showError('AURA is not properly configured. Please check the setup.');
        return;
    }
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Track user message for future model calls
    conversationHistory.push({ role: 'user', content: message });
    trimConversationHistory();

    // Clear input
    messageInput.value = '';
    autoResizeTextarea();
    
    // Show loading
    showLoading();
    
    try {
        if (apiProvider === 'azure') {
            await sendMessageToAzureOAI(message, apiKey);
        } else {
            await sendMessageToOpenRouter(message, apiKey);
        }
        
    } catch (error) {
        console.error('AURA API Error:', error);
        
        let errorMsg = 'AURA encountered an error while processing your request.';
        
        if (error.message.includes('401')) {
            errorMsg = 'AURA is having trouble connecting. Please check the API configuration.';
        } else if (error.message.includes('429')) {
            errorMsg = 'AURA is receiving too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('402')) {
            errorMsg = 'AURA needs more credits to continue. Please check your API account.';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        showError(errorMsg);
    } finally {
        hideLoading();
    }
}

// Global tool cache populated from the server so we can advertise functions to the model
let cachedTools = null;
let toolsCacheTime = 0;
const TOOLS_CACHE_TTL = 30000; // 30 seconds

// Fetch all available tools (built-in + MCP agents)
async function fetchAvailableTools() {
    const now = Date.now();

    if (cachedTools && (now - toolsCacheTime) < TOOLS_CACHE_TTL) {
        return cachedTools;
    }

    try {
        const API_BASE = window.location.origin;
        const response = await fetch(`${API_BASE}/api/tools`);

        if (!response.ok) {
            console.warn('Could not fetch dynamic tools, using static set');
            cachedTools = getStaticToolDeclarations();
            toolsCacheTime = now;
            return cachedTools;
        }

        const data = await response.json();
        const tools = data.tools || [];

        console.log(`🔧 Loaded ${tools.length} tools dynamically:`, tools.map(t => t.name));

        cachedTools = tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            source: tool.source || 'unknown',
            agentId: tool.agentId,
            agentTool: tool.agentTool
        }));
        toolsCacheTime = now;
        return cachedTools;
    } catch (error) {
        console.error('Error fetching tools:', error);
        cachedTools = getStaticToolDeclarations();
        toolsCacheTime = now;
        return cachedTools;
    }
}

// Static tool declarations (fallback) - OpenAI compatible structures
function getStaticToolDeclarations() {
    return [
        {
            name: 'query_graph',
            description: 'Search the knowledge graph for information. Use this when users ask about their notes, files, or stored information.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search query to find in the knowledge graph'
                    },
                    entityType: {
                        type: 'string',
                        description: 'Optional entity type filter (e.g., "note", "file", "project")'
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of results to return (default: 50)'
                    }
                },
                required: ['query']
            }
        },
        {
            name: 'read_graph',
            description: 'Read the entire knowledge graph or a portion of it. Use this to see what information is stored.',
            parameters: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number',
                        description: 'Maximum number of entities to return (default: 100)'
                    }
                }
            }
        },
        {
            name: 'create_entities',
            description: 'Create new entities in the knowledge graph. Use this to store new information, notes, or concepts.',
            parameters: {
                type: 'object',
                properties: {
                    entities: {
                        type: 'array',
                        description: 'Array of entities to create',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', description: 'Name of the entity' },
                                entityType: { type: 'string', description: 'Type of entity (e.g., "note", "concept", "project")' },
                                observations: {
                                    type: 'array',
                                    description: 'Array of observation strings about this entity',
                                    items: { type: 'string' }
                                }
                            },
                            required: ['name', 'entityType', 'observations']
                        }
                    }
                },
                required: ['entities']
            }
        },
        {
            name: 'add_observations',
            description: 'Add observations or notes to existing entities in the knowledge graph.',
            parameters: {
                type: 'object',
                properties: {
                    observations: {
                        type: 'array',
                        description: 'Array of observations to add',
                        items: {
                            type: 'object',
                            properties: {
                                entityName: { type: 'string', description: 'Name of the entity to add observations to' },
                                contents: {
                                    type: 'array',
                                    description: 'Array of observation content strings',
                                    items: { type: 'string' }
                                }
                            },
                            required: ['entityName', 'contents']
                        }
                    }
                },
                required: ['observations']
            }
        },
        {
            name: 'agent_command',
            description: 'Send a command to a discovered agent. Use this to interact with external tools, services, or specialized agents.',
            parameters: {
                type: 'object',
                properties: {
                    agentId: {
                        type: 'string',
                        description: 'The ID or name of the agent to send the command to'
                    },
                    command: {
                        type: 'string',
                        description: 'The command to execute on the agent'
                    },
                    args: {
                        type: 'object',
                        description: 'Arguments for the command'
                    }
                },
                required: ['agentId', 'command']
            }
        }
    ];
}

// Helper: translate cached tool data to OpenAI/Azure tool definitions
async function getOpenAIToolDefinitions() {
    const tools = await fetchAvailableTools();
    if (!tools || tools.length === 0) {
        return [];
    }
    return tools.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters || { type: 'object', properties: {} }
        }
    }));
}

function formatToolResult(functionName, result, error = null) {
    if (error) {
        return `⚠️ ${functionName} failed: ${error}`;
    }

    if (result === undefined || result === null) {
        return `🔧 ${functionName} returned no data.`;
    }

    if (typeof result === 'string') {
        return `🔧 ${functionName} → ${result}`;
    }

    try {
        return `🔧 ${functionName} → ${JSON.stringify(result, null, 2)}`;
    } catch (err) {
        return `🔧 ${functionName} → ${String(result)}`;
    }
}

async function handleAssistantToolExecution(assistantMessage, toolDefinitions, callApiFn) {
    let currentMessage = assistantMessage;

    while (currentMessage && Array.isArray(currentMessage.tool_calls) && currentMessage.tool_calls.length > 0) {
        const planContent = normalizeContent(currentMessage.content);
        if (planContent) {
            addMessage(planContent, 'bot');
        }

        conversationHistory.push({
            role: 'assistant',
            content: currentMessage.content,
            tool_calls: currentMessage.tool_calls
        });
        trimConversationHistory();

        for (const toolCall of currentMessage.tool_calls) {
            const functionName = toolCall.function?.name;
            let parsedArgs = {};
            try {
                if (toolCall.function?.arguments) {
                    parsedArgs = JSON.parse(toolCall.function.arguments);
                }
            } catch (err) {
                console.error(`Failed to parse arguments for ${functionName}:`, err);
            }

            const toolLabel = functionName || 'unknown_tool';
            const activityId = createActivityEntry(`Tool • ${toolLabel}`, 'Queued for execution', 'pending');
            const argsSummary = summarizeArgs(parsedArgs);
            if (activityId) {
                setActivityMeta(activityId, argsSummary ? `Args:\n${argsSummary}` : '');
                updateActivityEntry(activityId, 'running', 'Executing via MCP bridge...');
            }

            try {
                const toolResult = await executeMCPFunction(functionName, parsedArgs);
                if (toolResult && typeof toolResult === 'object' && toolResult.success === false) {
                    throw new Error(toolResult.error || 'Tool execution reported a failure.');
                }
                const displayText = formatToolResult(functionName, toolResult);
                addMessage(displayText, 'bot');

                if (activityId) {
                    const resultSummary = summarizeResultForActivity(toolResult);
                    updateActivityEntry(activityId, 'success', resultSummary || 'Tool completed successfully.');
                    markActivityComplete(activityId);
                }

                conversationHistory.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: displayText
                });
            } catch (err) {
                const errorText = formatToolResult(functionName, null, err.message || 'Unknown error');
                addMessage(errorText, 'bot');
                if (activityId) {
                    updateActivityEntry(activityId, 'failed', err?.message || 'Unknown error');
                    markActivityComplete(activityId);
                }
                conversationHistory.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: errorText
                });
            }

            trimConversationHistory();
        }

        const followUpData = await callApiFn(buildModelMessages(), toolDefinitions);
        currentMessage = followUpData?.choices?.[0]?.message;
    }

    return currentMessage;
}



// Send message to OpenRouter API
async function sendMessageToOpenRouter(message, apiKey) {
    const toolDefinitions = await getOpenAIToolDefinitions();

    const callApi = async (messages, tools) => {
        const payload = {
            model: DEFAULT_MODEL,
            messages,
            max_tokens: 1000,
            temperature: 0.7
        };

        if (tools.length > 0) {
            payload.tools = tools;
        }

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AURA - Personal AI Assistant'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    };

    let data = await callApi(buildModelMessages(), toolDefinitions);
    let assistantMessage = data?.choices?.[0]?.message;

    if (!assistantMessage) {
        throw new Error('Invalid response format from OpenRouter API');
    }

    const finalMessage = await handleAssistantToolExecution(assistantMessage, toolDefinitions, callApi);
    const finalContent = normalizeContent(finalMessage?.content);

    if (!finalMessage || !finalContent) {
        throw new Error('Assistant did not return a usable response after tool execution.');
    }

    addMessage(finalContent, 'bot');

    conversationHistory.push({
        role: 'assistant',
        content: finalMessage.content
    });
    trimConversationHistory();

    const loggingActivityId = createActivityEntry('MCP • add_observations', 'Queueing conversation log', 'pending');
    if (loggingActivityId) {
        setActivityMeta(loggingActivityId, 'Entity: ChatBot');
        updateActivityEntry(loggingActivityId, 'running', 'Saving chat transcript...');
    }

    try {
        await use_mcp_tool('MCP_DOCKER', 'add_observations', {
            observations: [{
                entityName: 'ChatBot',
                contents: [
                    `User: ${message}`,
                    `AURA: ${finalContent}`
                ]
            }]
        });
        if (loggingActivityId) {
            updateActivityEntry(loggingActivityId, 'success', 'Transcript logged to MCP.');
            markActivityComplete(loggingActivityId);
        }
    } catch (mcpError) {
        if (loggingActivityId) {
            updateActivityEntry(loggingActivityId, 'failed', mcpError?.message || 'Failed to log transcript.');
            markActivityComplete(loggingActivityId);
        }
        console.error('MCP observation failed:', mcpError);
    }
}

// Send message to Azure OpenAI API
async function sendMessageToAzureOAI(message, apiKey) {
    const endpointRaw = AURA_CONFIG?.AZURE_OAI_ENDPOINT || '';
    const deploymentName = AURA_CONFIG?.AZURE_OAI_MODEL || AURA_CONFIG?.DEFAULT_MODEL || 'gpt-4o';
    const apiVersion = AURA_CONFIG?.AZURE_OAI_VERSION || '2024-06-01';

    if (!endpointRaw) {
        throw new Error('Azure OpenAI endpoint is not configured.');
    }

    const endpoint = endpointRaw.endsWith('/') ? endpointRaw.slice(0, -1) : endpointRaw;
    const apiUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const toolDefinitions = await getOpenAIToolDefinitions();

    const callApi = async (messages, tools) => {
        const payload = {
            messages,
            max_tokens: 1000,
            temperature: 0.7
        };

        if (tools.length > 0) {
            payload.tools = tools;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    };

    let data = await callApi(buildModelMessages(), toolDefinitions);
    let assistantMessage = data?.choices?.[0]?.message;

    if (!assistantMessage) {
        throw new Error('Invalid response format from Azure OpenAI API');
    }

    const finalMessage = await handleAssistantToolExecution(assistantMessage, toolDefinitions, callApi);
    const finalContent = normalizeContent(finalMessage?.content);

    if (!finalMessage || !finalContent) {
        throw new Error('Assistant did not return a usable response after tool execution.');
    }

    addMessage(finalContent, 'bot');

    conversationHistory.push({
        role: 'assistant',
        content: finalMessage.content
    });
    trimConversationHistory();

    const loggingActivityId = createActivityEntry('MCP • add_observations', 'Queueing conversation log', 'pending');
    if (loggingActivityId) {
        setActivityMeta(loggingActivityId, 'Entity: ChatBot');
        updateActivityEntry(loggingActivityId, 'running', 'Saving chat transcript...');
    }

    try {
        await use_mcp_tool('MCP_DOCKER', 'add_observations', {
            observations: [{
                entityName: 'ChatBot',
                contents: [
                    `User: ${message}`,
                    `AURA: ${finalContent}`
                ]
            }]
        });
        if (loggingActivityId) {
            updateActivityEntry(loggingActivityId, 'success', 'Transcript logged to MCP.');
            markActivityComplete(loggingActivityId);
        }
    } catch (mcpError) {
        if (loggingActivityId) {
            updateActivityEntry(loggingActivityId, 'failed', mcpError?.message || 'Failed to log transcript.');
            markActivityComplete(loggingActivityId);
        }
        console.error('MCP observation failed:', mcpError);
    }
}

// Execute MCP function called by Gemini
async function executeMCPFunction(functionName, args) {
    try {
        console.log(`🎯 Executing MCP function: ${functionName}`, args);
        
        // Use relative URLs so it works regardless of how the page is served
        const API_BASE = window.location.origin;
        
        // Check if this is an agent tool (format: agent_AgentName_toolName)
        if (functionName.startsWith('agent_')) {
            const parts = functionName.split('_');
            if (parts.length >= 3) {
                // Extract agentName and toolName
                const agentName = parts[1];
                const toolName = parts.slice(2).join('_');
                
                console.log(`📡 Routing to agent: ${agentName}, tool: ${toolName}`);
                
                const response = await fetch(`${API_BASE}/api/agents/${agentName}/command`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        command: toolName,
                        args: args
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log(`✅ Agent tool result:`, data);
                return data.result || data;
            }
        }
        
        // Handle legacy agent_command format
        if (functionName === 'agent_command') {
            const { agentId, command, args: commandArgs = {} } = args;
            const response = await fetch(`${API_BASE}/api/agents/${agentId}/command`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    command,
                    args: commandArgs
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Agent command result:`, data);
            return data.result || data;
        }
        
        // Handle built-in MCP tools (query_graph, create_entities, etc.)
        const response = await fetch(`${API_BASE}/api/mcp/tool/${functionName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Function result:`, data);
        
        return data.result || data;
    } catch (error) {
        console.error(`❌ Function execution error (${functionName}):`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Add message to chat
function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${formatMessage(content)}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // Animate message appearance
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(20px)';
    setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 100);
}

// Format message content
function formatMessage(content) {
    // Convert line breaks to <br> tags
    return content.replace(/\n/g, '<br>');
}

// Scroll chat to bottom
function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// Show loading state
function showLoading() {
    loading.style.display = 'flex';
    sendButton.disabled = true;
}

// Hide loading state
function hideLoading() {
    loading.style.display = 'none';
    sendButton.disabled = false;
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    
    // Auto-hide after 5 seconds
    setTimeout(hideError, 5000);
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Clear chat history
function clearChat() {
    chatMessages.innerHTML = `
        <div class="message bot-message">
            <div class="message-content">
                <p>Hello! I'm AURA, your personal AI assistant. I'm here to help you with questions, tasks, creative projects, and much more. What would you like to explore today?</p>
            </div>
        </div>
    `;
    conversationHistory = [];
    scrollToBottom();
    
    // Show confirmation
    setTimeout(() => {
        addMessage('Chat cleared! Ready for a fresh start. What can I help you with?', 'bot');
    }, 500);
}

// Export chat history as JSON
function exportChat() {
    const chatData = {
        ai_name: 'AURA',
        timestamp: new Date().toISOString(),
        model: DEFAULT_MODEL,
        messages: conversationHistory
    };
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `aura-chat-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    addMessage('📤 Chat exported successfully!', 'bot');
}

// MCP Management Functions
async function manageMCP() {
    try {
        const mcp = getMCPInstance();
        
        // Show MCP status
        const status = mcp.getStatus();
        const stats = mcp.getStatistics();
        
        let statusMsg = `🔧 MCP Status: ${status.status.toUpperCase()}\n`;
        statusMsg += `📊 Graph Statistics:\n`;
        statusMsg += `  • Entities: ${stats.entities}\n`;
        statusMsg += `  • Relations: ${stats.relations}\n`;
        statusMsg += `  • Observations: ${stats.observations}\n`;
        statusMsg += `  • Available Tools: ${status.toolsAvailable}\n`;
        
        addMessage(statusMsg, 'bot');
        
        // Create AURA entity in graph
        const createResult = await use_mcp_tool('MCP_DOCKER', 'create_entities', {
            entities: [{
                name: 'AURA_ChatBot',
                entityType: 'AI_Assistant',
                observations: [
                    'Personal AI assistant with OpenRouter integration',
                    'Supports chat history and export functionality',
                    'MCP-enabled graph database integration',
                    'Docker containerized MCP server support'
                ],
                metadata: {
                    version: '1.0.0',
                    lastUpdated: new Date().toISOString()
                }
            }]
        });
        
        console.log('Entity created:', createResult);
        
        // Create relations
        const relResult = await use_mcp_tool('MCP_DOCKER', 'create_relations', {
            relations: [{
                from: 'AURA_ChatBot',
                to: 'OpenRouter_API',
                relationType: 'uses',
                properties: {
                    model: DEFAULT_MODEL,
                    type: 'api_integration'
                }
            }, {
                from: 'AURA_ChatBot',
                to: 'MCP_Docker_Gateway',
                relationType: 'connects_to',
                properties: {
                    protocol: 'stdio',
                    containerized: true
                }
            }]
        });
        
        console.log('Relations created:', relResult);
        
        addMessage('✅ MCP integration configured successfully!\n\n📋 Available Tools:\n' + mcp.getAvailableTools().join('\n'), 'bot');
    } catch (error) {
        console.error('MCP management error:', error);
        addMessage('⚠️ MCP is running in simulation mode. Some features may be limited.', 'bot');
    }
}

// Function to read from MCP server
async function readMCPGraph() {
    try {
        const graphData = await use_mcp_tool('MCP_DOCKER', 'read_graph', {});
        console.log('MCP Graph Data:', graphData);
        return graphData;
    } catch (error) {
        console.error('Failed to read MCP graph:', error);
        return null;
    }
}

// Update MCP status indicator
function updateMCPStatusIndicator() {
    try {
        const status = getMCPStatus();
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (statusDot && statusText) {
            if (status.status === 'connected') {
                statusDot.style.backgroundColor = '#10b981';
                statusText.textContent = 'MCP Connected';
            } else if (status.status === 'simulated') {
                statusDot.style.backgroundColor = '#f59e0b';
                statusText.textContent = 'MCP Simulation Mode';
            } else {
                statusDot.style.backgroundColor = '#ef4444';
                statusText.textContent = 'MCP Disconnected';
            }
        }
    } catch (error) {
        console.error('Error updating MCP status:', error);
    }
}

// Query MCP graph
async function queryMCPGraph(query) {
    try {
        const mcp = getMCPInstance();
        const results = await mcp.useTool('query_graph', {
            query: query,
            limit: 50
        });
        return results;
    } catch (error) {
        console.error('MCP query error:', error);
        return null;
    }
}

// Export MCP graph data
async function exportMCPGraphData() {
    try {
        const mcp = getMCPInstance();
        const graphData = mcp.exportGraphData();
        
        const dataStr = JSON.stringify(graphData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `aura-mcp-graph-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        addMessage('📤 MCP graph data exported successfully!', 'bot');
    } catch (error) {
        console.error('MCP export error:', error);
        addMessage('❌ Failed to export MCP graph data', 'bot');
    }
}

// List all MCP resources
async function listMCPResources() {
    try {
        const mcp = getMCPInstance();
        const resources = await mcp.useTool('list_resources', {
            type: 'all'
        });
        
        let msg = '📦 MCP Resources:\n\n';
        resources.resources.forEach(res => {
            msg += `• ${res.name} (${res.type})\n`;
        });
        
        addMessage(msg, 'bot');
        return resources;
    } catch (error) {
        console.error('MCP list resources error:', error);
        addMessage('❌ Failed to list MCP resources', 'bot');
        return null;
    }
}

// Clear MCP graph
async function clearMCPGraph() {
    try {
        const mcp = getMCPInstance();
        const result = mcp.clearGraphData();
        addMessage('🗑️ MCP graph cleared successfully!', 'bot');
        return result;
    } catch (error) {
        console.error('MCP clear error:', error);
        addMessage('❌ Failed to clear MCP graph', 'bot');
    }
}

// Get MCP statistics
async function getMCPStats() {
    try {
        const mcp = getMCPInstance();
        const stats = mcp.getStatistics();
        
        let msg = '📊 MCP Statistics:\n\n';
        msg += `• Entities: ${stats.entities}\n`;
        msg += `• Relations: ${stats.relations}\n`;
        msg += `• Observations: ${stats.observations}\n`;
        msg += `• Status: ${stats.status}\n`;
        
        addMessage(msg, 'bot');
        return stats;
    } catch (error) {
        console.error('MCP stats error:', error);
        addMessage('❌ Failed to retrieve MCP statistics', 'bot');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus message input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        messageInput.focus();
    }
    
    // Ctrl/Cmd + L to clear chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        if (confirm('Are you sure you want to clear the AURA chat history?')) {
            clearChat();
        }
    }
    
    // Ctrl/Cmd + E to export chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportChat();
    }
    
    // Ctrl/Cmd + M to manage MCP
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        manageMCP();
    }
    
    // Ctrl/Cmd + G to view MCP graph
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        readMCPGraph();
    }
    
    // Ctrl/Cmd + S to get MCP stats
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        getMCPStats();
    }
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        console.log('🌟 AURA: Service Worker support detected');
    });
}

// Add AURA console message
console.log(`
✨ AURA - Advanced Universal Reasoning Assistant
===============================================

Welcome to your personal AI assistant!

Keyboard Shortcuts:
• Ctrl/Cmd + K: Focus message input
• Ctrl/Cmd + L: Clear chat history
• Ctrl/Cmd + E: Export chat as JSON
• Ctrl/Cmd + M: Manage MCP & configure graph
• Ctrl/Cmd + G: View MCP graph data
• Ctrl/Cmd + S: Get MCP statistics

MCP Integration:
• Docker-based MCP server support
• Graph database for entities, relations & observations
• Full tool ecosystem for knowledge management
• Simulation mode for development & testing

Ready to help with OpenRouter and MCP integration!
`);