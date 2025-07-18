/**
 * 智能编程 API - 基于多智能体协作的代码生成接口
 * 
 * 这个新的 API 处理器集成了我们创建的智能编程 Agent Network，
 * 提供类似 Cursor/Augment Code 的智能编程体验。
 * 
 * 核心特性：
 * - 智能任务路由：根据任务复杂度自动选择最适合的处理方式
 * - 多智能体协作：5个专业角色分工协作
 * - 原生流式响应：直接使用 Mastra vNext 的流式能力
 * - 完整的文件上下文处理：保留现有的成功经验
 * - 强化的 boltArtifact 输出：确保代码生成质量
 */

import { RuntimeContext } from '@mastra/core/runtime-context';
import { intelligentCodingAgentNetwork } from '../networks/intelligent-coding-network';
import { IntelligentTaskRouter } from '../utils/task-router';
import { QualityAssuranceSystem } from '../quality/quality-assurance-system';

/**
 * 智能编程模式处理器 V4
 * 
 * 这是对现有 handleBuilderMode 的重构版本，集成了智能 Agent Network
 * 
 * @param messages 用户消息历史
 * @param model 指定的模型（将被智能路由覆盖）
 * @param userId 用户ID
 * @param otherConfig 其他配置选项
 * @param tools 工具配置
 * @param isStreaming 是否使用流式响应
 * @param c Hono 上下文对象
 */
export async function handleIntelligentCodingMode(
  messages: any[],
  model: string,
  userId: string | null,
  otherConfig: any,
  tools: any,
  isStreaming: boolean,
  c: any
) {
  try {
    // 1. 保留现有的文件处理逻辑（这部分已经很成熟）
    const { processFiles, determineProjectType, estimateTokens } =
      await import('../utils/file-processor');
    
    const { files, allContent } = processFiles(messages);
    const projectType = determineProjectType(files);
    const filesPath = Object.keys(files);
    
    // 2. 构建用户任务描述
    const lastMessage = messages[messages.length - 1];
    const userInput = lastMessage?.content || '';
    
    // 3. 使用智能任务路由器分析任务
    // 转换文件格式以匹配 FileContext 接口
    const fileContext = Object.fromEntries(
      Object.entries(files).map(([path, content]) => [
        path,
        {
          content: typeof content === 'string' ? content : JSON.stringify(content),
          size: typeof content === 'string' ? content.length : JSON.stringify(content).length,
          type: path.split('.').pop() || 'unknown'
        }
      ])
    );
    const taskAnalysis = IntelligentTaskRouter.analyzeTask(userInput, fileContext);
    
    console.log('🧠 智能任务分析结果:', {
      taskType: taskAnalysis.taskType,
      complexity: taskAnalysis.complexity,
      projectType: taskAnalysis.projectType,
      recommendedAgent: taskAnalysis.recommendedAgent,
      requiresFullWorkflow: taskAnalysis.requiresFullWorkflow,
      confidence: taskAnalysis.confidence,
      reasoning: taskAnalysis.reasoning
    });
    
    // 4. 构建完整的任务上下文
    let taskDescription = userInput;
    
    // 添加文件上下文信息
    if (filesPath.length > 0) {
      let fileContextPrompt = '';
      let nowFiles = files;
      
      if (estimateTokens(allContent) > 128000) {
        // 处理大文件内容
        const { filterFiles } = await import('../utils/file-processor');
        nowFiles = filterFiles(files, { codeOnly: true });
        fileContextPrompt = `当前文件目录结构: ${filesPath.join("\n")}\n\n当前项目文件内容:\n${JSON.stringify(nowFiles)}`;
      } else {
        fileContextPrompt = `当前文件目录结构: ${filesPath.join("\n")}\n\n当前项目文件内容:\n${JSON.stringify(nowFiles)}`;
      }
      
      taskDescription += `\n\n项目上下文信息:\n${fileContextPrompt}`;
    }
    
    // 添加项目类型和配置信息
    if (otherConfig) {
      taskDescription += `\n\n项目配置: ${JSON.stringify(otherConfig)}`;
    }
    
    // 5. 创建 RuntimeContext，传递重要的上下文信息
    const runtimeContext = new RuntimeContext();
    runtimeContext.set('userId', userId || 'anonymous');
    runtimeContext.set('sessionId', `intelligent_coding_${Date.now()}`);
    runtimeContext.set('projectType', projectType);
    runtimeContext.set('taskAnalysis', taskAnalysis);
    runtimeContext.set('fileCount', filesPath.length);
    runtimeContext.set('hasExistingFiles', filesPath.length > 0);
    runtimeContext.set('originalModel', model);
    runtimeContext.set('otherConfig', otherConfig);
    
    // 6. 添加强化的 boltArtifact 指令
    const enhancedTaskDescription = `${taskDescription}

🎯 重要输出要求：
当生成代码文件时，必须使用 boltArtifact XML 格式：

<boltArtifact id="unique-id" title="项目标题">
  <boltAction type="file" filePath="src/App.tsx">
    // 完整的文件内容 - 绝不使用占位符
    import React from 'react';
    
    const App: React.FC = () => {
      return <div>Hello World</div>;
    };
    
    export default App;
  </boltAction>
</boltArtifact>

📋 质量标准：
- 生成完整可运行的代码，无占位符或 TODO
- 使用 TypeScript 确保类型安全
- 遵循最佳实践和编码规范
- 实现适当的错误处理
- 添加必要的注释和文档
- 确保代码的可维护性和性能

🚀 我的具体需求是：${userInput}`;
    
    // 7. 使用智能编程 Agent Network 处理任务
    if (isStreaming) {
      console.log('🔄 启动流式智能编程处理...');

      // 使用 Mastra vNext 的原生流式响应
      const streamResult = await intelligentCodingAgentNetwork.stream(enhancedTaskDescription, {
        runtimeContext,
      });

      console.log('📡 Mastra vNext Agent Network 流式响应结构:', {
        hasStream: !!streamResult?.stream,
        hasGetWorkflowState: !!streamResult?.getWorkflowState,
        streamKeys: streamResult ? Object.keys(streamResult) : [],
        streamType: typeof streamResult,
        streamConstructor: streamResult?.stream?.constructor?.name
      });

      // 对于流式响应，我们需要在流结束后进行质量检查
      // 这里先返回原始流，质量检查将在客户端处理
      const { convertMastraStreamToAISDK } = await import('../api-routes');
      return convertMastraStreamToAISDK(streamResult);
    } else {
      console.log('⚡ 启动非流式智能编程处理...');

      // 非流式执行
      const result = await intelligentCodingAgentNetwork.generate(enhancedTaskDescription, {
        runtimeContext,
      });

      // 8. 🔍 质量保证检查
      console.log('🔍 开始质量保证检查...');
      const qualityResult = await QualityAssuranceSystem.ensureQuality(
        result.result,
        runtimeContext,
        {
          enableValidation: true,
          enableCompletenessCheck: true,
          enableErrorRecovery: true,
          enableAutoFix: true,
          strictMode: false
        }
      );

      console.log(`✅ 质量检查完成: ${qualityResult.overallQuality} (${qualityResult.qualityScore}/100)`);

      // 使用质量保证后的内容
      const finalContent = qualityResult.finalContent;

      return c.json({
        choices: [{
          message: {
            role: 'assistant',
            content: finalContent,
          },
        }],
        metadata: {
          taskAnalysis,
          qualityAssurance: {
            overallQuality: qualityResult.overallQuality,
            qualityScore: qualityResult.qualityScore,
            processingTime: qualityResult.processingTime,
            autoFixesApplied: qualityResult.metadata.autoFixesApplied,
            recommendations: qualityResult.recommendations.length
          },
          executionTime: Date.now() - Date.now(),
          agentNetwork: 'intelligent-coding-network',
          version: 'v4'
        }
      });
    }
    
  } catch (error) {
    console.error('❌ 智能编程处理错误:', error);
    
    // 错误处理：回退到原有的 Builder Agent
    console.log('🔄 回退到原有 Builder Agent...');
    
    try {
      // 回退到原有的 Builder Agent
      const { AgentFactory } = await import('../agents/multi-model-agent');
      const builderAgent = AgentFactory.createBuilderAgent(model);

      const mastraMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

      if (isStreaming) {
        const stream = await builderAgent.stream(mastraMessages);
        const { convertMastraStreamToAISDK } = await import('../api-routes');
        return convertMastraStreamToAISDK(stream);
      } else {
        const result = await builderAgent.generate(mastraMessages);
        return c.json({
          choices: [{
            message: {
              role: 'assistant',
              content: result.text,
            },
          }],
        });
      }
    } catch (fallbackError) {
      console.error('❌ 回退处理也失败:', fallbackError);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      return c.json({
        error: '智能编程处理失败',
        details: errorMessage,
        fallbackAttempted: true
      }, 500);
    }
  }
}

/**
 * 智能编程模式处理器（简化版）
 * 
 * 用于简单任务的快速处理，直接使用 Senior Developer Agent
 */
export async function handleSimpleCodingTask(
  userInput: string,
  fileContext?: any,
  userId?: string | null
): Promise<string> {
  try {
    // 分析任务
    const taskAnalysis = IntelligentTaskRouter.analyzeTask(userInput, fileContext);
    
    // 如果是复杂任务，建议使用完整的智能编程模式
    if (taskAnalysis.requiresFullWorkflow) {
      throw new Error('此任务需要使用完整的智能编程模式处理');
    }
    
    // 创建 RuntimeContext
    const runtimeContext = new RuntimeContext();
    runtimeContext.set('userId', userId || 'anonymous');
    runtimeContext.set('sessionId', `simple_coding_${Date.now()}`);
    runtimeContext.set('taskAnalysis', taskAnalysis);
    
    // 构建任务描述
    const taskDescription = `${userInput}

请使用 boltArtifact XML 格式生成代码：
<boltArtifact id="simple-task" title="简单编程任务">
  <boltAction type="file" filePath="文件路径">
    // 完整代码内容
  </boltAction>
</boltArtifact>`;
    
    // 使用 Agent Network 处理
    const result = await intelligentCodingAgentNetwork.generate(taskDescription, {
      runtimeContext,
    });
    
    return result.result;
    
  } catch (error) {
    console.error('简单编程任务处理失败:', error);
    throw error;
  }
}

/**
 * 获取智能编程能力状态
 */
export function getIntelligentCodingStatus() {
  return {
    available: true,
    agentNetwork: 'intelligent-coding-network',
    agents: {
      requirementsAnalyst: '需求分析师',
      systemArchitect: '系统架构师', 
      seniorDeveloper: '高级开发工程师',
      codeReviewer: '代码审查员',
      documentationSpecialist: '文档专家'
    },
    features: {
      intelligentRouting: '智能任务路由',
      multiAgentCollaboration: '多智能体协作',
      nativeStreaming: '原生流式响应',
      contextAware: '上下文感知',
      qualityAssurance: '质量保证体系'
    },
    version: 'v4.0.0'
  };
}
