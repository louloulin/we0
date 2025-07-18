# TagX - 下一代智能编程助手指令体系

## 概述

TagX是基于对Claude Code、Augment Code、Cursor、MastraCode等主流编程助手深度分析后，设计的下一代智能编程助手指令体系。保持XML格式的可读性和结构化优势，同时融合多系统的最佳实践。

## 设计原则

### 1. 保持XML格式优势
- **结构化清晰**: XML标签提供明确的语义边界
- **人类可读**: 开发者可以直观理解指令含义
- **扩展性强**: 易于添加新属性和嵌套结构
- **调试友好**: 错误定位和修复更容易

### 2. 融合多系统优势
- **MastraCode**: 完整的工具调用框架和错误处理
- **we-dev-next**: boltArtifact项目生成和多模型支持
- **Claude Code**: 智能代码分析和重构能力
- **Cursor**: 实时代码补全和上下文感知
- **Augment Code**: 企业级代码质量保证

### 3. 智能化增强
- **上下文感知**: 基于项目状态智能选择工具
- **多智能体协作**: 支持专业化智能体分工
- **质量保证**: 内置代码质量检查和最佳实践
- **学习优化**: 基于使用反馈持续改进

## 核心标签体系

### 1. 项目级操作标签

#### 1.1 项目分析标签 (`analyze_project`)
```xml
<analyze_project>
<scope>full</scope>  <!-- full | partial | specific -->
<focus>
  <architecture>true</architecture>
  <dependencies>true</dependencies>
  <quality>true</quality>
  <security>true</security>
  <performance>true</performance>
</focus>
<output_format>structured</output_format>  <!-- structured | summary | detailed -->
</analyze_project>
```

#### 1.2 项目生成标签 (`generate_project`)
```xml
<generate_project>
<template>react-typescript</template>
<name>my-awesome-app</name>
<features>
  <feature>authentication</feature>
  <feature>database</feature>
  <feature>api</feature>
  <feature>testing</feature>
</features>
<tech_stack>
  <frontend>react</frontend>
  <backend>node</backend>
  <database>postgresql</database>
  <deployment>vercel</deployment>
</tech_stack>
<quality_level>production</quality_level>  <!-- prototype | development | production -->
</generate_project>
```

#### 1.3 boltArtifact增强标签 (`bolt_artifact`)
```xml
<bolt_artifact id="enhanced-project" title="增强项目生成">
<meta>
  <version>2.0</version>
  <agent>code-generator</agent>
  <quality_score>0.95</quality_score>
</meta>
<environment>
  <type>webcontainer</type>
  <constraints>
    <no_native_binaries>true</no_native_binaries>
    <python_stdlib_only>true</python_stdlib_only>
    <prefer_vite>true</prefer_vite>
  </constraints>
</environment>
<actions>
  <bolt_action type="file" path="package.json" priority="1">
    <content>
{
  "name": "enhanced-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest"
  }
}
    </content>
    <validation>
      <syntax_check>true</syntax_check>
      <dependency_check>true</dependency_check>
    </validation>
  </bolt_action>
  <bolt_action type="shell" priority="2">
    <command>npm install</command>
    <retry_on_failure>true</retry_on_failure>
    <timeout>300</timeout>
  </bolt_action>
  <bolt_action type="start" priority="3">
    <command>npm run dev</command>
    <health_check>
      <url>http://localhost:3000</url>
      <timeout>30</timeout>
    </health_check>
  </bolt_action>
</actions>
</bolt_artifact>
```

### 2. 智能代码操作标签

#### 2.1 智能代码生成标签 (`smart_code_gen`)
```xml
<smart_code_gen>
<task>Create a user authentication system</task>
<context>
  <project_type>react-typescript</project_type>
  <existing_files>
    <file>src/types/user.ts</file>
    <file>src/utils/api.ts</file>
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
```

#### 2.2 智能重构标签 (`smart_refactor`)
```xml
<smart_refactor>
<target>
  <files>
    <file>src/components/UserProfile.tsx</file>
    <file>src/hooks/useUser.ts</file>
  </files>
</target>
<goals>
  <performance>true</performance>
  <maintainability>true</maintainability>
  <type_safety>true</type_safety>
</goals>
<constraints>
  <preserve_api>true</preserve_api>
  <maintain_tests>true</maintain_tests>
  <backward_compatible>true</backward_compatible>
</constraints>
<agent>architect</agent>
</smart_refactor>
```

#### 2.3 代码审查标签 (`code_review`)
```xml
<code_review>
<scope>
  <files>
    <file>src/auth/login.ts</file>
    <file>src/auth/register.ts</file>
  </files>
</scope>
<criteria>
  <security>
    <check>sql_injection</check>
    <check>xss_prevention</check>
    <check>auth_bypass</check>
  </security>
  <quality>
    <check>code_complexity</check>
    <check>naming_conventions</check>
    <check>error_handling</check>
  </quality>
  <performance>
    <check>memory_leaks</check>
    <check>async_patterns</check>
    <check>bundle_size</check>
  </performance>
</criteria>
<agent>code-reviewer</agent>
<output_format>detailed_report</output_format>
</code_review>
```

