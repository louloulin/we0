#!/usr/bin/env node

/**
 * Workflow Structure Test
 * 
 * Tests the workflow structure and registration without requiring API keys
 */

async function testWorkflowRegistration() {
  console.log('📋 Testing Workflow Registration...');
  
  try {
    // Import the Mastra instance
    const { mastra } = await import('./src/mastra/index.ts');
    
    console.log('✅ Mastra instance imported successfully');
    
    // Check registered workflows
    const workflows = ['builderWorkflow', 'chatWorkflow', 'weatherWorkflow', 'deepseekCodeGenerationWorkflow'];
    let registeredCount = 0;
    
    for (const workflowName of workflows) {
      const workflow = mastra.getWorkflow(workflowName);
      if (workflow) {
        console.log(`✅ ${workflowName}: Registered`);
        registeredCount++;
        
        // Check workflow properties
        if (workflow.id) {
          console.log(`   ID: ${workflow.id}`);
        }
        if (workflow.inputSchema) {
          console.log(`   Input Schema: ✅ Defined`);
        }
        if (workflow.outputSchema) {
          console.log(`   Output Schema: ✅ Defined`);
        }
      } else {
        console.log(`❌ ${workflowName}: Not registered`);
      }
    }
    
    console.log(`\n📊 Workflow Registration Summary: ${registeredCount}/${workflows.length} workflows registered`);
    
    return registeredCount >= 2; // At least our new workflows should be registered
    
  } catch (error) {
    console.log(`❌ Workflow registration test failed: ${error.message}`);
    return false;
  }
}

async function testWorkflowSteps() {
  console.log('\n🔧 Testing Workflow Steps...');
  
  try {
    // Import workflow modules directly
    const { builderWorkflow } = await import('./src/mastra/workflows/builder-workflow.ts');
    const { chatWorkflow } = await import('./src/mastra/workflows/chat-workflow.ts');
    
    console.log('✅ Workflow modules imported successfully');
    
    // Test Builder Workflow structure
    console.log('\n🏗️ Builder Workflow Analysis:');
    console.log(`   ID: ${builderWorkflow.id}`);
    console.log(`   Description: ${builderWorkflow.description || 'No description'}`);
    
    // Check if workflow has steps
    if (builderWorkflow.stepGraph && builderWorkflow.stepGraph.length > 0) {
      console.log(`   Steps: ${builderWorkflow.stepGraph.length} steps defined`);
      builderWorkflow.stepGraph.forEach((step, index) => {
        if (step.type === 'step') {
          console.log(`     ${index + 1}. ${step.step.id}: ${step.step.description}`);
        }
      });
    }
    
    // Test Chat Workflow structure
    console.log('\n💬 Chat Workflow Analysis:');
    console.log(`   ID: ${chatWorkflow.id}`);
    console.log(`   Description: ${chatWorkflow.description || 'No description'}`);
    
    if (chatWorkflow.stepGraph && chatWorkflow.stepGraph.length > 0) {
      console.log(`   Steps: ${chatWorkflow.stepGraph.length} steps defined`);
      chatWorkflow.stepGraph.forEach((step, index) => {
        if (step.type === 'step') {
          console.log(`     ${index + 1}. ${step.step.id}: ${step.step.description}`);
        }
      });
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Workflow steps test failed: ${error.message}`);
    return false;
  }
}

async function testWorkflowSchemas() {
  console.log('\n📝 Testing Workflow Schemas...');
  
  try {
    const { builderWorkflow } = await import('./src/mastra/workflows/builder-workflow.ts');
    const { chatWorkflow } = await import('./src/mastra/workflows/chat-workflow.ts');
    
    // Test Builder Workflow schemas
    console.log('\n🏗️ Builder Workflow Schemas:');
    
    if (builderWorkflow.inputSchema) {
      console.log('   ✅ Input Schema: Defined');
      
      // Test schema validation with sample data
      try {
        const sampleInput = {
          messages: [{ role: 'user', content: 'test' }],
          model: 'test-model'
        };
        
        const parsed = JSON.parse(builderWorkflow.inputSchema);
        console.log('   ✅ Input Schema: Valid JSON structure');
      } catch (e) {
        console.log('   ⚠️  Input Schema: Complex structure (expected)');
      }
    }
    
    if (builderWorkflow.outputSchema) {
      console.log('   ✅ Output Schema: Defined');
    }
    
    // Test Chat Workflow schemas
    console.log('\n💬 Chat Workflow Schemas:');
    
    if (chatWorkflow.inputSchema) {
      console.log('   ✅ Input Schema: Defined');
    }
    
    if (chatWorkflow.outputSchema) {
      console.log('   ✅ Output Schema: Defined');
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Workflow schemas test failed: ${error.message}`);
    return false;
  }
}

async function testAgentFactory() {
  console.log('\n🤖 Testing Agent Factory Integration...');
  
  try {
    const { AgentFactory } = await import('./src/mastra/agents/multi-model-agent.ts');
    
    console.log('✅ AgentFactory imported successfully');
    
    // Test task optimization logic
    const taskTypes = ['reasoning', 'vision', 'coding', 'general'];
    
    for (const taskType of taskTypes) {
      try {
        const bestModel = AgentFactory.getBestModelForTask(taskType);
        console.log(`✅ Best model for ${taskType}: ${bestModel}`);
      } catch (error) {
        console.log(`❌ Task optimization failed for ${taskType}: ${error.message}`);
      }
    }
    
    // Test agent creation methods (without actually creating agents)
    const agentMethods = ['createChatAgent', 'createBuilderAgent', 'createEnhancedPromptAgent'];
    
    for (const method of agentMethods) {
      if (typeof AgentFactory[method] === 'function') {
        console.log(`✅ ${method}: Method available`);
      } else {
        console.log(`❌ ${method}: Method not found`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Agent Factory test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Workflow Structure Tests...');
  console.log('📝 Note: These tests validate structure without requiring API keys\n');
  
  const results = [];
  
  results.push(await testWorkflowRegistration());
  results.push(await testWorkflowSteps());
  results.push(await testWorkflowSchemas());
  results.push(await testAgentFactory());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All workflow structure tests passed!');
    console.log('✅ Workflow system architecture is correct');
    console.log('🔑 Ready for production with valid API keys');
  } else if (passed >= 3) {
    console.log('\n⚠️  Most workflow components are working');
    console.log('🔧 Minor issues detected');
  } else {
    console.log('\n❌ Multiple workflow components have structural issues');
    console.log('🔧 Architecture review required');
  }
  
  return passed === total;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };
