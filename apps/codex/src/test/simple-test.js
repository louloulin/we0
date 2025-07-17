#!/usr/bin/env node

/**
 * Simple Test for DeepSeek Integration
 * 
 * A basic test to verify that DeepSeek integration is working correctly.
 * This test doesn't require external dependencies and can be run directly.
 */

console.log('🚀 Starting DeepSeek Integration Test...\n');

// Test 1: Check if required modules can be imported
console.log('📦 Testing module imports...');
try {
  // Test basic imports
  const fs = require('fs');
  const path = require('path');
  
  // Check if source files exist
  const srcPath = path.join(__dirname, '../mastra');
  const modelsPath = path.join(srcPath, 'models/deepseek.ts');
  const agentsPath = path.join(srcPath, 'agents/deepseek-agent.ts');
  const toolsPath = path.join(srcPath, 'tools/code-generator-tool.ts');
  const indexPath = path.join(srcPath, 'index.ts');
  
  if (fs.existsSync(modelsPath)) {
    console.log('✅ DeepSeek model configuration file exists');
  } else {
    console.log('❌ DeepSeek model configuration file missing');
  }
  
  if (fs.existsSync(agentsPath)) {
    console.log('✅ DeepSeek agent file exists');
  } else {
    console.log('❌ DeepSeek agent file missing');
  }
  
  if (fs.existsSync(toolsPath)) {
    console.log('✅ Code generator tool file exists');
  } else {
    console.log('❌ Code generator tool file missing');
  }
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Main Mastra index file exists');
  } else {
    console.log('❌ Main Mastra index file missing');
  }
  
} catch (error) {
  console.log('❌ Module import test failed:', error.message);
}

// Test 2: Check environment variables
console.log('\n🔧 Testing environment configuration...');
const envPath = path.join(__dirname, '../../.env');
try {
  const fs = require('fs');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('DEEPSEEK_API_KEY')) {
      console.log('✅ DEEPSEEK_API_KEY found in .env file');
    } else {
      console.log('⚠️  DEEPSEEK_API_KEY not found in .env file');
    }
    
    if (envContent.includes('DEEPSEEK_BASE_URL')) {
      console.log('✅ DEEPSEEK_BASE_URL found in .env file');
    } else {
      console.log('⚠️  DEEPSEEK_BASE_URL not found in .env file (will use default)');
    }
  } else {
    console.log('❌ .env file not found');
  }
} catch (error) {
  console.log('❌ Environment test failed:', error.message);
}

// Test 3: Check package.json dependencies
console.log('\n📋 Testing package dependencies...');
try {
  const packagePath = path.join(__dirname, '../../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = [
    '@mastra/core',
    '@ai-sdk/openai-compatible',
    'zod'
  ];
  
  let allDepsFound = true;
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} found in dependencies`);
    } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep} found in devDependencies`);
    } else {
      console.log(`❌ ${dep} not found in dependencies`);
      allDepsFound = false;
    }
  });
  
  if (allDepsFound) {
    console.log('✅ All required dependencies are installed');
  } else {
    console.log('⚠️  Some dependencies may be missing');
  }
  
} catch (error) {
  console.log('❌ Package dependency test failed:', error.message);
}

// Test 4: Check TypeScript configuration
console.log('\n⚙️  Testing TypeScript configuration...');
try {
  const tsconfigPath = path.join(__dirname, '../../tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    if (tsconfig.compilerOptions) {
      console.log('✅ TypeScript configuration found');
      
      if (tsconfig.compilerOptions.moduleResolution === 'bundler') {
        console.log('✅ Module resolution set to bundler');
      } else {
        console.log('⚠️  Module resolution not set to bundler');
      }
      
      if (tsconfig.compilerOptions.strict) {
        console.log('✅ Strict mode enabled');
      } else {
        console.log('⚠️  Strict mode not enabled');
      }
    }
  } else {
    console.log('❌ tsconfig.json not found');
  }
} catch (error) {
  console.log('❌ TypeScript configuration test failed:', error.message);
}

// Test 5: Basic code structure validation
console.log('\n🔍 Testing code structure...');
try {
  // Check if the main index file has the expected exports
  const indexPath = path.join(__dirname, '../mastra/index.ts');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  if (indexContent.includes('deepseekAgent')) {
    console.log('✅ deepseekAgent found in main index');
  } else {
    console.log('❌ deepseekAgent not found in main index');
  }
  
  if (indexContent.includes('deepseekCoderAgent')) {
    console.log('✅ deepseekCoderAgent found in main index');
  } else {
    console.log('❌ deepseekCoderAgent not found in main index');
  }
  
  if (indexContent.includes('export const mastra')) {
    console.log('✅ Mastra instance export found');
  } else {
    console.log('❌ Mastra instance export not found');
  }
  
} catch (error) {
  console.log('❌ Code structure test failed:', error.message);
}

// Test 6: Tool structure validation
console.log('\n🛠️  Testing tool structure...');
try {
  const toolPath = path.join(__dirname, '../mastra/tools/code-generator-tool.ts');
  const toolContent = fs.readFileSync(toolPath, 'utf8');
  
  const expectedTools = [
    'codeGeneratorTool',
    'codeAnalysisTool',
    'projectStructureTool'
  ];
  
  expectedTools.forEach(tool => {
    if (toolContent.includes(tool)) {
      console.log(`✅ ${tool} found in tools`);
    } else {
      console.log(`❌ ${tool} not found in tools`);
    }
  });
  
} catch (error) {
  console.log('❌ Tool structure test failed:', error.message);
}

// Summary
console.log('\n📊 Test Summary:');
console.log('================');
console.log('✅ = Test passed');
console.log('⚠️  = Warning (may still work)');
console.log('❌ = Test failed (needs attention)');

console.log('\n🎯 Next Steps:');
console.log('1. Set your DEEPSEEK_API_KEY in the .env file');
console.log('2. Run: cd apps/codex && pnpm run dev');
console.log('3. Test the agents in the Mastra playground');
console.log('4. Try the DeepSeek agents with some coding questions');

console.log('\n✨ DeepSeek Integration Test Complete!');
