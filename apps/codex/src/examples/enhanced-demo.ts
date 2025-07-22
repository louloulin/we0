/**
 * 增强功能演示应用
 * 
 * 展示所有新增的核心功能：
 * 1. 流式调度引擎演示
 * 2. 思维模型系统演示
 * 3. 二元反馈机制演示
 * 4. 智能并发控制演示
 * 5. 完整集成演示
 */

import { 
  executeEnhancedStreaming,
  executeEnhancedTool,
  quickExecute,
  getNetworkStatus,
  ThinkingLevel,
  TaskPriority,
  binaryFeedbackManager
} from '../networks/enhanced-codex-network';

/**
 * 演示 1: 流式调度引擎
 */
async function demonstrateStreamingScheduler() {
  console.log('\n🚀 === 流式调度引擎演示 ===');
  
  const prompt = '请分析 React 和 Vue 的区别，并给出选择建议';
  
  console.log(`📝 用户输入: ${prompt}`);
  console.log('⏱️ 开始流式处理...\n');
  
  for await (const response of executeEnhancedStreaming(prompt, {
    maxSteps: 10
  })) {
    switch (response.type) {
      case 'progress':
        console.log(`🔄 [进度] ${response.content}`);
        break;
      case 'text-delta':
        process.stdout.write(response.content || '');
        break;
      case 'final-result':
        console.log(`\n\n✅ [完成] 响应生成完毕`);
        if (response.metadata) {
          console.log(`📊 统计: 执行时间 ${response.metadata.executionTime}ms, 质量分数 ${response.metadata.qualityScore?.toFixed(2)}`);
        }
        break;
      case 'error':
        console.error(`❌ [错误] ${response.error}`);
        break;
    }
  }
}

/**
 * 演示 2: 思维模型系统
 */
async function demonstrateThinkingSystem() {
  console.log('\n\n🧠 === 思维模型系统演示 ===');
  
  const prompts = [
    { text: '简单计算 2+2', level: ThinkingLevel.NONE },
    { text: 'think 分析一下微服务架构的优缺点', level: ThinkingLevel.BASIC },
    { text: 'think hard 设计一个高并发的分布式系统', level: ThinkingLevel.DEEP },
    { text: 'ultrathink 如何构建一个可扩展的 AI 平台', level: ThinkingLevel.ULTRA }
  ];
  
  for (const { text, level } of prompts) {
    console.log(`\n📝 测试提示: ${text}`);
    console.log(`🧠 思维级别: ${level}`);
    
    const responses: string[] = [];
    let thinkingContent = '';
    
    for await (const response of executeEnhancedStreaming(text, {
      thinkingLevel: level,
      maxSteps: 5
    })) {
      if (response.type === 'thinking-delta' && response.thinking) {
        thinkingContent += response.thinking;
      } else if (response.type === 'text-delta' && response.content) {
        responses.push(response.content);
      } else if (response.type === 'final-result') {
        break;
      }
    }
    
    if (thinkingContent) {
      console.log(`💭 思维过程: ${thinkingContent.slice(0, 100)}...`);
    }
    console.log(`📄 响应长度: ${responses.join('').length} 字符`);
  }
}

/**
 * 演示 3: 二元反馈机制
 */