### 3. 多智能体协作标签

#### 3.1 智能体工作流标签 (`agent_workflow`)
```xml
<agent_workflow>
<task>Build a complete e-commerce feature</task>
<workflow>
  <stage name="analysis" agent="product-manager">
    <input>User requirements and business goals</input>
    <output>Product Requirements Document (PRD)</output>
    <duration>30min</duration>
  </stage>
  <stage name="design" agent="architect" depends_on="analysis">
    <input>PRD from analysis stage</input>
    <output>System architecture and API design</output>
    <duration>45min</duration>
  </stage>
  <stage name="implementation" agent="senior-developer" depends_on="design">
    <input>Architecture and API design</input>
    <output>Complete code implementation</output>
    <duration>2hours</duration>
    <parallel>
      <subtask agent="frontend-specialist">UI components</subtask>
      <subtask agent="backend-specialist">API endpoints</subtask>
    </parallel>
  </stage>
  <stage name="testing" agent="qa-engineer" depends_on="implementation">
    <input>Code implementation</input>
    <output>Test suite and quality report</output>
    <duration>1hour</duration>
  </stage>
  <stage name="documentation" agent="tech-writer" depends_on="testing">
    <input>Tested code and API</input>
    <output>Complete documentation</output>
    <duration>30min</duration>
  </stage>
</workflow>
<quality_gates>
  <gate stage="implementation">
    <criteria>code_coverage >= 80%</criteria>
    <criteria>security_score >= 90%</criteria>
  </gate>
  <gate stage="testing">
    <criteria>all_tests_pass = true</criteria>
    <criteria>performance_score >= 85%</criteria>
  </gate>
</quality_gates>
</agent_workflow>
```

#### 3.2 智能体通信标签 (`agent_message`)
```xml
<agent_message>
<from>senior-developer</from>
<to>code-reviewer</to>
<type>code_review_request</type>
<priority>high</priority>
<context>
  <task_id>auth-system-implementation</task_id>
  <files_changed>
    <file>src/auth/login.ts</file>
    <file>src/auth/middleware.ts</file>
  </files_changed>
  <concerns>
    <concern>Security validation needed</concern>
    <concern>Performance optimization required</concern>
  </concerns>
</context>
<deadline>2024-01-15T18:00:00Z</deadline>
</agent_message>
```

### 4. 高级文件操作标签

#### 4.1 智能差异应用标签 (`smart_apply_diff`)
```xml
<smart_apply_diff>
<strategy>intelligent</strategy>  <!-- intelligent | exact | fuzzy -->
<files>
  <file>
    <path>src/components/UserProfile.tsx</path>
    <changes>
      <change type="enhance" confidence="0.95">
        <description>Add TypeScript strict mode compliance</description>
        <search>
const UserProfile = ({ user }) => {
  return (
    <div className="profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};
        </search>
        <replace>
interface UserProfileProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      {user.avatar && <img src={user.avatar} alt={`${user.name}'s avatar`} />}
    </div>
  );
};
        </replace>
        <validation>
          <type_check>true</type_check>
          <lint_check>true</lint_check>
          <test_impact>minimal</test_impact>
        </validation>
      </change>
    </changes>
  </file>
</files>
<rollback_on_error>true</rollback_on_error>
<agent>code-generator</agent>
</smart_apply_diff>
```

#### 4.2 批量文件操作标签 (`batch_file_ops`)
```xml
<batch_file_ops>
<transaction>true</transaction>  <!-- 原子操作，全部成功或全部回滚 -->
<operations>
  <operation type="create" priority="1">
    <path>src/types/api.ts</path>
    <content>
export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}
    </content>
    <template>typescript-interface</template>
  </operation>
  <operation type="modify" priority="2" depends_on="1">
    <path>src/utils/api.ts</path>
    <action>add_import</action>
    <import>import { ApiResponse } from '../types/api';</import>
  </operation>
  <operation type="test" priority="3" depends_on="2">
    <path>src/utils/api.test.ts</path>
    <generate_tests>true</generate_tests>
    <coverage_target>90%</coverage_target>
  </operation>
</operations>
<validation>
  <syntax_check>true</syntax_check>
  <type_check>true</type_check>
  <test_run>true</test_run>
</validation>
</batch_file_ops>
```

### 5. 质量保证标签

#### 5.1 代码质量检查标签 (`quality_check`)
```xml
<quality_check>
<scope>
  <files>
    <pattern>src/**/*.{ts,tsx}</pattern>
    <exclude>**/*.test.ts</exclude>
  </files>
</scope>
<checks>
  <static_analysis>
    <tool>eslint</tool>
    <tool>typescript</tool>
    <tool>sonarjs</tool>
  </static_analysis>
  <security>
    <tool>semgrep</tool>
    <tool>snyk</tool>
    <custom_rules>owasp-top10</custom_rules>
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
  <code_coverage>80%</code_coverage>
  <security_score>90%</security_score>
  <performance_score>85%</performance_score>
  <maintainability_index>70</maintainability_index>
</thresholds>
<agent>qa-engineer</agent>
</quality_check>
```

#### 5.2 自动化测试生成标签 (`generate_tests`)
```xml
<generate_tests>
<target>
  <files>
    <file>src/auth/login.ts</file>
    <file>src/auth/register.ts</file>
  </files>
</target>
<test_types>
  <unit_tests>
    <framework>vitest</framework>
    <coverage_target>90%</coverage_target>
    <include_edge_cases>true</include_edge_cases>
  </unit_tests>
  <integration_tests>
    <framework>playwright</framework>
    <scenarios>
      <scenario>successful_login</scenario>
      <scenario>failed_login</scenario>
      <scenario>password_reset</scenario>
    </scenarios>
  </integration_tests>
  <performance_tests>
    <framework>k6</framework>
    <load_patterns>
      <pattern>normal_load</pattern>
      <pattern>spike_load</pattern>
    </load_patterns>
  </performance_tests>
</test_types>
<mocking>
  <external_apis>true</external_apis>
  <database>true</database>
  <file_system>false</file_system>
</mocking>
<agent>test-specialist</agent>
</generate_tests>
```

### 6. 部署和运维标签

#### 6.1 部署配置生成标签 (`generate_deployment`)
```xml
<generate_deployment>
<target_platform>vercel</target_platform>  <!-- vercel | netlify | aws | docker -->
<environment>production</environment>
<configuration>
  <build_command>npm run build</build_command>
  <output_directory>dist</output_directory>
  <node_version>18</node_version>
  <environment_variables>
    <var name="NODE_ENV" value="production" />
    <var name="API_URL" value="https://api.example.com" secret="false" />
    <var name="DATABASE_URL" value="$DATABASE_URL" secret="true" />
  </environment_variables>
</configuration>
<optimizations>
  <compression>true</compression>
  <caching>aggressive</caching>
  <cdn>true</cdn>
  <monitoring>true</monitoring>
</optimizations>
<security>
  <https_only>true</https_only>
  <security_headers>true</security_headers>
  <rate_limiting>true</rate_limiting>
</security>
<agent>devops-engineer</agent>
</generate_deployment>
```

#### 6.2 CI/CD流水线生成标签 (`generate_cicd`)
```xml
<generate_cicd>
<platform>github-actions</platform>  <!-- github-actions | gitlab-ci | jenkins -->
<triggers>
  <push>
    <branches>
      <branch>main</branch>
      <branch>develop</branch>
    </branches>
  </push>
  <pull_request>
    <target_branches>
      <branch>main</branch>
    </target_branches>
  </pull_request>
</triggers>
<stages>
  <stage name="test">
    <jobs>
      <job name="unit-tests">
        <commands>
          <command>npm ci</command>
          <command>npm run test:coverage</command>
        </commands>
        <artifacts>
          <artifact>coverage/</artifact>
        </artifacts>
      </job>
      <job name="e2e-tests">
        <commands>
          <command>npm run test:e2e</command>
        </commands>
        <services>
          <service>postgres:13</service>
        </services>
      </job>
    </jobs>
  </stage>
  <stage name="security">
    <jobs>
      <job name="security-scan">
        <commands>
          <command>npm audit</command>
          <command>npx semgrep --config=auto</command>
        </commands>
      </job>
    </jobs>
  </stage>
  <stage name="deploy" depends_on="test,security">
    <condition>branch == 'main'</condition>
    <jobs>
      <job name="deploy-production">
        <commands>
          <command>npm run build</command>
          <command>npm run deploy</command>
        </commands>
        <environment>production</environment>
      </job>
    </jobs>
  </stage>
</stages>
<notifications>
  <slack>
    <webhook>$SLACK_WEBHOOK</webhook>
    <on_failure>true</on_failure>
    <on_success>false</on_success>
  </slack>
</notifications>
<agent>devops-engineer</agent>
</generate_cicd>
```

## 标签使用最佳实践

### 1. 智能体选择策略
- **简单任务**: 使用单一专业智能体
- **复杂项目**: 使用多智能体工作流
- **质量要求高**: 增加审查和验证智能体
- **安全敏感**: 必须包含安全审计智能体

### 2. 错误处理和恢复
- **原子操作**: 使用transaction确保一致性
- **回滚机制**: 失败时自动回滚到安全状态
- **重试策略**: 网络或临时错误自动重试
- **人工干预**: 复杂错误提供人工干预选项

### 3. 性能优化
- **并行执行**: 独立任务并行处理
- **智能缓存**: 缓存常用结果和中间状态
- **增量更新**: 只处理变更的部分
- **资源管理**: 合理分配计算资源

### 4. 质量保证
- **多层验证**: 语法、类型、逻辑、安全多层检查
- **自动化测试**: 生成全面的测试套件
- **持续监控**: 实时监控代码质量指标
- **反馈循环**: 基于结果持续优化

这个TagX指令体系融合了多个主流编程助手的优势，提供了完整的智能编程解决方案，支持从项目初始化到部署运维的全生命周期开发流程。
