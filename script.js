// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const closeError = document.getElementById('closeError');

// OpenRouter API configuration (or Google AI)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GOOGLE_AI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
let DEFAULT_MODEL = 'anthropic/claude-3-haiku';
let AURA_CONFIG = null;

// Chat state
let conversationHistory = [];

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
    }
    
    // Initialize MCP system
    initializeMCPSystem().then(() => {
        console.log('✅ MCP system initialized');
        updateMCPStatusIndicator();
    }).catch(error => {
        console.error('Error initializing MCP:', error);
    });
    
    setupEventListeners();
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

// Send message to API (OpenRouter or Google AI)
async function sendMessage() {
    const message = messageInput.value.trim();
    const apiKey = localStorage.getItem('openrouter_api_key') || localStorage.getItem('google_ai_key');
    
    if (!message) return;
    
    if (!apiKey) {
        showError('AURA is not properly configured. Please check the setup.');
        return;
    }
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    messageInput.value = '';
    autoResizeTextarea();
    
    // Show loading
    showLoading();
    
    try {
        const apiProvider = AURA_CONFIG?.API_PROVIDER || 'openrouter';
        
        if (apiProvider.toLowerCase().startsWith('google')) {
            await sendMessageToGoogleAI(message, apiKey);
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

// Send message to Google AI API
async function sendMessageToGoogleAI(message, apiKey) {
    const systemPrompt = AURA_CONFIG?.SYSTEM_PROMPT || 'You are AURA, a helpful personal AI assistant.';
    
    // Prepare conversation history for Google AI
    const formattedMessages = [];
    
    // Add system message as first user message
    formattedMessages.push({
        role: 'user',
        parts: { text: systemPrompt }
    });
    
    formattedMessages.push({
        role: 'model',
        parts: { text: 'I understand. I am AURA, your personal assistant. How can I help you today?' }
    });
    
    // Add conversation history
    for (const msg of conversationHistory) {
        formattedMessages.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: { text: msg.content }
        });
    }
    
    // Add current message
    formattedMessages.push({
        role: 'user',
        parts: { text: message }
    });
    
    const response = await fetch(`${GOOGLE_AI_URL}/${DEFAULT_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: formattedMessages,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
                topP: 0.95
            }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const botResponse = data.candidates[0].content.parts[0].text;
        
        // Add bot response to chat
        addMessage(botResponse, 'bot');
        
        // Update conversation history
        conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: botResponse }
        );
        
        // Add observation to MCP server
        try {
            await use_mcp_tool('MCP_DOCKER', 'add_observations', {
                observations: [{
                    entityName: 'ChatBot',
                    contents: [
                        `User: ${message}`,
                        `AURA: ${botResponse}`
                    ]
                }]
            });
        } catch (mcpError) {
            console.error('MCP observation failed:', mcpError);
        }
        
        // Keep only last 10 exchanges to manage token usage
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }
    } else {
        throw new Error('Invalid response format from Google AI API');
    }
}

// Send message to OpenRouter API
async function sendMessageToOpenRouter(message, apiKey) {
    // Prepare conversation history for API
    const messages = [
        {
            role: 'system',
            content: AURA_CONFIG?.SYSTEM_PROMPT || 'You are AURA, a helpful personal AI assistant.'
        },
        ...conversationHistory,
        {
            role: 'user',
            content: message
        }
    ];
    
    // Make API call to OpenRouter
    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'AURA - Personal AI Assistant'
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
        const botResponse = data.choices[0].message.content;
        
        // Add bot response to chat
        addMessage(botResponse, 'bot');
        
        // Update conversation history
        conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: botResponse }
        );
        
        // Add observation to MCP server
        try {
            await use_mcp_tool('MCP_DOCKER', 'add_observations', {
                observations: [{
                    entityName: 'ChatBot',
                    contents: [
                        `User: ${message}`,
                        `AURA: ${botResponse}`
                    ]
                }]
            });
        } catch (mcpError) {
            console.error('MCP observation failed:', mcpError);
        }
        
        // Keep only last 10 exchanges to manage token usage
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }
    } else {
        throw new Error('Invalid response format from OpenRouter API');
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