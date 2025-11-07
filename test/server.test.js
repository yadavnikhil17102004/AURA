/**
 * AURA Server Integration Tests
 * Basic tests for MCP endpoints and agent discovery
 */

const request = require('supertest');

// We'll require the app but not start the server
// This allows us to test the Express app directly
const express = require('express');
const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');

const BASE_URL = 'http://localhost:8000';

describe('AURA Server Integration Tests', () => {
    
    describe('Health and Configuration', () => {
        test('GET /api/health returns OK status', async () => {
            const response = await request(BASE_URL).get('/api/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
            expect(response.body.service).toBe('AURA Server');
        });

        test('GET /api/config returns configuration', async () => {
            const response = await request(BASE_URL).get('/api/config');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('API_PROVIDER');
            expect(response.body).toHaveProperty('DEFAULT_MODEL');
        });
    });

    describe('Agent Discovery', () => {
        test('GET /api/agents returns agent list', async () => {
            const response = await request(BASE_URL).get('/api/agents');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('agents');
            expect(Array.isArray(response.body.agents)).toBe(true);
        });
    });

    describe('MCP Knowledge Graph', () => {
        test('POST /api/mcp/tool/create_entities creates new entities', async () => {
            const response = await request(BASE_URL)
                .post('/api/mcp/tool/create_entities')
                .send({
                    entities: [{
                        name: 'TestEntity',
                        entityType: 'test',
                        observations: ['This is a test entity']
                    }]
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.result.entities_created).toBeGreaterThan(0);
        });

        test('POST /api/mcp/tool/query_graph searches the graph', async () => {
            const response = await request(BASE_URL)
                .post('/api/mcp/tool/query_graph')
                .send({ query: 'test' });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.result).toHaveProperty('results');
            expect(Array.isArray(response.body.result.results)).toBe(true);
        });

        test('POST /api/mcp/tool/read_graph returns graph structure', async () => {
            const response = await request(BASE_URL)
                .post('/api/mcp/tool/read_graph')
                .send({});
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.result.graph).toHaveProperty('entities');
            expect(response.body.result.graph).toHaveProperty('relations');
        });
    });

    describe('Docker MCP', () => {
        test('GET /api/mcp/docker/info returns Docker status', async () => {
            const response = await request(BASE_URL).get('/api/mcp/docker/info');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('docker');
            expect(response.body.docker).toHaveProperty('available');
        });

        test('GET /api/mcp/servers returns MCP server list', async () => {
            const response = await request(BASE_URL).get('/api/mcp/servers');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('servers');
            expect(Array.isArray(response.body.servers)).toBe(true);
        });
    });
});
