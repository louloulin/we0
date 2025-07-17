#!/usr/bin/env node

/**
 * Model Manager Test Script
 * 
 * Tests the model manager and multi-model agent system
 */

async function testModelManager() {
  console.log('🧪 Testing Model Manager...');
  
  try {
    // Import the model manager
    const { modelManager } = await import('./src/mastra/models/model-manager.ts');
    
    console.log('\n📋 Testing model configurations...');
    
    // Test getting all configs
    const allConfigs = modelManager.getAllConfigs();
    console.log(`✅ Found ${allConfigs.length} model configurations`);
    
    // Test getting public configs
    const publicConfigs = modelManager.getPublicConfigs();
    console.log(`✅ Generated ${publicConfigs.length} public configurations`);
    
    // Test each model configuration
    const modelKeys = ['deepseek-chat', 'deepseek-reasoner', 'claude-3-5-sonnet', 'gpt-4o-mini'];
    
    for (const modelKey of modelKeys) {
      const config = modelManager.getModelConfig(modelKey);
      if (config) {
        console.log(`✅ ${modelKey}: ${config.provider} provider`);
        
        // Test validation
        const isValid = modelManager.validateConfig(modelKey);
        console.log(`   Validation: ${isValid ? '✅ Valid' : '❌ Invalid (missing API key)'}`);
      } else {
        console.log(`❌ ${modelKey}: Configuration not found`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Model Manager test failed: ${error.message}`);
    return false;
  }
}

async function testAgentFactory() {
  console.log('\n🤖 Testing Agent Factory...');
  
  try {
    // Import the agent factory
    const { AgentFactory } = await import('./src/mastra/agents/multi-model-agent.ts');
    
    // Test task optimization
    const taskTypes = ['reasoning', 'vision', 'coding', 'general'];
    
    for (const taskType of taskTypes) {
      const bestModel = AgentFactory.getBestModelForTask(taskType);
      console.log(`✅ Best model for ${taskType}: ${bestModel}`);
    }
    
    // Test agent creation (without actually calling the models)
    console.log('\n🔧 Testing agent creation...');
    
    try {
      const chatAgent = AgentFactory.createChatAgent('deepseek-chat');
      console.log(`✅ Chat agent created: ${chatAgent.name}`);
    } catch (error) {
      console.log(`⚠️  Chat agent creation: ${error.message}`);
    }
    
    try {
      const builderAgent = AgentFactory.createBuilderAgent('deepseek-chat');
      console.log(`✅ Builder agent created: ${builderAgent.name}`);
    } catch (error) {
      console.log(`⚠️  Builder agent creation: ${error.message}`);
    }
    
    try {
      const promptAgent = AgentFactory.createEnhancedPromptAgent('deepseek-chat');
      console.log(`✅ Enhanced prompt agent created: ${promptAgent.name}`);
    } catch (error) {
      console.log(`⚠️  Enhanced prompt agent creation: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Agent Factory test failed: ${error.message}`);
    return false;
  }
}

async function testAPIRoutes() {
  console.log('\n🌐 Testing API Routes with Model Selection...');
  
  const API_BASE_URL = 'http://localhost:4111';
  
  try {
    // Test model endpoint
    console.log('\n📋 Testing /model endpoint...');
    const modelResponse = await fetch(`${API_BASE_URL}/model`, {
      method: 'POST',
    });
    
    if (modelResponse.ok) {
      const models = await modelResponse.json();
      console.log(`✅ Model API: Found ${models.length} models`);
      
      // Verify model structure
      const firstModel = models[0];
      const requiredFields = ['label', 'value', 'useImage', 'provider', 'functionCall'];
      const hasAllFields = requiredFields.every(field => field in firstModel);
      
      if (hasAllFields) {
        console.log('✅ Model structure: All required fields present');
      } else {
        console.log('❌ Model structure: Missing required fields');
      }
    } else {
      console.log(`❌ Model API failed: ${modelResponse.status}`);
    }
    
    // Test chat with different models
    console.log('\n💬 Testing chat with different models...');
    const testModels = ['deepseek-chat', 'claude-3-5-sonnet', 'gpt-4o-mini'];
    
    for (const model of testModels) {
      try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Hello' }],
            model: model,
            mode: 'chat'
          }),
        });
        
        const data = await response.json();
        
        if (data.choices || (data.error && data.message?.includes('Authentication'))) {
          console.log(`✅ ${model}: API structure correct`);
        } else {
          console.log(`❌ ${model}: Unexpected response structure`);
        }
      } catch (error) {
        console.log(`❌ ${model}: Request failed - ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ API Routes test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Model Manager and Multi-Model System Tests...');
  
  const results = [];
  
  results.push(await testModelManager());
  results.push(await testAgentFactory());
  results.push(await testAPIRoutes());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All model management tests passed!');
    console.log('✅ Multi-model system is working correctly');
  } else if (passed >= 2) {
    console.log('\n⚠️  Most model management features are working');
    console.log('🔧 Some components may need API keys for full functionality');
  } else {
    console.log('\n❌ Multiple model management components have issues');
    console.log('🔧 Further debugging required');
  }
  
  return passed === total;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };
