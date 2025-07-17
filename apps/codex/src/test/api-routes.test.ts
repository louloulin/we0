/**
 * API Routes Test Suite
 * 
 * Tests all API endpoints for compatibility with we-dev-next
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Test configuration
const API_BASE_URL = 'http://localhost:4111';
const TEST_TIMEOUT = 30000;

describe('API Routes Compatibility Tests', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('/api/model endpoint', () => {
    test('should return model configurations', async () => {
      const response = await fetch(`${API_BASE_URL}/model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      // Check model structure
      const model = data[0];
      expect(model).toHaveProperty('label');
      expect(model).toHaveProperty('value');
      expect(model).toHaveProperty('useImage');
      expect(model).toHaveProperty('provider');
      expect(model).toHaveProperty('functionCall');

      console.log('✅ Model configurations:', data.length, 'models found');
    }, TEST_TIMEOUT);
  });

  describe('/api/enhancedPrompt endpoint', () => {
    test('should enhance a simple prompt', async () => {
      const testPrompt = 'Write a function';
      
      const response = await fetch(`${API_BASE_URL}/enhancedPrompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testPrompt,
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('code');
      expect(data.code).toBe(0);
      expect(data).toHaveProperty('text');
      expect(typeof data.text).toBe('string');
      expect(data.text.length).toBeGreaterThan(testPrompt.length);

      console.log('✅ Enhanced prompt generated successfully');
    }, TEST_TIMEOUT);

    test('should handle invalid request', async () => {
      const response = await fetch(`${API_BASE_URL}/enhancedPrompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing 'text' field
        }),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('code');
      expect(data.code).toBe(1);
      expect(data).toHaveProperty('messages');

      console.log('✅ Invalid request handled correctly');
    }, TEST_TIMEOUT);
  });

  describe('/api/chat endpoint', () => {
    test('should handle chat mode request', async () => {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test message',
            },
          ],
          model: 'deepseek-chat',
          mode: 'chat',
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('choices');
      expect(Array.isArray(data.choices)).toBe(true);
      expect(data.choices.length).toBeGreaterThan(0);
      
      const choice = data.choices[0];
      expect(choice).toHaveProperty('message');
      expect(choice.message).toHaveProperty('role');
      expect(choice.message).toHaveProperty('content');
      expect(choice.message.role).toBe('assistant');

      console.log('✅ Chat mode request handled successfully');
    }, TEST_TIMEOUT);

    test('should handle builder mode request', async () => {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Create a simple React component',
            },
          ],
          model: 'deepseek-chat',
          mode: 'builder',
          otherConfig: {
            isBackEnd: false,
            backendLanguage: 'javascript',
            type: 'other',
          },
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('choices');
      expect(Array.isArray(data.choices)).toBe(true);
      
      const choice = data.choices[0];
      expect(choice.message.role).toBe('assistant');
      expect(typeof choice.message.content).toBe('string');

      console.log('✅ Builder mode request handled successfully');
    }, TEST_TIMEOUT);

    test('should handle invalid request format', async () => {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');

      console.log('✅ Invalid chat request handled correctly');
    }, TEST_TIMEOUT);
  });

  describe('/api/deploy endpoint', () => {
    test('should handle missing file', async () => {
      const formData = new FormData();
      // Not adding any file

      const response = await fetch(`${API_BASE_URL}/deploy`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('message');

      console.log('✅ Deploy endpoint handles missing file correctly');
    }, TEST_TIMEOUT);

    test('should handle invalid file type', async () => {
      const formData = new FormData();
      const textFile = new Blob(['test content'], { type: 'text/plain' });
      formData.append('file', textFile, 'test.txt');
      
      const response = await fetch(`${API_BASE_URL}/deploy`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid file type');

      console.log('✅ Deploy endpoint handles invalid file type correctly');
    }, TEST_TIMEOUT);
  });

  describe('CORS and Headers', () => {
    test('should handle OPTIONS requests', async () => {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');

      console.log('✅ CORS OPTIONS request handled correctly');
    }, TEST_TIMEOUT);
  });
});

// Export for manual testing
export async function runManualAPITests() {
  console.log('🧪 Running manual API tests...');
  
  try {
    // Test model endpoint
    console.log('\n📋 Testing /api/model...');
    const modelResponse = await fetch(`${API_BASE_URL}/model`, {
      method: 'POST',
    });
    const models = await modelResponse.json();
    console.log(`✅ Found ${models.length} models`);

    // Test enhanced prompt
    console.log('\n🔧 Testing /api/enhancedPrompt...');
    const promptResponse = await fetch(`${API_BASE_URL}/enhancedPrompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Write a function' }),
    });
    const promptResult = await promptResponse.json();
    console.log(`✅ Enhanced prompt: ${promptResult.text?.substring(0, 100)}...`);

    console.log('\n🎉 All manual tests passed!');
  } catch (error) {
    console.error('❌ Manual test failed:', error);
  }
}
