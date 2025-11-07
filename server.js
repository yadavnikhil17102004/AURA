#!/usr/bin/env node

/**
 * AURA - Unified Node.js Server
 * 
 * This server handles:
 * 1. Serving static files (HTML, CSS, JS)
 * 2. Configuration API endpoint (/api/config)
 * 3. MCP Docker bridge API (/api/mcp/*)
 * 
 * Run: node server.js
 */

const express = require('express');
const cors = require('cors');
const Docker = require('dockerode');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const docker = new Docker();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ==================== Configuration API ====================

app.get('/api/config', (req, res) => {
    const config = {
        API_KEY: process.env.API_KEY || '',
        API_PROVIDER: process.env.API_PROVIDER || 'google',
        DEFAULT_MODEL: process.env.DEFAULT_MODEL || 'gemini-2.5-flash',
        AI_NAME: process.env.AI_NAME || 'AURA',
        AI_PERSONALITY: process.env.AI_PERSONALITY || 'personal_assistant',
        SYSTEM_PROMPT: process.env.SYSTEM_PROMPT || `You are AURA, a helpful, friendly, and intelligent personal assistant. Your name stands for "Advanced Universal Reasoning Assistant". You are designed to be:

- Helpful and proactive in solving problems
- Clear and concise in your communication
- Patient and understanding
- Knowledgeable across many topics
- Always focused on being genuinely useful

Your personality traits:
- Warm and approachable
- Efficient and organized
- Curious and learning-oriented
- Respectful of different perspectives
- Supporting and encouraging

When responding:
- Be conversational but professional
- Ask clarifying questions when needed
- Provide practical, actionable advice
- Keep responses focused and relevant
- Show enthusiasm for helping

Remember: You are AURA, and you're here to make the user's life easier and more productive!`
    };
    
    res.json(config);
});

// ==================== MCP Docker Bridge API ====================

// Get list of available MCP servers from Docker
app.get('/api/mcp/servers', async (req, res) => {
    try {
        const images = await docker.listImages();
        const mcpServers = [];

        for (const image of images) {
            const tags = image.RepoTags || [];
            
            for (const tag of tags) {
                // Look for images that might be MCP servers
                if (tag.includes('mcp') || tag.includes('model-context-protocol')) {
                    const [name, version] = tag.split(':');
                    
                    mcpServers.push({
                        id: `docker_${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        name: name.split('/').pop(),
                        image: tag,
                        version: version || 'latest',
                        status: 'available',
                        type: 'docker'
                    });
                }
            }
        }

        res.json({
            success: true,
            servers: mcpServers,
            count: mcpServers.length
        });
    } catch (error) {
        console.error('Error listing Docker images:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            servers: []
        });
    }
});

// Get Docker system info
app.get('/api/mcp/docker/info', async (req, res) => {
    try {
        const info = await docker.info();
        res.json({
            success: true,
            docker: {
                available: true,
                version: info.ServerVersion,
                containers: info.Containers,
                images: info.Images
            }
        });
    } catch (error) {
        res.json({
            success: false,
            docker: {
                available: false,
                error: error.message
            }
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AURA Server',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ==================== Start Server ====================

app.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log('✨  AURA Server Started Successfully!');
    console.log('🚀 ========================================\n');
    console.log(`📡 Server running at: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 AI Provider: ${process.env.API_PROVIDER || 'google'}`);
    console.log(`🧠 Model: ${process.env.DEFAULT_MODEL || 'gemini-2.5-flash'}`);
    console.log('\n📋 Available Endpoints:');
    console.log('   • GET  /                    - AURA Web Interface');
    console.log('   • GET  /api/config          - Configuration');
    console.log('   • GET  /api/health          - Health Check');
    console.log('   • GET  /api/mcp/servers     - MCP Servers List');
    console.log('   • GET  /api/mcp/docker/info - Docker Information');
    console.log('\n💡 Press Ctrl+C to stop the server\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down AURA server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Shutting down AURA server gracefully...');
    process.exit(0);
});
