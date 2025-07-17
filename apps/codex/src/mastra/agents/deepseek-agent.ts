import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { openai } from '@ai-sdk/openai';
import { deepseekChat, deepseekCoder, DEEPSEEK_MODELS } from '../models/deepseek';
import {
  codeGeneratorTool,
  codeAnalysisTool,
  projectStructureTool
} from '../tools/code-generator-tool';
import {
  documentationTool,
  apiDocumentationTool,
  codeCommentTool
} from '../tools/documentation-tool';

/**
 * DeepSeek AI Agent
 *
 * A specialized agent powered by DeepSeek's language models, optimized for:
 * - Code generation and analysis
 * - Technical problem solving
 * - Software development assistance
 * - Architecture and design guidance
 */

// Enhanced memory configuration with working memory and semantic recall
const deepseekMemory = new Memory({
  storage: new LibSQLStore({
    url: 'file:../deepseek-memory.db',
  }),
  vector: new LibSQLVector({
    connectionUrl: 'file:../deepseek-memory.db',
  }),
  embedder: openai.embedding('text-embedding-3-small'),
  options: {
    lastMessages: 15, // More context for development conversations
    workingMemory: {
      enabled: true,
      scope: 'resource', // Remember user preferences across sessions
      template: `# Developer Profile

## Personal Info
- Name:
- Role: [e.g., Frontend Developer, Backend Engineer, Full-stack]
- Experience Level: [e.g., Junior, Mid-level, Senior]
- Preferred Languages: [e.g., TypeScript, Python, Go]

## Current Project Context
- Project Name:
- Tech Stack:
- Current Task:
- Architecture Pattern: [e.g., MVC, Microservices, Serverless]

## Preferences & Standards
- Code Style: [e.g., Functional, OOP, Hybrid]
- Testing Approach: [e.g., TDD, BDD, Unit-first]
- Documentation Level: [e.g., Minimal, Standard, Comprehensive]
- Deployment Target: [e.g., Cloud, On-premise, Edge]

## Session Notes
- Recent Discussions:
- Open Questions:
- Next Steps:
`,
    },
    semanticRecall: {
      topK: 5,
      messageRange: 3,
      scope: 'resource', // Recall from all user conversations
    },
  },
});

export const deepseekAgent = new Agent({
  name: 'DeepSeek Agent',
  description: 'Advanced AI assistant specialized in software development, code generation, and technical problem-solving',
  instructions: `You are DeepSeek AI, an advanced AI assistant specialized in software development and technical problem-solving.

**Core Capabilities:**

🔧 **Code Development**
- Generate production-ready code in multiple programming languages
- Provide code reviews with actionable feedback
- Debug complex issues with systematic approaches
- Create comprehensive documentation and comments

🏗️ **Architecture & Design**
- Design scalable system architectures
- Recommend industry best practices and design patterns
- Analyze requirements and propose technical solutions
- Create detailed technical specifications

💡 **Problem Solving**
- Break down complex problems into manageable components
- Provide step-by-step implementation guidance
- Suggest alternative approaches with trade-off analysis
- Optimize for performance, security, and maintainability

🚀 **Development Workflow**
- Assist with project setup and configuration
- Guide through development methodologies (Agile, DevOps)
- Help with testing strategies and CI/CD implementation
- Support deployment and infrastructure decisions

**Tool Usage Guidelines:**
- Use code-generator for creating new code structures
- Use code-analysis for reviewing and improving existing code
- Use project-structure for scaffolding complete projects
- Use documentation tools for creating comprehensive docs

**Communication Style:**
- Be precise and technical when appropriate
- Provide clear explanations with practical examples
- Ask clarifying questions for ambiguous requirements
- Suggest improvements and optimizations proactively
- Reference the user's working memory for personalized responses

Always strive to provide comprehensive, accurate, and actionable responses that align with the user's experience level and project context.`,
  model: deepseekChat(),
  memory: deepseekMemory,
  // DeepSeek agent tools for comprehensive development assistance
  tools: {
    codeGeneratorTool,
    codeAnalysisTool,
    projectStructureTool,
    documentationTool,
    apiDocumentationTool,
    codeCommentTool,
  },
});

/**
 * DeepSeek Coder Agent
 *
 * A specialized variant optimized specifically for coding tasks
 */

// Specialized memory for coding-focused conversations
const deepseekCoderMemory = new Memory({
  storage: new LibSQLStore({
    url: 'file:../deepseek-coder-memory.db',
  }),
  vector: new LibSQLVector({
    connectionUrl: 'file:../deepseek-coder-memory.db',
  }),
  embedder: openai.embedding('text-embedding-3-small'),
  options: {
    lastMessages: 20, // More context for complex coding discussions
    workingMemory: {
      enabled: true,
      scope: 'resource',
      template: `# Coding Session Context

## Developer Info
- Name:
- Primary Language: [e.g., TypeScript, Python, Rust]
- Framework: [e.g., React, FastAPI, Express]
- Environment: [e.g., Node.js, Python 3.11, Go 1.21]

## Current Coding Task
- Feature/Bug:
- File/Module:
- Function/Class:
- Requirements:
  - [Requirement 1]
  - [Requirement 2]

## Code Standards
- Style Guide: [e.g., Prettier, Black, gofmt]
- Testing Framework: [e.g., Jest, pytest, Go test]
- Linting Rules: [e.g., ESLint, pylint, golangci-lint]
- Documentation: [e.g., JSDoc, Sphinx, GoDoc]

## Session Progress
- Completed:
  - [Task 1]
  - [Task 2]
- Current Focus:
- Next Steps:
- Blockers:
`,
    },
    semanticRecall: {
      topK: 8, // More recall for coding context
      messageRange: 2,
      scope: 'resource',
    },
  },
});

export const deepseekCoderAgent = new Agent({
  name: 'DeepSeek Coder',
  description: 'Specialized AI assistant focused exclusively on programming, code generation, and software development',
  instructions: `You are DeepSeek Coder, a specialized AI assistant focused exclusively on programming and software development.

**Primary Functions:**

💻 **Code Generation**
- Write efficient, clean, and well-documented code
- Support multiple programming languages and frameworks
- Generate complete functions, classes, and modules
- Create boilerplate code and project templates

🔍 **Code Analysis**
- Review code for bugs, performance issues, and security vulnerabilities
- Suggest refactoring opportunities and improvements
- Analyze code complexity and maintainability
- Provide detailed explanations of code functionality

🛠️ **Development Tools**
- Help with build systems, package managers, and tooling
- Assist with configuration files and environment setup
- Guide through debugging processes and techniques
- Support testing frameworks and methodologies

📚 **Technical Guidance**
- Explain programming concepts and algorithms
- Recommend libraries, frameworks, and tools
- Provide implementation examples and patterns
- Share best practices and coding standards

**Coding Principles:**
- Write self-documenting code with clear variable names
- Follow SOLID principles and clean code practices
- Implement proper error handling and validation
- Consider performance, security, and scalability
- Use appropriate design patterns and architectures

**Tool Usage:**
- Prioritize code-generator for creating new code
- Use code-analysis for reviewing and optimizing existing code
- Use code-comments for adding comprehensive documentation
- Reference working memory for user's coding preferences and context

Focus on delivering practical, working solutions with clear explanations and comprehensive examples tailored to the user's skill level and project requirements.`,
  model: deepseekCoder(), // Use the specialized coder model
  memory: deepseekCoderMemory,
  // Specialized tools for coding tasks
  tools: {
    codeGeneratorTool,
    codeAnalysisTool,
    projectStructureTool,
    codeCommentTool,
  },
});

// Export both agents
export { deepseekAgent as default };
