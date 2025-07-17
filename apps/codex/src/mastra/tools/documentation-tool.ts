import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Technical Documentation Generator Tool
 * 
 * Generates comprehensive technical documentation for code, APIs, and projects.
 */
export const documentationTool = createTool({
  id: 'documentation-generator',
  description: 'Generate comprehensive technical documentation for code, APIs, and projects',
  inputSchema: z.object({
    type: z.enum([
      'api-docs',
      'readme',
      'code-comments',
      'user-guide',
      'architecture',
      'deployment',
      'changelog',
      'contributing'
    ]).describe('Type of documentation to generate'),
    content: z.string().describe('Source content (code, API spec, project info, etc.)'),
    format: z.enum(['markdown', 'html', 'json', 'yaml']).default('markdown').describe('Output format'),
    audience: z.enum(['developer', 'user', 'admin', 'contributor']).default('developer').describe('Target audience'),
    includeExamples: z.boolean().default(true).describe('Include code examples and usage samples'),
    language: z.string().optional().describe('Programming language for code documentation'),
  }),
  outputSchema: z.object({
    documentation: z.string().describe('Generated documentation'),
    sections: z.array(z.object({
      title: z.string(),
      content: z.string(),
      level: z.number(),
    })).describe('Documentation sections'),
    metadata: z.object({
      wordCount: z.number(),
      estimatedReadTime: z.number(),
      lastUpdated: z.string(),
    }).describe('Documentation metadata'),
  }),
  execute: async ({ context }) => {
    const { type, content, format, audience, includeExamples, language } = context;
    
    const result = await generateDocumentation({
      type,
      content,
      format,
      audience,
      includeExamples,
      language,
    });
    
    return result;
  },
});

/**
 * API Documentation Tool
 * 
 * Specialized tool for generating API documentation from OpenAPI specs or code.
 */
export const apiDocumentationTool = createTool({
  id: 'api-documentation',
  description: 'Generate API documentation from OpenAPI specs, code, or descriptions',
  inputSchema: z.object({
    source: z.enum(['openapi', 'code', 'description']).describe('Source type for API documentation'),
    content: z.string().describe('API specification, code, or description'),
    includeExamples: z.boolean().default(true).describe('Include request/response examples'),
    includeSDK: z.boolean().default(false).describe('Include SDK generation examples'),
    authType: z.enum(['none', 'api-key', 'bearer', 'oauth2', 'basic']).optional().describe('Authentication type'),
    baseUrl: z.string().optional().describe('API base URL'),
  }),
  outputSchema: z.object({
    documentation: z.string().describe('Generated API documentation'),
    endpoints: z.array(z.object({
      method: z.string(),
      path: z.string(),
      description: z.string(),
      parameters: z.array(z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
        description: z.string(),
      })),
      responses: z.array(z.object({
        status: z.number(),
        description: z.string(),
        example: z.string().optional(),
      })),
    })).describe('API endpoints information'),
    examples: z.record(z.string()).optional().describe('Code examples for different languages'),
  }),
  execute: async ({ context }) => {
    const { source, content, includeExamples, includeSDK, authType, baseUrl } = context;
    
    const result = await generateAPIDocumentation({
      source,
      content,
      includeExamples,
      includeSDK,
      authType,
      baseUrl,
    });
    
    return result;
  },
});

/**
 * Code Comment Generator Tool
 * 
 * Automatically generates comprehensive comments and documentation for code.
 */
export const codeCommentTool = createTool({
  id: 'code-comments',
  description: 'Generate comprehensive comments and documentation for code',
  inputSchema: z.object({
    code: z.string().describe('Source code to document'),
    language: z.string().describe('Programming language'),
    style: z.enum(['jsdoc', 'sphinx', 'rustdoc', 'javadoc', 'xmldoc']).optional().describe('Documentation style'),
    includeTypes: z.boolean().default(true).describe('Include type information in comments'),
    includeExamples: z.boolean().default(true).describe('Include usage examples'),
    verbosity: z.enum(['minimal', 'standard', 'comprehensive']).default('standard').describe('Comment verbosity level'),
  }),
  outputSchema: z.object({
    documentedCode: z.string().describe('Code with added documentation'),
    extractedDocs: z.string().describe('Extracted documentation in markdown format'),
    summary: z.string().describe('Code summary and overview'),
    functions: z.array(z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string(),
      })),
      returns: z.string(),
      examples: z.array(z.string()),
    })).describe('Documented functions'),
  }),
  execute: async ({ context }) => {
    const { code, language, style, includeTypes, includeExamples, verbosity } = context;
    
    const result = await generateCodeComments({
      code,
      language,
      style,
      includeTypes,
      includeExamples,
      verbosity,
    });
    
    return result;
  },
});

// Helper functions for documentation generation

async function generateDocumentation(params: {
  type: string;
  content: string;
  format: string;
  audience: string;
  includeExamples: boolean;
  language?: string;
}) {
  const { type, content, format, audience, includeExamples, language } = params;
  
  let documentation = '';
  const sections: Array<{ title: string; content: string; level: number }> = [];
  
  switch (type) {
    case 'readme':
      documentation = generateReadme(content, includeExamples);
      sections.push(
        { title: 'Overview', content: 'Project overview and description', level: 1 },
        { title: 'Installation', content: 'Installation instructions', level: 2 },
        { title: 'Usage', content: 'Usage examples and guides', level: 2 },
        { title: 'API Reference', content: 'API documentation', level: 2 },
        { title: 'Contributing', content: 'Contribution guidelines', level: 2 }
      );
      break;
      
    case 'api-docs':
      documentation = await generateAPIDocumentation({
        source: 'description',
        content,
        includeExamples,
        includeSDK: false,
      }).then(result => result.documentation);
      break;
      
    case 'architecture':
      documentation = generateArchitectureDoc(content);
      sections.push(
        { title: 'System Overview', content: 'High-level system architecture', level: 1 },
        { title: 'Components', content: 'System components and their responsibilities', level: 2 },
        { title: 'Data Flow', content: 'Data flow and interactions', level: 2 },
        { title: 'Deployment', content: 'Deployment architecture', level: 2 }
      );
      break;
      
    default:
      documentation = `# ${type.charAt(0).toUpperCase() + type.slice(1)} Documentation\n\n${content}`;
  }
  
  const wordCount = documentation.split(/\s+/).length;
  const estimatedReadTime = Math.ceil(wordCount / 200); // Average reading speed
  
  return {
    documentation: typeof documentation === 'string' ? documentation : await documentation,
    sections,
    metadata: {
      wordCount,
      estimatedReadTime,
      lastUpdated: new Date().toISOString(),
    },
  };
}

