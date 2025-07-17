import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Code Generator Tool
 * 
 * A comprehensive tool for generating various types of code artifacts
 * including functions, classes, components, and complete project structures.
 */

export const codeGeneratorTool = createTool({
  id: 'code-generator',
  description: 'Generate code artifacts including functions, classes, components, and project structures',
  inputSchema: z.object({
    type: z.enum([
      'function',
      'class',
      'component',
      'api',
      'test',
      'config',
      'schema',
      'project'
    ]).describe('Type of code to generate'),
    language: z.string().describe('Programming language (e.g., typescript, python, javascript, etc.)'),
    framework: z.string().optional().describe('Framework or library (e.g., react, express, fastapi, etc.)'),
    description: z.string().describe('Detailed description of what to generate'),
    requirements: z.array(z.string()).optional().describe('Specific requirements or constraints'),
    style: z.enum(['minimal', 'comprehensive', 'production']).default('comprehensive').describe('Code style and completeness level'),
  }),
  outputSchema: z.object({
    code: z.string().describe('Generated code'),
    filename: z.string().describe('Suggested filename'),
    dependencies: z.array(z.string()).optional().describe('Required dependencies'),
    instructions: z.string().optional().describe('Setup or usage instructions'),
    tests: z.string().optional().describe('Generated test code'),
  }),
  execute: async ({ context }) => {
    const { type, language, framework, description, requirements = [], style } = context;
    
    // Generate code based on type and requirements
    const result = await generateCode({
      type,
      language,
      framework,
      description,
      requirements,
      style,
    });
    
    return result;
  },
});

/**
 * Code Analysis Tool
 * 
 * Analyzes existing code for quality, performance, security, and maintainability issues.
 */
export const codeAnalysisTool = createTool({
  id: 'code-analysis',
  description: 'Analyze code for quality, performance, security, and maintainability issues',
  inputSchema: z.object({
    code: z.string().describe('Code to analyze'),
    language: z.string().describe('Programming language'),
    analysisType: z.array(z.enum([
      'quality',
      'performance',
      'security',
      'maintainability',
      'complexity',
      'best-practices'
    ])).describe('Types of analysis to perform'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium').describe('Minimum severity level to report'),
  }),
  outputSchema: z.object({
    issues: z.array(z.object({
      type: z.string(),
      severity: z.string(),
      message: z.string(),
      line: z.number().optional(),
      suggestion: z.string().optional(),
    })),
    score: z.number().describe('Overall code quality score (0-100)'),
    summary: z.string().describe('Analysis summary'),
    recommendations: z.array(z.string()).describe('Improvement recommendations'),
  }),
  execute: async ({ context }) => {
    const { code, language, analysisType, severity } = context;
    
    // Analyze code and return results
    const result = await analyzeCode({
      code,
      language,
      analysisType,
      severity,
    });
    
    return result;
  },
});

/**
 * Project Structure Tool
 * 
 * Generates complete project structures with proper organization and configuration.
 */
export const projectStructureTool = createTool({
  id: 'project-structure',
  description: 'Generate complete project structures with proper organization and configuration',
  inputSchema: z.object({
    projectType: z.enum([
      'web-app',
      'api',
      'library',
      'cli',
      'mobile-app',
      'desktop-app',
      'microservice'
    ]).describe('Type of project to create'),
    language: z.string().describe('Primary programming language'),
    framework: z.string().optional().describe('Main framework or library'),
    features: z.array(z.string()).describe('Features to include (e.g., auth, database, testing, etc.)'),
    packageManager: z.enum(['npm', 'yarn', 'pnpm', 'pip', 'cargo']).optional().describe('Package manager to use'),
    name: z.string().describe('Project name'),
  }),
  outputSchema: z.object({
    structure: z.record(z.string()).describe('File structure with file contents'),
    setup: z.array(z.string()).describe('Setup commands to run'),
    readme: z.string().describe('Generated README content'),
    dependencies: z.record(z.string()).describe('Dependencies to install'),
  }),
  execute: async ({ context }) => {
    const { projectType, language, framework, features, packageManager, name } = context;
    
    // Generate project structure
    const result = await generateProjectStructure({
      projectType,
      language,
      framework,
      features,
      packageManager,
      name,
    });
    
    return result;
  },
});

// Helper functions for code generation
async function generateCode(params: {
  type: string;
  language: string;
  framework?: string;
  description: string;
  requirements: string[];
  style: string;
}) {
  // This is a simplified implementation
  // In a real scenario, this would use AI models or templates
  
  const { type, language, framework, description, requirements, style } = params;
  
  // Generate basic code structure based on type
  let code = '';
  let filename = '';
  let dependencies: string[] = [];
  let instructions = '';
  let tests = '';
  
  switch (type) {
    case 'function':
      filename = `${description.toLowerCase().replace(/\s+/g, '-')}.${getFileExtension(language)}`;
      code = generateFunction(language, description, requirements, style);
      break;
      
    case 'class':
      filename = `${description.toLowerCase().replace(/\s+/g, '-')}.${getFileExtension(language)}`;
      code = generateClass(language, description, requirements, style);
      break;
      
    case 'component':
      filename = `${description.toLowerCase().replace(/\s+/g, '-')}.${getFileExtension(language)}`;
      code = generateComponent(language, framework, description, requirements, style);
      if (framework === 'react') {
        dependencies = ['react', '@types/react'];
      }
      break;
      
    default:
      code = `// Generated ${type} for: ${description}\n// Language: ${language}\n// Framework: ${framework || 'none'}\n\n// TODO: Implement ${type}`;
      filename = `${type}.${getFileExtension(language)}`;
  }
  
  return {
    code,
    filename,
    dependencies: dependencies.length > 0 ? dependencies : undefined,
    instructions: instructions || undefined,
    tests: tests || undefined,
  };
}

async function analyzeCode(params: {
  code: string;
  language: string;
  analysisType: string[];
  severity: string;
}) {
  // Simplified code analysis implementation
  const issues = [
    {
      type: 'quality',
      severity: 'medium',
      message: 'Consider adding type annotations for better code clarity',
      line: 1,
      suggestion: 'Add explicit type annotations to function parameters and return values',
    },
  ];
  
  return {
    issues,
    score: 85,
    summary: 'Code analysis completed. Found minor quality improvements.',
    recommendations: [
      'Add comprehensive error handling',
      'Include unit tests',
      'Add documentation comments',
    ],
  };
}

async function generateProjectStructure(params: {
  projectType: string;
  language: string;
  framework?: string;
  features: string[];
  packageManager?: string;
  name: string;
}) {
  // Simplified project structure generation
  const structure: Record<string, string> = {
    'package.json': JSON.stringify({
      name: params.name,
      version: '1.0.0',
      description: `A ${params.projectType} built with ${params.language}`,
      main: 'index.js',
      scripts: {
        start: 'node index.js',
        dev: 'nodemon index.js',
        test: 'jest',
      },
    }, null, 2),
    'README.md': `# ${params.name}\n\nA ${params.projectType} built with ${params.language}${params.framework ? ` and ${params.framework}` : ''}.\n\n## Features\n\n${params.features.map(f => `- ${f}`).join('\n')}\n\n## Getting Started\n\n1. Install dependencies\n2. Run the development server\n3. Start building!`,
    '.gitignore': 'node_modules/\n.env\ndist/\nbuild/',
  };
  
  return {
    structure,
    setup: ['npm install', 'npm run dev'],
    readme: structure['README.md'],
    dependencies: { [params.framework || 'express']: '^4.18.0' },
  };
}

// Helper functions
function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
    python: 'py',
    java: 'java',
    csharp: 'cs',
    go: 'go',
    rust: 'rs',
    php: 'php',
    ruby: 'rb',
  };
  
  return extensions[language.toLowerCase()] || 'txt';
}

function generateFunction(language: string, description: string, requirements: string[], style: string): string {
  // Simplified function generation
  if (language.toLowerCase() === 'typescript') {
    return `/**
 * ${description}
 * ${requirements.map(req => `* - ${req}`).join('\n * ')}
 */
export function ${description.toLowerCase().replace(/\s+/g, '')}(): void {
  // TODO: Implement function logic
  throw new Error('Not implemented');
}`;
  }
  
  return `// ${description}\nfunction ${description.toLowerCase().replace(/\s+/g, '')}() {\n  // TODO: Implement\n}`;
}

function generateClass(language: string, description: string, requirements: string[], style: string): string {
  const className = description.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  
  if (language.toLowerCase() === 'typescript') {
    return `/**
 * ${description}
 * ${requirements.map(req => `* - ${req}`).join('\n * ')}
 */
export class ${className} {
  constructor() {
    // TODO: Initialize class
  }
  
  // TODO: Add methods
}`;
  }
  
  return `class ${className} {\n  constructor() {\n    // TODO: Initialize\n  }\n}`;
}

function generateComponent(language: string, framework: string | undefined, description: string, requirements: string[], style: string): string {
  if (framework === 'react' && language.toLowerCase() === 'typescript') {
    const componentName = description.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    
    return `import React from 'react';

interface ${componentName}Props {
  // TODO: Define props
}

/**
 * ${description}
 * ${requirements.map(req => `* - ${req}`).join('\n * ')}
 */
export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div>
      <h1>${componentName}</h1>
      {/* TODO: Implement component */}
    </div>
  );
};

export default ${componentName};`;
  }
  
  return `// ${description} component\n// TODO: Implement component`;
}
