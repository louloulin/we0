# DeepSeek Mastra Integration

A comprehensive integration of DeepSeek AI models with the Mastra framework, providing powerful code generation, analysis, and development assistance capabilities.

## Features

### 🤖 DeepSeek Agents
- **DeepSeek Agent**: General-purpose AI assistant for software development
- **DeepSeek Coder**: Specialized coding assistant optimized for programming tasks
- Both agents include advanced memory capabilities with working memory and semantic recall

### 🛠️ Development Tools
- **Code Generator**: Generate functions, classes, components, and complete projects
- **Code Analysis**: Review, optimize, and debug existing code
- **Project Structure**: Create well-organized project scaffolding
- **Documentation Tools**: Generate comprehensive documentation and API docs
- **RAG Integration**: Search through codebases using semantic search

### 🔄 Workflows
- **Simple Code Generation**: Basic project creation workflow
- **MCP Server**: Expose tools and agents via Model Context Protocol

### 🧠 Memory System
- **Working Memory**: Persistent user profiles and project context
- **Semantic Recall**: RAG-based search through conversation history
- **Resource-scoped Memory**: Context that persists across conversations

## Installation

```bash
# Install dependencies
npm install

# Install Mastra packages
npm install @mastra/core @mastra/memory @mastra/mcp @mastra/libsql

# Set up environment variables
cp .env.example .env
```

## Environment Variables

```bash
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Optional: OpenAI for embeddings (used in memory system)
OPENAI_API_KEY=your_openai_api_key_here
```

## Quick Start

### 1. Basic Agent Usage

```typescript
import { mastra } from './src/mastra';

// Get the DeepSeek agent
const agent = mastra.getAgent('deepseekAgent');

// Generate a response
const response = await agent.generate('Explain the benefits of TypeScript', {
  resourceId: 'user-123',
  threadId: 'conversation-456',
});

console.log(response.text);
```

### 2. Using Tools Directly

```typescript
import { codeGeneratorTool } from './src/mastra/tools/code-generator-tool';

// Generate a TypeScript function
const result = await codeGeneratorTool.execute({
  context: {
    type: 'function',
    language: 'typescript',
    description: 'Calculate factorial of a number',
    requirements: ['Add input validation', 'Include JSDoc comments'],
    style: 'production',
  },
});

console.log(result.code);
```

### 3. Running Workflows

```typescript
import { mastra } from './src/mastra';

// Get the code generation workflow
const workflow = mastra.getWorkflow('deepseekCodeGenerationWorkflow');

// Create and start a run
const run = await workflow.createRunAsync();
const result = await run.start({
  inputData: {
    projectName: 'my-app',
    description: 'A simple web application',
    language: 'typescript',
    framework: 'react',
    features: ['authentication', 'database', 'api'],
    includeTests: true,
    includeDocs: true,
  },
});

console.log(result);
```

### 4. MCP Server

Start the MCP server to expose DeepSeek tools to other clients:

```bash
# Start with stdio transport
npx tsx src/mastra/mcp/deepseek-mcp-server.ts stdio

# Start with SSE transport on port 3001
npx tsx src/mastra/mcp/deepseek-mcp-server.ts sse 3001
```

### 5. Testing MCP Client

```bash
# Test the MCP server
npx tsx src/test/mcp-client-test.ts
```

## Project Structure

```
apps/codex/
├── src/
│   ├── mastra/
│   │   ├── agents/           # DeepSeek agents
│   │   ├── models/           # Model configurations
│   │   ├── tools/            # Development tools
│   │   ├── workflows/        # Automated workflows
│   │   ├── mcp/             # MCP server implementation
│   │   └── index.ts         # Main Mastra configuration
│   ├── test/                # Test suites
│   └── examples/            # Usage examples
├── README.md
└── package.json
```

## Available Tools

### Code Generator Tool
- Generate functions, classes, components
- Support for multiple languages and frameworks
- Production-ready code with best practices

### Code Analysis Tool
- Review code quality and performance
- Identify bugs and security issues
- Suggest improvements and refactoring

### Documentation Tools
- Generate README files and API documentation
- Create inline code comments
- Build comprehensive project documentation

### RAG Tools
- Search through codebases semantically
- Find relevant code examples and documentation
- Context-aware code suggestions

## Memory Features

### Working Memory
- Persistent user profiles across sessions
- Project context and preferences
- Customizable templates for different use cases

### Semantic Recall
- Vector-based search through conversation history
- Contextual code retrieval
- Cross-conversation knowledge sharing

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testNamePattern="DeepSeek"

# Run integration tests
npm run test:integration
```

## Development

```bash
# Start development server
npm run dev

# Build the project
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://mastra.ai/docs)
- 💬 [Discord Community](https://discord.gg/mastra)
- 🐛 [Issue Tracker](https://github.com/mastra-ai/mastra/issues)
- 📧 [Email Support](mailto:support@mastra.ai)
