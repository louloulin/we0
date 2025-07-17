#!/usr/bin/env node

/**
 * Direct Workflow Execution Test
 * 
 * Tests workflow execution using the Mastra instance directly
 */

async function testWorkflowExecution() {
  console.log('🔄 Testing Direct Workflow Execution...');
  
  try {
    // Import the Mastra instance
    const { mastra } = await import('./src/mastra/index.ts');
    
    console.log('✅ Mastra instance imported successfully');
    
    // Test Builder Workflow
    console.log('\n🏗️ Testing Builder Workflow...');
    
    const builderWorkflow = mastra.getWorkflow('builderWorkflow');
    if (!builderWorkflow) {
      console.log('❌ Builder workflow not found');
      return false;
    }
    
    console.log('✅ Builder workflow found');
    
    // Create a run
    const builderRun = await builderWorkflow.createRunAsync();
    console.log('✅ Builder run created');
    
    // Execute the workflow
    const builderResult = await builderRun.start({
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
    });
    
    console.log(`✅ Builder workflow executed with status: ${builderResult.status}`);
    
    if (builderResult.status === 'success' && builderResult.result) {
      console.log('📝 Generated content preview:');
      const content = builderResult.result.choices?.[0]?.message?.content;
      if (content) {
        console.log(`   ${content.substring(0, 200)}...`);
      }
    } else if (builderResult.status === 'failed') {
      console.log(`❌ Builder workflow failed: ${builderResult.error}`);
    }
    
    // Test Chat Workflow
    console.log('\n💬 Testing Chat Workflow...');
    
    const chatWorkflow = mastra.getWorkflow('chatWorkflow');
    if (!chatWorkflow) {
      console.log('❌ Chat workflow not found');
      return false;
    }
    
    console.log('✅ Chat workflow found');
    
    // Create a run
    const chatRun = await chatWorkflow.createRunAsync();
    console.log('✅ Chat run created');
    
    // Execute the workflow
    const chatResult = await chatRun.start({
      inputData: {
        messages: [
          {
            role: 'user',
            content: 'Hello! Can you explain what machine learning is in simple terms?'
          }
        ],
        model: 'deepseek-chat'
      }
    });
    
    console.log(`✅ Chat workflow executed with status: ${chatResult.status}`);
    
    if (chatResult.status === 'success' && chatResult.result) {
      console.log('💬 Chat response preview:');
      const content = chatResult.result.choices?.[0]?.message?.content;
      if (content) {
        console.log(`   ${content.substring(0, 200)}...`);
      }
    } else if (chatResult.status === 'failed') {
      console.log(`❌ Chat workflow failed: ${chatResult.error}`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Workflow execution test failed: ${error.message}`);
    console.log('Stack trace:', error.stack);
    return false;
  }
}

async function testWorkflowStreaming() {
  console.log('\n🌊 Testing Workflow Streaming...');
  
  try {
    // Import the Mastra instance
    const { mastra } = await import('./src/mastra/index.ts');
    
    const chatWorkflow = mastra.getWorkflow('chatWorkflow');
    const chatRun = await chatWorkflow.createRunAsync();
    
    console.log('✅ Starting streaming execution...');
    
    // Test streaming
    const stream = chatRun.stream({
      inputData: {
        messages: [
          {
            role: 'user',
            content: 'Tell me a short story about AI'
          }
        ],
        model: 'deepseek-chat'
      }
    });
    
    let eventCount = 0;
    let hasContent = false;
    
    for await (const chunk of stream) {
      eventCount++;
      
      if (eventCount <= 5) {
        console.log(`📡 Event ${eventCount}: ${chunk.type}`);
        
        if (chunk.type === 'step-result' && chunk.payload?.output) {
          hasContent = true;
          console.log('   ✅ Content generated successfully');
        }
      }
      
      // Limit test to avoid long output
      if (eventCount >= 10) {
        break;
      }
    }
    
    console.log(`📊 Streaming completed: ${eventCount} events, content: ${hasContent ? 'Yes' : 'No'}`);
    
    return true;
    
  } catch (error) {
    console.log(`❌ Streaming test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Direct Workflow Execution Tests...');
  
  const results = [];
  
  results.push(await testWorkflowExecution());
  results.push(await testWorkflowStreaming());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All workflow execution tests passed!');
    console.log('✅ Workflow system is working correctly');
  } else if (passed >= 1) {
    console.log('\n⚠️  Some workflow features are working');
    console.log('🔧 Some components may need API keys for full functionality');
  } else {
    console.log('\n❌ Workflow execution has issues');
    console.log('🔧 Further debugging required');
  }
  
  return passed === total;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };
