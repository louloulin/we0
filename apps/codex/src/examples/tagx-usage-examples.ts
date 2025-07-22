/**
 * TagX智能编程助手使用示例
 * 
 * 展示如何使用我们实现的P0和P1优先级功能
 */

import { IntegratedTagXSystem } from '../mastra/tagx/integrated-system';
import { codexAgentNetwork } from '../mastra/networks/codex-agent-network';

/**
 * 示例1: 智能代码生成
 * 使用smart_code_gen标签生成高质量代码
 */
export async function example1_SmartCodeGeneration() {
  console.log('🚀 示例1: 智能代码生成');
  
  const tagxSystem = new IntegratedTagXSystem();
  
  const smartCodeGenXml = `
    <smart_code_gen>
      <task>创建一个React用户认证组件，支持登录、注册和密码重置功能</task>
      <context>
        <project_type>react-typescript</project_type>
        <existing_files>
          <file>src/types/user.ts</file>
          <file>src/utils/api.ts</file>
          <file>src/hooks/useAuth.ts</file>
        </existing_files>
        <requirements>
          <security>high</security>
          <accessibility>wcag-aa</accessibility>
          <testing>comprehensive</testing>
        </requirements>
      </context>
      <agents>
        <primary>senior-developer</primary>
        <reviewers>
          <agent>security-auditor</agent>
          <agent>code-reviewer</agent>
        </reviewers>
      </agents>
      <output>
        <include_tests>true</include_tests>
        <include_docs>true</include_docs>
        <include_types>true</include_types>
      </output>
    </smart_code_gen>
  `;

  try {
    const context = {
      projectPath: '/example/react-app',
      sessionId: 'example-session-1',
      userId: 'demo-user',
      preferences: {
        defaultLanguage: 'typescript',
        codeStyle: 'airbnb',
        testFramework: 'jest',
        deploymentPlatform: 'vercel',
        qualityLevel: 'strict' as const
      },
      history: []
    };

    const results = await tagxSystem.process(smartCodeGenXml, context);
    
    console.log('✅ 智能代码生成完成:');
    console.log(`- 处理了 ${results.length} 个指令`);
    console.log(`- 成功率: ${results.filter(r => r.success).length}/${results.length}`);
    
    results.forEach((result, index) => {
      console.log(`\n指令 ${index + 1}:`);
      console.log(`- 标签: ${result.tagName}`);
      console.log(`- 成功: ${result.success}`);
      console.log(`- 耗时: ${result.duration}ms`);
      if (result.quality_score) {
        console.log(`- 质量分数: ${(result.quality_score * 100).toFixed(1)}%`);
      }
      if (result.next_steps) {
        console.log(`- 下一步建议: ${result.next_steps.join(', ')}`);
      }
    });

  } catch (error) {
    console.error('❌ 智能代码生成失败:', error);
  }
}

/**
 * 示例2: 增强boltArtifact项目生成
 * 使用bolt_artifact标签生成完整项目
 */
export async function example2_EnhancedBoltArtifact() {
  console.log('\n🎨 示例2: 增强boltArtifact项目生成');
  
  const tagxSystem = new IntegratedTagXSystem();
  
  const boltArtifactXml = `
    <bolt_artifact id="modern-todo-app" title="现代化待办事项应用">
      <meta>
        <version>2.0</version>
        <agent>project-architect</agent>
        <quality_score>0.95</quality_score>
      </meta>
      <environment>
        <type>webcontainer</type>
        <constraints>
          <no_native_binaries>true</no_native_binaries>
          <prefer_vite>true</prefer_vite>
        </constraints>
      </environment>
      <actions>
        <bolt_action type="file" path="package.json" priority="1">
          <content>{
            "name": "modern-todo-app",
            "version": "1.0.0",
            "type": "module",
            "scripts": {
              "dev": "vite",
              "build": "vite build",
              "test": "vitest"
            },
            "dependencies": {
              "react": "^18.2.0",
              "react-dom": "^18.2.0",
              "zustand": "^4.4.7",
              "framer-motion": "^10.16.16"
            },
            "devDependencies": {
              "@types/react": "^18.2.45",
              "@vitejs/plugin-react": "^4.2.1",
              "vite": "^5.0.10",
              "vitest": "^1.0.4"
            }
          }</content>
          <validation>
            <syntax_check>true</syntax_check>
            <dependency_check>true</dependency_check>
          </validation>
        </bolt_action>
        <bolt_action type="file" path="src/App.tsx" priority="2">
          <content>import React from 'react';
import { TodoApp } from './components/TodoApp';
import './App.css';

function App() {
  return (
    &lt;div className="App"&gt;
      &lt;TodoApp /&gt;
    &lt;/div&gt;
  );
}

export default App;</content>
        </bolt_action>
        <bolt_action type="shell" priority="3">
          <command>npm install</command>
          <retry_on_failure>true</retry_on_failure>
          <timeout>60000</timeout>
        </bolt_action>
        <bolt_action type="start" priority="4">
          <command>npm run dev</command>
          <health_check>
            <url>http://localhost:5173</url>
            <timeout>30000</timeout>
          </health_check>
        </bolt_action>
      </actions>
    </bolt_artifact>
  `;

  try {
    const context = {
      projectPath: '/example/todo-app',
      sessionId: 'example-session-2',
      userId: 'demo-user',
      preferences: {
        defaultLanguage: 'typescript',
        codeStyle: 'prettier',
        testFramework: 'vitest',
        deploymentPlatform: 'netlify',
        qualityLevel: 'standard' as const
      },
      history: []
    };

    const results = await tagxSystem.process(boltArtifactXml, context);
    
    console.log('✅ 项目生成完成:');
    results.forEach(result => {
      if (result.success && result.output) {
        console.log(`- 项目ID: ${result.output.artifact_id}`);
        console.log(`- 执行的操作: ${result.output.executed_actions?.length || 0} 个`);
        console.log(`- 质量分数: ${((result.quality_score || 0) * 100).toFixed(1)}%`);
      }
    });

  } catch (error) {
    console.error('❌ 项目生成失败:', error);
  }
}

/**
 * 示例3: 多智能体工作流
 * 使用agent_workflow标签实现复杂的多智能体协作
 */
export async function example3_MultiAgentWorkflow() {
  console.log('\n🧠 示例3: 多智能体工作流');
  
  const tagxSystem = new IntegratedTagXSystem();
  
  const workflowXml = `
    <agent_workflow>
      <task>开发一个完整的电商产品页面，包括设计、开发、测试和部署</task>
      <workflow>
        <stage name="需求分析" agent="product-manager" duration="30min">
          <input>电商产品页面需求：展示产品信息、价格、评价、购买功能</input>
          <output>详细的产品需求文档和用户故事</output>
        </stage>
        <stage name="架构设计" agent="project-architect" depends_on="需求分析" duration="45min">
          <input>产品需求文档</input>
          <output>技术架构设计和组件规划</output>
        </stage>
        <stage name="并行开发" agent="senior-developer" depends_on="架构设计" duration="2h">
          <input>架构设计文档</input>
          <output>完整的前端代码实现</output>
          <parallel>
            <subtask agent="frontend-developer">UI组件开发</subtask>
            <subtask agent="backend-developer">API接口开发</subtask>
            <subtask agent="ux-designer">交互设计优化</subtask>
          </parallel>
        </stage>
        <stage name="代码审查" agent="code-reviewer" depends_on="并行开发" duration="30min">
          <input>完整的代码实现</input>
          <output>代码审查报告和改进建议</output>
        </stage>
        <stage name="质量测试" agent="qa-engineer" depends_on="代码审查" duration="1h">
          <input>审查后的代码</input>
          <output>测试报告和质量评估</output>
        </stage>
      </workflow>
      <quality_gates>
        <gate stage="架构设计">
          <criteria>设计文档完整性 > 90%</criteria>
          <criteria>技术可行性评分 > 8.0</criteria>
        </gate>
        <gate stage="代码审查">
          <criteria>代码质量分数 > 0.8</criteria>
          <criteria>安全漏洞数量 = 0</criteria>
        </gate>
        <gate stage="质量测试">
          <criteria>测试覆盖率 > 85%</criteria>
          <criteria>性能评分 > 90</criteria>
        </gate>
      </quality_gates>
    </agent_workflow>
  `;

  try {
    const context = {
      projectPath: '/example/ecommerce-page',
      sessionId: 'example-session-3',
      userId: 'demo-user',
      preferences: {
        defaultLanguage: 'typescript',
        codeStyle: 'standard',
        testFramework: 'cypress',
        deploymentPlatform: 'vercel',
        qualityLevel: 'enterprise' as const
      },
      history: []
    };

    const results = await tagxSystem.process(workflowXml, context);
    
    console.log('✅ 多智能体工作流完成:');
    results.forEach(result => {
      if (result.success && result.output) {
        console.log(`- 工作流任务: ${result.output.task}`);
        console.log(`- 完成阶段: ${result.output.workflow_results?.length || 0} 个`);
        console.log(`- 质量门禁通过: ${result.output.quality_gates_passed || 0} 个`);
        console.log(`- 最终输出: ${result.output.final_output ? '已生成' : '未完成'}`);
      }
    });

  } catch (error) {
    console.error('❌ 多智能体工作流失败:', error);
  }
}

/**
 * 示例4: 质量检查
 * 使用quality_check标签进行全面的代码质量分析
 */
export async function example4_QualityCheck() {
  console.log('\n🔍 示例4: 质量检查');
  
  const tagxSystem = new IntegratedTagXSystem();
  
  const qualityCheckXml = `
    <quality_check agent="quality-assurance">
      <scope>
        <files pattern="src/**/*.{ts,tsx,js,jsx}" exclude="**/*.test.*" />
      </scope>
      <checks>
        <static_analysis>
          <tool>eslint</tool>
          <tool>typescript</tool>
          <custom_rules>@typescript-eslint/recommended</custom_rules>
        </static_analysis>
        <security>
          <tool>semgrep</tool>
          <tool>snyk</tool>
          <custom_rules>security/recommended</custom_rules>
        </security>
        <performance>
          <bundle_analysis>true</bundle_analysis>
          <memory_leaks>true</memory_leaks>
          <async_patterns>true</async_patterns>
        </performance>
        <accessibility>
          <tool>axe-core</tool>
          <standard>wcag-aa</standard>
        </accessibility>
      </checks>
      <thresholds>
        <code_coverage>85%</code_coverage>
        <security_score>8.5</security_score>
        <performance_score>90</performance_score>
        <maintainability_index>75</maintainability_index>
      </thresholds>
    </quality_check>
  `;

  try {
    const context = {
      projectPath: '/example/quality-check-project',
      sessionId: 'example-session-4',
      userId: 'demo-user',
      preferences: {
        defaultLanguage: 'typescript',
        codeStyle: 'strict',
        testFramework: 'jest',
        deploymentPlatform: 'aws',
        qualityLevel: 'enterprise' as const
      },
      history: []
    };

    const results = await tagxSystem.process(qualityCheckXml, context);
    
    console.log('✅ 质量检查完成:');
    results.forEach(result => {
      if (result.output && result.output.report) {
        const report = result.output.report;
        console.log(`- 整体质量分数: ${(report.overall_score * 100).toFixed(1)}%`);
        console.log(`- 发现问题: ${report.issues?.length || 0} 个`);
        console.log(`- 改进建议: ${report.recommendations?.length || 0} 条`);
        console.log(`- 代码覆盖率: ${report.metrics?.code_coverage || 'N/A'}`);
        console.log(`- 安全评分: ${report.metrics?.security_score || 'N/A'}`);
      }
    });

  } catch (error) {
    console.error('❌ 质量检查失败:', error);
  }
}

/**
 * 示例5: 使用Codex Agent Network
 * 通过Agent Network调用TagX功能
 */
export async function example5_AgentNetworkIntegration() {
  console.log('\n🌐 示例5: Agent Network集成');
  
  try {
    const taskDescription = `
      请使用TagX系统创建一个现代化的React组件库项目：
      
      要求：
      1. 使用TypeScript和现代化工具链
      2. 包含完整的组件文档和示例
      3. 支持主题定制和响应式设计
      4. 包含完整的测试套件
      5. 配置自动化CI/CD流程
      
      请使用bolt_artifact标签生成完整项目，并使用quality_check确保代码质量。
    `;

    const result = await codexAgentNetwork.generate(taskDescription);
    
    console.log('✅ Agent Network执行完成:');
    console.log('- 结果:', result.result.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Agent Network执行失败:', error);
  }
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('🎯 TagX智能编程助手示例演示\n');
  console.log('=' .repeat(50));
  
  try {
    await example1_SmartCodeGeneration();
    await example2_EnhancedBoltArtifact();
    await example3_MultiAgentWorkflow();
    await example4_QualityCheck();
    await example5_AgentNetworkIntegration();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 所有示例执行完成！');
    
  } catch (error) {
    console.error('❌ 示例执行过程中出现错误:', error);
  }
}

// 如果直接运行此文件，执行所有示例
if (require.main === module) {
  runAllExamples().catch(console.error);
}
