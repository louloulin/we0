# We-dev-next Migration Implementation Guide

## Current System Architecture Analysis

### Existing File Structure
```
/src/app/api/chat/
├── route.ts                 # Main API endpoint
├── action.ts               # AI model integration
├── prompt.ts               # Monolithic prompt system (546 lines)
├── handlers/
│   ├── builderHandler.ts   # Code generation mode
│   └── chatHandler.ts      # Conversational mode
├── utils/
│   ├── promptBuilder.ts    # Prompt composition
│   ├── fileProcessor.ts    # File handling
│   ├── streamResponse.ts   # Response streaming
│   └── tokenHandler.ts     # Token management
├── backend.ts              # Backend language support
├── database.ts             # Database integration
└── cache.ts               # Cache configuration
```

### Key Components to Preserve
1. **Multi-model support** (Claude, GPT-4, DeepSeek) in `action.ts`
2. **Streaming architecture** in `streamResponse.ts` and `switchable-stream.ts`
3. **File processing logic** in `fileProcessor.ts`
4. **Backend language strategy pattern** in `backend.ts`, `database.ts`, `cache.ts`
5. **Token management** in `tokenHandler.ts`

## Migration Strategy

### Phase 1: Prompt System Refactoring

#### Step 1: Create New Prompt Architecture
```typescript
// /src/app/api/chat/prompts/index.ts
export interface PromptModule {
  id: string;
  priority: number;
  content: string;
  conditions?: PromptCondition[];
}

export class PromptComposer {
  private modules: Map<string, PromptModule> = new Map();
  
  constructor() {
    this.loadPromptModules();
  }
  
  composePrompt(task: TaskType, context: Context): string {
    const selectedModules = this.selectModules(task, context);
    return this.combineModules(selectedModules);
  }
  
  private loadPromptModules(): void {
    // Load modular prompts from separate files
    this.modules.set('identity', IDENTITY_PROMPT);
    this.modules.set('environment', ENVIRONMENT_PROMPT);
    this.modules.set('output-format', OUTPUT_FORMAT_PROMPT);
    // ... load all modules
  }
}
```

#### Step 2: Replace Existing Prompt System
```typescript
// Modify /src/app/api/chat/prompt.ts
import { PromptComposer } from './prompts';

// Replace the existing getSystemPrompt function
export const getSystemPrompt = (type: typeEnum, otherConfig: promptExtra): string => {
  const composer = new PromptComposer();
  return composer.composePrompt(type, otherConfig);
};

// Keep existing interfaces for backward compatibility
export { typeEnum, promptExtra, ToolInfo };
```

### Phase 2: Agent Architecture Implementation

#### Step 1: Create Base Agent Interface
```typescript
// /src/app/api/chat/agents/base.ts
export interface Agent {
  id: string;
  name: string;
  specialization: string[];
  process(request: AgentRequest): Promise<AgentResponse>;
}

export abstract class BaseAgent implements Agent {
  abstract id: string;
  abstract name: string;
  abstract specialization: string[];
  
  async process(request: AgentRequest): Promise<AgentResponse> {
    const prompt = this.buildPrompt(request);
    const response = await this.callLLM(prompt, request);
    return this.formatResponse(response);
  }
  
  protected abstract buildPrompt(request: AgentRequest): string;
  protected abstract formatResponse(response: any): AgentResponse;
  
  protected async callLLM(prompt: string, request: AgentRequest): Promise<any> {
    // Use existing streamTextFn from action.ts
    const { streamTextFn } = await import('../action');
    return streamTextFn(
      [{ id: 'system', role: 'system', content: prompt }, ...request.messages],
      request.options,
      request.model
    );
  }
}
```

#### Step 2: Implement Specialized Agents
```typescript
// /src/app/api/chat/agents/codeGenerator.ts
export class CodeGeneratorAgent extends BaseAgent {
  id = 'code-generator';
  name = 'Code Generator';
  specialization = ['code-generation', 'scaffolding', 'architecture'];
  
  protected buildPrompt(request: AgentRequest): string {
    const composer = new PromptComposer();
    return composer.composePrompt('CODE_GENERATION', request.context);
  }
  
  protected formatResponse(response: any): AgentResponse {
    return {
      type: 'code-generation',
      content: response.content,
      artifacts: this.extractArtifacts(response.content),
      metadata: { model: response.model, tokens: response.tokens }
    };
  }
}

// /src/app/api/chat/agents/codeReviewer.ts
export class CodeReviewAgent extends BaseAgent {
  id = 'code-reviewer';
  name = 'Code Reviewer';
  specialization = ['code-review', 'quality-analysis', 'security'];
  
  protected buildPrompt(request: AgentRequest): string {
    const composer = new PromptComposer();
    return composer.composePrompt('CODE_REVIEW', request.context);
  }
  
  protected formatResponse(response: any): AgentResponse {
    return {
      type: 'code-review',
      content: response.content,
      analysis: this.parseAnalysis(response.content),
      metadata: { qualityScore: this.calculateQualityScore(response.content) }
    };
  }
}
```

#### Step 3: Create Agent Coordinator
```typescript
// /src/app/api/chat/agents/coordinator.ts
export class AgentCoordinator {
  private agents: Map<string, Agent> = new Map();
  
  constructor() {
    this.registerAgents();
  }
  
  async processRequest(request: UserRequest): Promise<Response> {
    const analysis = this.analyzeRequest(request);
    const selectedAgent = this.selectAgent(analysis);
    
    const agentRequest = this.createAgentRequest(request);
    const response = await selectedAgent.process(agentRequest);
    
    return this.formatFinalResponse(response);
  }
  
  private registerAgents(): void {
    this.agents.set('code-generator', new CodeGeneratorAgent());
    this.agents.set('code-reviewer', new CodeReviewAgent());
    this.agents.set('test-generator', new TestGeneratorAgent());
    // ... register all agents
  }
  
  private selectAgent(analysis: RequestAnalysis): Agent {
    // Command-based selection
    if (analysis.command) {
      return this.getAgentForCommand(analysis.command);
    }
    
    // Content-based selection
    return this.getAgentForContent(analysis.content);
  }
}
```