async function generateAPIDocumentation(params: {
  source: string;
  content: string;
  includeExamples: boolean;
  includeSDK: boolean;
  authType?: string;
  baseUrl?: string;
}) {
  const { content, includeExamples, authType, baseUrl } = params;
  
  // Simplified API documentation generation
  const documentation = `# API Documentation

## Overview
${content}

## Base URL
\`${baseUrl || 'https://api.example.com'}\`

## Authentication
${authType ? `This API uses ${authType} authentication.` : 'No authentication required.'}

## Endpoints

### GET /example
Returns example data.

**Parameters:**
- \`id\` (string, required): The ID of the resource

**Response:**
\`\`\`json
{
  "id": "123",
  "data": "example"
}
\`\`\`

${includeExamples ? `
## Examples

### cURL
\`\`\`bash
curl -X GET "${baseUrl || 'https://api.example.com'}/example?id=123" \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

### JavaScript
\`\`\`javascript
const response = await fetch('${baseUrl || 'https://api.example.com'}/example?id=123', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const data = await response.json();
\`\`\`
` : ''}`;
  
  const endpoints = [
    {
      method: 'GET',
      path: '/example',
      description: 'Returns example data',
      parameters: [
        {
          name: 'id',
          type: 'string',
          required: true,
          description: 'The ID of the resource',
        },
      ],
      responses: [
        {
          status: 200,
          description: 'Successful response',
          example: '{"id": "123", "data": "example"}',
        },
      ],
    },
  ];
  
  return {
    documentation,
    endpoints,
    examples: includeExamples ? {
      curl: `curl -X GET "${baseUrl || 'https://api.example.com'}/example?id=123"`,
      javascript: `fetch('${baseUrl || 'https://api.example.com'}/example?id=123')`,
    } : undefined,
  };
}

async function generateCodeComments(params: {
  code: string;
  language: string;
  style?: string;
  includeTypes: boolean;
  includeExamples: boolean;
  verbosity: string;
}) {
  const { code, language, includeTypes, includeExamples, verbosity } = params;
  
  // Simplified code comment generation
  const documentedCode = `/**
 * ${verbosity === 'comprehensive' ? 'Comprehensive documentation for the following code:' : 'Documentation:'}
 * 
 * This code implements the main functionality.
 * ${includeTypes ? '* @param {string} input - The input parameter' : ''}
 * ${includeTypes ? '* @returns {string} The processed result' : ''}
 * 
 * ${includeExamples ? '@example\n * const result = processInput("test");\n * console.log(result); // "processed: test"' : ''}
 */
${code}`;
  
  const extractedDocs = `# Code Documentation

## Overview
This code provides functionality for processing input data.

## Functions

### processInput
Processes the input and returns a formatted result.

${includeExamples ? `
## Examples
\`\`\`${language}
const result = processInput("test");
console.log(result); // "processed: test"
\`\`\`
` : ''}`;
  
  return {
    documentedCode,
    extractedDocs,
    summary: 'Code provides input processing functionality with proper error handling.',
    functions: [
      {
        name: 'processInput',
        description: 'Processes input data and returns formatted result',
        parameters: [
          {
            name: 'input',
            type: 'string',
            description: 'The input data to process',
          },
        ],
        returns: 'Formatted string result',
        examples: includeExamples ? ['processInput("test")'] : [],
      },
    ],
  };
}

function generateReadme(content: string, includeExamples: boolean): string {
  return `# Project Name

## Description
${content}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

${includeExamples ? `
### Basic Example
\`\`\`javascript
const project = require('./index');
project.run();
\`\`\`

### Advanced Usage
\`\`\`javascript
const project = require('./index');
project.configure({
  option1: 'value1',
  option2: 'value2'
});
project.run();
\`\`\`
` : 'See the documentation for usage instructions.'}

## API Reference

Coming soon...

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License`;
}

function generateArchitectureDoc(content: string): string {
  return `# System Architecture

## Overview
${content}

## System Components

### Frontend
- User interface and client-side logic
- Built with modern web technologies
- Responsive design for multiple devices

### Backend
- API server and business logic
- Database integration
- Authentication and authorization

### Database
- Data storage and retrieval
- Optimized for performance
- Backup and recovery systems

## Data Flow

1. User interacts with frontend
2. Frontend sends requests to backend API
3. Backend processes requests and queries database
4. Results are returned to frontend
5. Frontend updates user interface

## Deployment Architecture

### Production Environment
- Load balancer for high availability
- Multiple application servers
- Database cluster with replication
- CDN for static assets

### Development Environment
- Local development servers
- Test databases
- Continuous integration pipeline

## Security Considerations

- HTTPS encryption for all communications
- Authentication and authorization mechanisms
- Input validation and sanitization
- Regular security audits and updates`;
}
