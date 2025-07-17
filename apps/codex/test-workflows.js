#!/usr/bin/env node

/**
 * Workflow System Test Script
 * 
 * Tests the new workflow system implementation
 */

const API_BASE_URL = 'http://localhost:4111';

async function testWorkflowsAPI() {
  console.log('🔄 Testing Workflows API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows`, {
      method: 'GET',
    });

    if (response.ok) {
      const workflows = await response.json();
      console.log(`✅ Workflows API: Found ${Object.keys(workflows).length} workflows`);
      
      // List available workflows
      Object.keys(workflows).forEach(workflowName => {
        console.log(`   📋 ${workflowName}: ${workflows[workflowName].description || 'No description'}`);
      });
      
      return true;
    } else {
      console.log(`❌ Workflows API failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Workflows API error: ${error.message}`);
    return false;
  }
}

async function testBuilderWorkflow() {
  console.log('\n🏗️ Testing Builder Workflow...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows/builderWorkflow/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputData: {
          messages: [
            {
              role: 'user',
              content: 'Create a simple JavaScript function that adds two numbers'
            }
          ],
          model: 'deepseek-chat',
          otherConfig: {
            isBackEnd: false,
            type: 'other'
          }
        }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Builder Workflow: Executed successfully');
      console.log(`   Status: ${result.status}`);
      
      if (result.result && result.result.choices) {
        const content = result.result.choices[0].message.content;
        console.log(`   Generated: ${content.substring(0, 100)}...`);
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Builder Workflow failed: ${response.status}`);
      console.log(`   Error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Builder Workflow error: ${error.message}`);
    return false;
  }
}

async function testChatWorkflow() {
  console.log('\n💬 Testing Chat Workflow...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows/chatWorkflow/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputData: {
          messages: [
            {
              role: 'user',
              content: 'Hello! Can you explain what machine learning is?'
            }
          ],
          model: 'deepseek-chat'
        }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Chat Workflow: Executed successfully');
      console.log(`   Status: ${result.status}`);
      
      if (result.result && result.result.choices) {
        const content = result.result.choices[0].message.content;
        console.log(`   Response: ${content.substring(0, 100)}...`);
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Chat Workflow failed: ${response.status}`);
      console.log(`   Error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Chat Workflow error: ${error.message}`);
    return false;
  }
}

async function testWorkflowStreaming() {
  console.log('\n🌊 Testing Workflow Streaming...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows/chatWorkflow/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputData: {
          messages: [
            {
              role: 'user',
              content: 'Tell me a short story about AI'
            }
          ],
          model: 'deepseek-chat'
        }
      }),
    });

    if (response.ok && response.body) {
      console.log('✅ Workflow Streaming: Started successfully');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let eventCount = 0;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log(`   📊 Received ${eventCount} events`);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.trim() && !line.startsWith(':')) {
              eventCount++;
              if (eventCount <= 3) {
                console.log(`   📡 Event ${eventCount}: ${line.substring(0, 50)}...`);
              }
            }
          }
          
          // Limit test to avoid long output
          if (eventCount >= 10) {
            break;
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      return true;
    } else {
      console.log(`❌ Workflow Streaming failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Workflow Streaming error: ${error.message}`);
    return false;
  }
}

async function testAPICompatibility() {
  console.log('\n🔗 Testing API Compatibility...');
  
  // Test if our existing API routes still work
  const tests = [
    { name: 'Model API', url: `${API_BASE_URL}/model`, method: 'POST' },
    { name: 'Deploy API', url: `${API_BASE_URL}/deploy`, method: 'POST' },
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
        body: test.method === 'POST' ? JSON.stringify({}) : undefined,
      });
      
      if (response.ok || response.status === 400) { // 400 is expected for some endpoints
        console.log(`✅ ${test.name}: Compatible`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: Failed (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
    }
  }
  
  return passed === tests.length;
}

async function runAllTests() {
  console.log('🧪 Starting Workflow System Tests...');
  console.log(`📡 Testing against: ${API_BASE_URL}`);
  
  const results = [];
  
  results.push(await testWorkflowsAPI());
  results.push(await testAPICompatibility());
  results.push(await testBuilderWorkflow());
  results.push(await testChatWorkflow());
  results.push(await testWorkflowStreaming());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All workflow tests passed!');
    console.log('✅ Workflow system is working correctly');
  } else if (passed >= 3) {
    console.log('\n⚠️  Most workflow features are working');
    console.log('🔧 Some components may need API keys for full functionality');
  } else {
    console.log('\n❌ Multiple workflow components have issues');
    console.log('🔧 Further debugging required');
  }
  
  return passed === total;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };
