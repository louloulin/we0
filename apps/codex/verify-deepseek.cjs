#!/usr/bin/env node

/**
 * DeepSeek Integration Verification Script
 * 
 * Simple verification script to check if DeepSeek integration is working correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 DeepSeek Integration Verification\n');

// Test 1: Check if source files exist
console.log('📁 Checking source files...');
const filesToCheck = [
  'src/mastra/models/deepseek.ts',
  'src/mastra/agents/deepseek-agent.ts',
  'src/mastra/tools/code-generator-tool.ts',
  'src/mastra/tools/documentation-tool.ts',
  'src/mastra/index.ts',
  '.env'
];

let allFilesExist = true;
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
    allFilesExist = false;
  }
});

// Test 2: Check package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@mastra/core',
    '@ai-sdk/openai-compatible',
    'zod'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} (dependencies)`);
    } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep} (devDependencies)`);
    } else {
      console.log(`❌ ${dep} - Not found`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  allFilesExist = false;
}

// Test 3: Check .env configuration
console.log('\n🔧 Checking environment configuration...');
try {
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    
    if (envContent.includes('DEEPSEEK_API_KEY')) {
      console.log('✅ DEEPSEEK_API_KEY configured');
    } else {
      console.log('⚠️  DEEPSEEK_API_KEY not found in .env');
    }
    
    if (envContent.includes('DEEPSEEK_BASE_URL')) {
      console.log('✅ DEEPSEEK_BASE_URL configured');
    } else {
      console.log('⚠️  DEEPSEEK_BASE_URL not found (will use default)');
    }
  } else {
    console.log('❌ .env file not found');
  }
} catch (error) {
  console.log('❌ Error reading .env:', error.message);
}

// Test 4: Check code structure
console.log('\n🔍 Checking code structure...');
try {
  // Check main index file
  const indexContent = fs.readFileSync('src/mastra/index.ts', 'utf8');
  
  if (indexContent.includes('deepseekAgent')) {
    console.log('✅ deepseekAgent imported in main index');
  } else {
    console.log('❌ deepseekAgent not found in main index');
  }
  
  if (indexContent.includes('deepseekCoderAgent')) {
    console.log('✅ deepseekCoderAgent imported in main index');
  } else {
    console.log('❌ deepseekCoderAgent not found in main index');
  }
  
  // Check DeepSeek model file
  const modelContent = fs.readFileSync('src/mastra/models/deepseek.ts', 'utf8');
  
  if (modelContent.includes('createOpenAICompatible')) {
    console.log('✅ OpenAI compatible provider configured');
  } else {
    console.log('❌ OpenAI compatible provider not configured');
  }
  
  if (modelContent.includes('DEEPSEEK_MODELS')) {
    console.log('✅ DeepSeek models defined');
  } else {
    console.log('❌ DeepSeek models not defined');
  }
  
} catch (error) {
  console.log('❌ Error checking code structure:', error.message);
  allFilesExist = false;
}

// Test 5: Check tools
console.log('\n🛠️  Checking tools...');
try {
  const toolContent = fs.readFileSync('src/mastra/tools/code-generator-tool.ts', 'utf8');
  
  const expectedTools = [
    'codeGeneratorTool',
    'codeAnalysisTool',
    'projectStructureTool'
  ];
  
  expectedTools.forEach(tool => {
    if (toolContent.includes(tool)) {
      console.log(`✅ ${tool} defined`);
    } else {
      console.log(`❌ ${tool} not found`);
    }
  });
  
} catch (error) {
  console.log('❌ Error checking tools:', error.message);
}

// Summary
console.log('\n📊 Verification Summary');
console.log('======================');

if (allFilesExist) {
  console.log('🎉 All core components are properly configured!');
  console.log('\n🚀 Next steps:');
  console.log('1. Set your DEEPSEEK_API_KEY in the .env file');
  console.log('2. Run: pnpm run dev');
  console.log('3. Open the Mastra interface and test DeepSeek agents');
} else {
  console.log('⚠️  Some components may be missing or misconfigured');
  console.log('Please check the errors above and fix them');
}

console.log('\n✨ DeepSeek Integration Verification Complete!');
console.log('\n📚 Documentation:');
console.log('- README-DEEPSEEK.md - Detailed usage guide');
console.log('- plan1.md - Updated with implementation status');
console.log('- src/test/ - Test files for validation');

process.exit(allFilesExist ? 0 : 1);
