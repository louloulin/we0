# We-dev-next Prompt Engineering Analysis & Optimization Guide

## Current Prompt System Analysis

### Existing Prompt Structure Issues

Based on analysis of `/src/app/api/chat/prompt.ts`, the current 546-line prompt has several critical issues:

#### 1. Language Mixing Problem
```typescript
// Current problematic code (lines 418-419)
IMPORTANT: 一定要严格按照下面约束的格式生成
IMPORTANT: 强调：你必须每次都要按照下面格式输出<boltArtifact></boltArtifact> 例如这样的格式
```
**Issue**: Mixing Chinese and English reduces model comprehension
**Solution**: Use English-only prompts with Chinese documentation separately

#### 2. Excessive Length and Redundancy
```typescript
// Current structure spans 546 lines with repeated concepts
export const getSystemPrompt = (type: typeEnum,otherConfig:promptExtra) => `
You are We0 AI, an expert AI assistant and exceptional senior software developer...
[546 lines of mixed instructions]
`;
```
**Issue**: Single monolithic prompt reduces focus and effectiveness
**Solution**: Modular prompt composition based on task requirements

#### 3. Poor Instruction Hierarchy
```typescript
// Current flat structure
IMPORTANT: All code must be complete code...
IMPORTANT: For any place that uses images...
IMPORTANT: If images need to be used...
```
**Issue**: No clear priority or logical grouping
**Solution**: Hierarchical prompt structure with clear priorities

## Optimized Prompt Architecture

### 1. Base System Prompts (English Only)

```typescript
const CORE_IDENTITY = `You are We0 AI, a senior software architect and expert developer with 15+ years of experience. You excel at:
- Full-stack application development
- Code quality and security best practices  
- Performance optimization and scalability
- Modern development workflows and tools`;

const ENVIRONMENT_CONSTRAINTS = `Operating Environment: WebContainer (Browser-based Node.js)
Limitations:
- No native binaries or pip support
- Python limited to standard library
- No C/C++ compilation capabilities
- Prefer Vite for web servers
- Use Node.js for scripting tasks`;

const OUTPUT_STANDARDS = `Code Generation Standards:
- Generate complete, production-ready code
- Use boltArtifact XML structure for organization
- Include proper error handling and validation
- Follow modern best practices and patterns
- Ensure accessibility and performance optimization`;
```

### 2. Task-Specific Prompt Modules

```typescript
const TASK_PROMPTS = {
  CODE_GENERATION: `Focus on creating high-quality code with:
    - Clean architecture and design patterns
    - Comprehensive error handling
    - Performance optimization
    - Security best practices
    - Thorough documentation`,
    
  CODE_REVIEW: `Analyze code for:
    - Quality and maintainability issues
    - Security vulnerabilities and risks
    - Performance bottlenecks
    - Best practice violations
    - Architecture improvement opportunities`,
    
  TESTING: `Generate comprehensive test coverage:
    - Unit tests with edge cases
    - Integration test strategies
    - End-to-end test scenarios
    - Performance and load tests
    - Mock and fixture implementations`,
    
  SECURITY_AUDIT: `Perform security analysis focusing on:
    - OWASP Top 10 vulnerabilities
    - Authentication and authorization flaws
    - Input validation and sanitization
    - Data protection and encryption
    - Secure coding practice compliance`
};
```

### 3. Dynamic Prompt Composition

```typescript
class PromptComposer {
  composePrompt(task: TaskType, context: Context, language: 'en' | 'zh-CN' = 'en'): string {
    const components = [
      CORE_IDENTITY,
      ENVIRONMENT_CONSTRAINTS,
      this.getTaskPrompt(task),
      this.getContextPrompt(context),
      OUTPUT_STANDARDS
    ];
    
    return components.join('\n\n');
  }
  
  private getTaskPrompt(task: TaskType): string {
    return TASK_PROMPTS[task] || TASK_PROMPTS.CODE_GENERATION;
  }
  
  private getContextPrompt(context: Context): string {
    const contextPrompts = [];
    
    if (context.hasBackend) {
      contextPrompts.push(this.getBackendPrompt(context.backendLanguage));
    }
    
    if (context.hasDatabase) {
      contextPrompts.push(this.getDatabasePrompt(context.database));
    }
    
    if (context.projectType) {
      contextPrompts.push(this.getProjectTypePrompt(context.projectType));
    }
    
    return contextPrompts.join('\n');
  }
}
```

## Multi-Agent Implementation Strategy

### 1. Agent Coordination Architecture