async function demonstrateBinaryFeedback() {
  console.log('\n\n⚖️ === 二元反馈机制演示 ===');
  
  const prompt = '请推荐一个适合初学者的编程语言';
  
  console.log(`📝 测试提示: ${prompt}`);
  console.log('🔄 启用二元反馈，生成两个响应进行比较...\n');
  
  for await (const response of executeEnhancedStreaming(prompt, {
    enableBinaryFeedback: true,
    maxSteps: 5
  })) {
    if (response.type === 'binary-feedback-request' && response.metadata) {
      console.log('📊 二元反馈结果:');
      console.log(`🅰️ 响应 A: ${response.metadata.responseA?.slice(0, 100)}...`);
      console.log(`🅱️ 响应 B: ${response.metadata.responseB?.slice(0, 100)}...`);
      console.log(`🏆 获胜者: ${response.metadata.winner} (置信度: ${(response.metadata.confidence * 100).toFixed(1)}%)`);
    } else if (response.type === 'final-result') {
      console.log(`\n✅ 最终选择的响应: ${response.content?.slice(0, 200)}...`);
      break;
    }
  }
  
  // 显示学习数据
  const learningData = binaryFeedbackManager.getLearningData();
  console.log('\n📈 学习数据统计:');
  console.log(`总比较次数: ${learningData.totalComparisons}`);
  console.log(`平均质量 A: ${learningData.qualityTrends.averageQualityA.toFixed(3)}`);
  console.log(`平均质量 B: ${learningData.qualityTrends.averageQualityB.toFixed(3)}`);
}

/**
 * 演示 4: 智能并发控制
 */
