// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const closeError = document.getElementById('closeError');

// OpenRouter API configuration (using AURA config)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
let DEFAULT_MODEL = 'anthropic/claude-3-haiku';
let AURA_CONFIG = null;

// Chat state
let conversationHistory = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeAURA();
});

// Initialize AURA with configuration
function initializeAURA() {
    // Load AURA configuration
    if (window.AURA_CONFIG) {
        AURA_CONFIG = window.AURA_CONFIG;
        DEFAULT_MODEL = AURA_CONFIG.DEFAULT_MODEL || DEFAULT_MODEL;
    }
    
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

// Send message to OpenRouter API
async function sendMessage() {
    const message = messageInput.value.trim();
    const apiKey = localStorage.getItem('openrouter_api_key');
    
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
            
            // Keep only last 10 exchanges to manage token usage
            if (conversationHistory.length > 20) {
                conversationHistory = conversationHistory.slice(-20);
            }
        } else {
            throw new Error('Invalid response format from OpenRouter API');
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

Ready to help! Just start typing your message.
`);