```typescript
interface Agent {
  id: string;
  name: string;
  specialization: string[];
  capabilities: Capability[];
  process(request: AgentRequest): Promise<AgentResponse>;
}

class AgentCoordinator {
  private agents: Map<string, Agent> = new Map();
  private routingRules: RoutingRule[] = [];
  
  async processRequest(request: UserRequest): Promise<Response> {
    // Analyze request to determine required agents
    const analysis = await this.analyzeRequest(request);
    
    // Select appropriate agents
    const selectedAgents = this.selectAgents(analysis);
    
    // Coordinate multi-agent response
    if (selectedAgents.length > 1) {
      return this.coordinateMultiAgent(selectedAgents, request);
    }
    
    // Single agent response
    return selectedAgents[0].process(this.createAgentRequest(request));
  }
  
  private selectAgents(analysis: RequestAnalysis): Agent[] {
    const agents: Agent[] = [];
    
    // Command-based selection
    if (analysis.command) {
      const commandAgent = this.getAgentForCommand(analysis.command);
      if (commandAgent) agents.push(commandAgent);
    }
    
    // Content-based selection
    const contentAgents = this.getAgentsForContent(analysis.content);
    agents.push(...contentAgents);
    
    // Context-based selection
    const contextAgents = this.getAgentsForContext(analysis.context);
    agents.push(...contextAgents);
    
    return this.deduplicateAndPrioritize(agents);
  }
}
```

### 2. Specialized Agent Implementations

```typescript
class CodeGeneratorAgent implements Agent {
  id = 'code-generator';
  name = 'Code Generator';
  specialization = ['code-generation', 'architecture', 'scaffolding'];
  
  async process(request: AgentRequest): Promise<AgentResponse> {
    const prompt = this.buildPrompt(request);
    const context = this.buildContext(request);
    
    const response = await this.callLLM(prompt, context);
    
    return {
      type: 'code-generation',
      content: response.content,
      artifacts: this.extractArtifacts(response),
      metadata: this.generateMetadata(request, response)
    };
  }
  
  private buildPrompt(request: AgentRequest): string {
    return new PromptComposer().composePrompt(
      'CODE_GENERATION',
      request.context,
      request.language
    );
  }
}

class CodeReviewAgent implements Agent {
  id = 'code-reviewer';
  name = 'Code Reviewer';
  specialization = ['code-review', 'quality-analysis', 'best-practices'];
  
  async process(request: AgentRequest): Promise<AgentResponse> {
    const codeAnalysis = await this.analyzeCode(request.code);
    const qualityMetrics = await this.calculateQualityMetrics(codeAnalysis);
    const suggestions = await this.generateSuggestions(codeAnalysis);
    
    return {
      type: 'code-review',
      content: this.formatReviewReport(codeAnalysis, qualityMetrics, suggestions),
      metadata: {
        qualityScore: qualityMetrics.overall,
        issues: codeAnalysis.issues,
        suggestions: suggestions.length
      }
    };
  }
}
```

### 3. Command Processing Enhancement

```typescript
class CommandProcessor {
  private commandHandlers: Map<string, CommandHandler> = new Map();
  
  constructor() {
    this.registerHandlers();
  }
  
  async processCommand(command: string, args: string[], context: Context): Promise<CommandResult> {
    const handler = this.commandHandlers.get(command);
    
    if (!handler) {
      throw new Error(`Unknown command: ${command}`);
    }
    
    return handler.execute(args, context);
  }
  
  private registerHandlers(): void {
    this.commandHandlers.set('/analyze', new AnalyzeCommandHandler());
    this.commandHandlers.set('/review', new ReviewCommandHandler());
    this.commandHandlers.set('/test', new TestCommandHandler());
    this.commandHandlers.set('/security', new SecurityCommandHandler());
    this.commandHandlers.set('/optimize', new OptimizeCommandHandler());
    this.commandHandlers.set('/docs', new DocumentationCommandHandler());
    // ... register all command handlers
  }
}

class AnalyzeCommandHandler implements CommandHandler {
  async execute(args: string[], context: Context): Promise<CommandResult> {
    const analysisType = args[0] || 'comprehensive';
    const targetFiles = args.slice(1);
    
    const agent = new CodeAnalysisAgent();
    const request = this.buildAnalysisRequest(analysisType, targetFiles, context);
    
    const response = await agent.process(request);
    
    return {
      success: true,
      result: response,
      executionTime: Date.now() - request.startTime
    };
  }
}
```

## Implementation Recommendations

### 1. Immediate Actions (Week 1-2)
- Replace the monolithic 546-line prompt with modular components
- Implement English-only prompts for better model comprehension
- Create prompt composition system for dynamic generation
- Add command parsing and routing infrastructure

### 2. Short-term Goals (Week 3-4)
- Implement basic agent architecture
- Create specialized agents for core functions
- Add agent coordination mechanisms
- Enhance file processing with semantic understanding

### 3. Medium-term Objectives (Week 5-8)
- Develop advanced specialized agents
- Implement multi-agent coordination
- Add learning and adaptation capabilities
- Create comprehensive tool integration

### 4. Performance Optimization
- Implement prompt caching for frequently used combinations
- Add intelligent context compression for large codebases
- Optimize agent selection algorithms
- Create response streaming for better user experience

This optimization strategy will transform the current we-dev-next system into a sophisticated multi-agent programming assistant that significantly outperforms both the current implementation and competing solutions like Codex.