async function demonstrateConcurrencyControl() {
  console.log('\n\n🔧 === 智能并发控制演示 ===');
  
  const tasks = [
    { name: '代码生成', priority: TaskPriority.HIGH },
    { name: '文档搜索', priority: TaskPriority.NORMAL },
    { name: '代码分析', priority: TaskPriority.HIGH },
    { name: '测试生成', priority: TaskPriority.LOW },
    { name: '重构建议', priority: TaskPriority.NORMAL },
  ];
  
  console.log('🚀 提交多个并发任务...');
  
  const startTime = Date.now();
  const promises = tasks.map(async (task, index) => {
    try {
      const result = await executeEnhancedTool(
        'codeGeneratorTool', // 假设这个工具存在
        { prompt: `执行任务: ${task.name}` },
        {
          priority: task.priority,
          enableConcurrencyControl: true,
          sessionId: `demo-session-${index}`
        }
      );
      
      return {
        task: task.name,
        success: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        task: task.name,
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  });
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  console.log('\n📊 并发执行结果:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.task}: ${result.success ? `${result.duration}ms` : result.error}`);
  });
  
  console.log(`⏱️ 总执行时间: ${totalTime}ms`);
  
  // 显示并发统计
  const networkStatus = getNetworkStatus();
  console.log('\n📈 并发控制统计:');
  console.log(`活跃任务: ${networkStatus.concurrency.active}`);
  console.log(`队列任务: ${networkStatus.concurrency.queued}`);
  console.log(`总执行: ${networkStatus.concurrency.total}`);
  console.log(`成功率: ${((networkStatus.concurrency.success / networkStatus.concurrency.total) * 100).toFixed(1)}%`);
}

/**
 * 演示 5: 完整集成演示
 */
async function demonstrateFullIntegration() {
  console.log('\n\n🌟 === 完整集成演示 ===');
  
  const complexPrompt = `
    think hard 请帮我设计一个现代化的 Web 应用架构，要求：
    1. 支持高并发访问
    2. 具备良好的可扩展性
    3. 包含完整的 CI/CD 流程
    4. 考虑安全性和性能优化
    
    请提供详细的技术选型和实施建议。
  `;
  
  console.log('📝 复杂任务提示:');
  console.log(complexPrompt.trim());
  console.log('\n🚀 启动完整增强处理...\n');
  
  let responseContent = '';
  let thinkingContent = '';
  let toolCalls = 0;
  
  for await (const response of executeEnhancedStreaming(complexPrompt, {
    thinkingLevel: ThinkingLevel.DEEP,
    enableBinaryFeedback: false, // 为了演示速度，关闭二元反馈
    enableConcurrencyControl: true,
    priority: TaskPriority.HIGH,
    maxSteps: 15
  })) {
    
    switch (response.type) {
      case 'progress':
        console.log(`🔄 ${response.content}`);
        break;
        
      case 'thinking-delta':
        if (response.thinking) {
          thinkingContent += response.thinking;
          process.stdout.write('🧠');
        }
        break;
        
      case 'text-delta':
        if (response.content) {
          responseContent += response.content;
          process.stdout.write('📝');
        }
        break;
        
      case 'tool-call':
        toolCalls++;
        console.log(`\n🔧 调用工具: ${response.toolName}`);
        break;
        
      case 'tool-result':
        console.log(`✅ 工具执行完成`);
        break;
        
      case 'final-result':
        console.log('\n\n🎉 完整处理完成!');
        console.log('\n📊 执行统计:');
        console.log(`💭 思维内容长度: ${thinkingContent.length} 字符`);
        console.log(`📄 响应内容长度: ${responseContent.length} 字符`);
        console.log(`🔧 工具调用次数: ${toolCalls}`);
        
        if (response.metadata) {
          console.log(`⏱️ 总执行时间: ${response.metadata.executionTime}ms`);
          console.log(`🏆 质量分数: ${response.metadata.qualityScore?.toFixed(2)}`);
          console.log(`🧮 Token 使用: ${response.metadata.tokensUsed}`);
        }
        
        // 显示部分思维过程
        if (thinkingContent.length > 0) {
          console.log('\n💭 思维过程片段:');
          console.log(thinkingContent.slice(0, 300) + '...');
        }
        
        // 显示部分响应内容
        console.log('\n📄 响应内容片段:');
        console.log(responseContent.slice(0, 500) + '...');
        
        return;
        
      case 'error':
        console.error(`\n❌ 错误: ${response.error}`);
        return;
    }
  }
}

/**
 * 性能基准测试
 */
async function runPerformanceBenchmark() {
  console.log('\n\n⚡ === 性能基准测试 ===');
  
  const testCases = [
    { name: '简单问答', prompt: '什么是 JavaScript？', expectedTime: 2000 },
    { name: '代码生成', prompt: '生成一个 React 组件', expectedTime: 5000 },
    { name: '架构分析', prompt: 'think 分析微服务架构', expectedTime: 8000 },
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 测试: ${testCase.name}`);
    
    const startTime = Date.now();
    let firstResponseTime = 0;
    
    for await (const response of executeEnhancedStreaming(testCase.prompt, {
      maxSteps: 5
    })) {
      if (firstResponseTime === 0 && (response.type === 'text-delta' || response.type === 'progress')) {
        firstResponseTime = Date.now() - startTime;
      }
      
      if (response.type === 'final-result') {
        break;
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    console.log(`⚡ 首次响应: ${firstResponseTime}ms`);
    console.log(`⏱️ 总时间: ${totalTime}ms`);
    console.log(`🎯 目标时间: ${testCase.expectedTime}ms`);
    console.log(`📊 性能: ${totalTime <= testCase.expectedTime ? '✅ 达标' : '❌ 超时'}`);
  }
}

/**
 * 主演示函数
 */
async function runFullDemo() {
  console.log('🎭 === 增强功能完整演示开始 ===');
  
  try {
    await demonstrateStreamingScheduler();
    await demonstrateThinkingSystem();
    await demonstrateBinaryFeedback();
    await demonstrateConcurrencyControl();
    await demonstrateFullIntegration();
    await runPerformanceBenchmark();
    
    console.log('\n\n🎉 === 演示完成 ===');
    console.log('所有增强功能已成功演示！');
    
    // 最终状态报告
    const finalStatus = getNetworkStatus();
    console.log('\n📊 最终系统状态:');
    console.log(JSON.stringify(finalStatus, null, 2));
    
  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error);
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  runFullDemo().catch(console.error);
}

// 导出演示函数供其他模块使用
export {
  demonstrateStreamingScheduler,
  demonstrateThinkingSystem,
  demonstrateBinaryFeedback,
  demonstrateConcurrencyControl,
  demonstrateFullIntegration,
  runPerformanceBenchmark,
  runFullDemo
};