### Phase 3: Handler Migration

#### Step 1: Update Existing Handlers
```typescript
// Modify /src/app/api/chat/handlers/builderHandler.ts
import { AgentCoordinator } from '../agents/coordinator';

export async function handleBuilderMode(
  messages: Messages,
  model: string,
  userId: string | null,
  otherConfig: promptExtra,
  tools?: ToolInfo[],
): Promise<Response> {
  // Preserve existing file processing logic
  const { files, allContent } = processFiles(messages);
  
  // Use new agent coordinator instead of direct prompt building
  const coordinator = new AgentCoordinator();
  
  const request = {
    messages,
    model,
    userId,
    context: {
      files,
      config: otherConfig,
      tools
    }
  };
  
  return coordinator.processRequest(request);
}
```

#### Step 2: Add Command Processing
```typescript
// /src/app/api/chat/handlers/commandHandler.ts
export class CommandHandler {
  private coordinator: AgentCoordinator;
  
  constructor() {
    this.coordinator = new AgentCoordinator();
  }
  
  async handleCommand(
    command: string,
    args: string[],
    messages: Messages,
    model: string,
    userId: string | null
  ): Promise<Response> {
    const request = {
      command,
      args,
      messages,
      model,
      userId,
      context: this.buildContext(messages)
    };
    
    return this.coordinator.processRequest(request);
  }
}
```

### Phase 4: Route Integration

#### Step 1: Update Main Route
```typescript
// Modify /src/app/api/chat/route.ts
import { CommandHandler } from './handlers/commandHandler';

export async function POST(request: Request) {
  try {
    const {
      messages,
      model,
      mode = ChatMode.Builder,
      otherConfig,
      tools,
    } = (await request.json()) as ChatRequest;
    
    const userId = request.headers.get("userId");
    
    // Check for commands in the last message
    const lastMessage = messages[messages.length - 1];
    const commandMatch = lastMessage.content.match(/^\/(\w+)(?:\s+(.*))?$/);
    
    if (commandMatch) {
      const [, command, argsString] = commandMatch;
      const args = argsString ? argsString.split(/\s+/) : [];
      
      const commandHandler = new CommandHandler();
      return commandHandler.handleCommand(command, args, messages, model, userId);
    }
    
    // Fallback to existing handlers for backward compatibility
    const result = mode === ChatMode.Chat
      ? await handleChatMode(messages, model, userId, tools)
      : await handleBuilderMode(messages, model, userId, otherConfig, tools);
    
    return result;
  } catch (error) {
    // Preserve existing error handling
    console.error('API route error:', error);
    // ... existing error handling code
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// /src/app/api/chat/__tests__/agents.test.ts
describe('Agent System', () => {
  test('CodeGeneratorAgent produces valid artifacts', async () => {
    const agent = new CodeGeneratorAgent();
    const request = createMockRequest('generate a React component');
    
    const response = await agent.process(request);
    
    expect(response.type).toBe('code-generation');
    expect(response.artifacts).toBeDefined();
    expect(response.artifacts.length).toBeGreaterThan(0);
  });
  
  test('AgentCoordinator selects correct agent for commands', () => {
    const coordinator = new AgentCoordinator();
    const analysis = { command: '/review', content: 'review this code' };
    
    const agent = coordinator.selectAgent(analysis);
    
    expect(agent.id).toBe('code-reviewer');
  });
});
```

### Integration Tests
```typescript
// /src/app/api/chat/__tests__/integration.test.ts
describe('Migration Integration', () => {
  test('Backward compatibility with existing API', async () => {
    const request = createLegacyRequest();
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    // Verify response format matches existing expectations
  });
  
  test('New command system works correctly', async () => {
    const request = createCommandRequest('/analyze');
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    // Verify command-specific response format
  });
});
```

## Deployment Strategy

### 1. Feature Flags
```typescript
// /src/app/api/chat/config/features.ts
export const FEATURE_FLAGS = {
  USE_NEW_AGENT_SYSTEM: process.env.ENABLE_AGENT_SYSTEM === 'true',
  USE_MODULAR_PROMPTS: process.env.ENABLE_MODULAR_PROMPTS === 'true',
  ENABLE_COMMAND_SYSTEM: process.env.ENABLE_COMMANDS === 'true'
};
```

### 2. Gradual Rollout
- Week 1-2: Deploy prompt system refactoring with feature flag
- Week 3-4: Enable agent system for 10% of users
- Week 5-6: Increase to 50% of users
- Week 7-8: Full rollout with monitoring

### 3. Monitoring and Rollback
```typescript
// /src/app/api/chat/monitoring/metrics.ts
export class MigrationMetrics {
  static trackAgentUsage(agentId: string, success: boolean, responseTime: number): void {
    // Track agent performance metrics
  }
  
  static trackPromptEffectiveness(promptType: string, userSatisfaction: number): void {
    // Track prompt optimization metrics
  }
}
```

This migration guide ensures a smooth transition from the current we-dev-next system to the enhanced multi-agent architecture while preserving all existing functionality and maintaining backward compatibility.
