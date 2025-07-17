#!/usr/bin/env node

/**
 * API Test Script
 * 
 * Tests all implemented API endpoints for compatibility with we-dev-next
 */

const API_BASE_URL = 'http://localhost:4111';

async function testModelAPI() {
  console.log('\n📋 Testing /model API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Model API: Found ${data.length} models`);
      console.log('   Models:', data.map(m => m.label).join(', '));
      return true;
    } else {
      console.log(`❌ Model API failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Model API error: ${error.message}`);
    return false;
  }
}

async function testEnhancedPromptAPI() {
  console.log('\n🔧 Testing /enhancedPrompt API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/enhancedPrompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Write a function'
      }),
    });

    const data = await response.json();
    
    if (data.code === 0) {
      console.log('✅ Enhanced Prompt API: Working');
      console.log(`   Enhanced: ${data.text?.substring(0, 100)}...`);
      return true;
    } else {
      console.log(`⚠️  Enhanced Prompt API: ${data.messages} (API key issue)`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Enhanced Prompt API error: ${error.message}`);
    return false;
  }
}

async function testChatAPI() {
  console.log('\n💬 Testing /chat API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test'
          }
        ],
        model: 'deepseek-chat',
        mode: 'chat'
      }),
    });

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      console.log('✅ Chat API: Working');
      console.log(`   Response: ${data.choices[0].message.content?.substring(0, 100)}...`);
      return true;
    } else if (data.error && data.message?.includes('Authentication')) {
      console.log('⚠️  Chat API: Structure correct, API key issue');
      return false;
    } else {
      console.log(`❌ Chat API failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Chat API error: ${error.message}`);
    return false;
  }
}

async function testDeployAPI() {
  console.log('\n🚀 Testing /deploy API...');
  
  try {
    // Test with missing file
    const response = await fetch(`${API_BASE_URL}/deploy`, {
      method: 'POST',
      body: new FormData(),
    });

    const data = await response.json();
    
    if (data.success === false && data.message?.includes('No file provided')) {
      console.log('✅ Deploy API: Working (correctly handles missing file)');
      return true;
    } else {
      console.log(`❌ Deploy API unexpected response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Deploy API error: ${error.message}`);
    return false;
  }
}

async function testCORSHeaders() {
  console.log('\n🌐 Testing CORS headers...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/model`, {
      method: 'OPTIONS',
    });

    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
    const corsMethods = response.headers.get('Access-Control-Allow-Methods');
    
    if (corsOrigin === '*' && corsMethods?.includes('POST')) {
      console.log('✅ CORS: Headers configured correctly');
      return true;
    } else {
      console.log(`❌ CORS: Headers not configured properly`);
      console.log(`   Origin: ${corsOrigin}, Methods: ${corsMethods}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ CORS test error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting API Compatibility Tests...');
  console.log(`📡 Testing against: ${API_BASE_URL}`);
  
  const results = [];
  
  results.push(await testModelAPI());
  results.push(await testEnhancedPromptAPI());
  results.push(await testChatAPI());
  results.push(await testDeployAPI());
  results.push(await testCORSHeaders());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All API endpoints are working correctly!');
    console.log('✅ Ready for production deployment');
  } else if (passed >= 3) {
    console.log('\n⚠️  Most API endpoints are working');
    console.log('🔑 API key configuration needed for full functionality');
  } else {
    console.log('\n❌ Multiple API endpoints have issues');
    console.log('🔧 Further debugging required');
  }
  
  return passed === total;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };
