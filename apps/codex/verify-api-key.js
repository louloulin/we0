/**
 * Verify API Key Configuration
 * 
 * Simple script to test if the DeepSeek API key is working
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

console.log('🔍 Verifying API Key Configuration...');
console.log('API Key:', DEEPSEEK_API_KEY ? `${DEEPSEEK_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('Base URL:', DEEPSEEK_BASE_URL);

if (!DEEPSEEK_API_KEY) {
  console.error('❌ DEEPSEEK_API_KEY is not set');
  process.exit(1);
}

async function testApiKey() {
  try {
    console.log('\n📡 Testing API connection...');
    
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Hello, please respond with just "API key is working"'
          }
        ],
        max_tokens: 20,
        temperature: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      console.error('Response:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ API key is working!');
    console.log('Response:', data.choices[0].message.content);
    return true;

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

testApiKey().then(success => {
  if (success) {
    console.log('\n🎉 API key verification successful!');
    process.exit(0);
  } else {
    console.log('\n💥 API key verification failed!');
    process.exit(1);
  }
});
