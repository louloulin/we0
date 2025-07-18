/**
 * 调试TagX解析器
 * 
 * 用于调试XML解析结果，了解实际的数据结构
 */

import { TagXParser } from '../parser';
import { SimpleTagXParser } from '../simple-parser';
import { XMLParser } from 'fast-xml-parser';

const parser = new TagXParser();
const simpleParser = new SimpleTagXParser();

// 创建一个原始XML解析器来查看原始结果
const rawParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: false,
  alwaysCreateTextNode: false,
});

// 测试smart_code_gen解析
const smartCodeGenXML = `
<smart_code_gen>
  <task>创建用户认证系统</task>
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
`;

console.log('=== 调试smart_code_gen解析 ===');
console.log('原始XML解析结果:');
const rawResult = rawParser.parse(smartCodeGenXML);
console.log(JSON.stringify(rawResult, null, 2));

console.log('\n简化TagX解析结果:');
try {
  const elements = simpleParser.parse(smartCodeGenXML);
  console.log('简化解析结果:', JSON.stringify(elements, null, 2));
} catch (error) {
  console.error('简化解析失败:', error);
}

console.log('\n原TagX解析结果:');
try {
  const elements = parser.parse(smartCodeGenXML);
  console.log('原解析结果:', JSON.stringify(elements, null, 2));
} catch (error) {
  console.error('原解析失败:', error);
}

// 测试bolt_artifact解析
const boltArtifactXML = `
<bolt_artifact id="test-project" title="测试项目">
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
      <content>{"name": "test-project"}</content>
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
  </actions>
</bolt_artifact>
`;

console.log('\n=== 调试bolt_artifact解析 ===');
try {
  const elements = parser.parse(boltArtifactXML);
  console.log('解析结果:', JSON.stringify(elements, null, 2));
} catch (error) {
  console.error('解析失败:', error);
}

// 测试agent_workflow解析
const agentWorkflowXML = `
<agent_workflow>
  <task>构建完整的电商功能</task>
  <workflow>
    <stage name="analysis" agent="product-manager">
      <input>用户需求和业务目标</input>
      <output>产品需求文档(PRD)</output>
      <duration>30min</duration>
    </stage>
    <stage name="design" agent="architect" depends_on="analysis">
      <input>PRD from analysis stage</input>
      <output>系统架构和API设计</output>
      <duration>45min</duration>
    </stage>
    <stage name="implementation" agent="senior-developer" depends_on="design">
      <input>架构和API设计</input>
      <output>完整代码实现</output>
      <duration>2hours</duration>
      <parallel>
        <subtask agent="frontend-specialist">UI组件</subtask>
        <subtask agent="backend-specialist">API端点</subtask>
      </parallel>
    </stage>
  </workflow>
  <quality_gates>
    <gate stage="implementation">
      <criteria>code_coverage >= 80%</criteria>
      <criteria>security_score >= 90%</criteria>
    </gate>
  </quality_gates>
</agent_workflow>
`;

console.log('\n=== 调试agent_workflow解析 ===');
try {
  const elements = parser.parse(agentWorkflowXML);
  console.log('解析结果:', JSON.stringify(elements, null, 2));
} catch (error) {
  console.error('解析失败:', error);
}
