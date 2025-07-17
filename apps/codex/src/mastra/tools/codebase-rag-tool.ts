import { createTool } from '@mastra/core/tools';
import { createVectorQueryTool } from '@mastra/rag';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

/**
 * Codebase RAG Tool
 * 
 * Provides semantic search capabilities over a codebase using RAG (Retrieval-Augmented Generation).
 * This tool allows DeepSeek agents to search through code files, documentation, and related materials
 * to provide contextually relevant responses.
 */

// Create a vector query tool for codebase search
export const codebaseVectorQueryTool = createVectorQueryTool({
  vectorStoreName: 'libsql', // Using LibSQL as the vector store
  indexName: 'codebase_embeddings',
  model: openai.embedding('text-embedding-3-small'),
  databaseConfig: {
    libsql: {
      minScore: 0.7, // Filter out low-relevance results
    },
  },
});

/**
 * Enhanced Codebase Search Tool
 * 
 * Provides advanced search capabilities with filtering and context enhancement.
 */
export const codebaseSearchTool = createTool({
  id: 'codebase-search',
  description: 'Search through codebase files, documentation, and related materials using semantic search',
  inputSchema: z.object({
    query: z.string().describe('Search query describing what you are looking for'),
    fileTypes: z.array(z.string()).optional().describe('Filter by file types (e.g., [".ts", ".js", ".md"])'),
    directories: z.array(z.string()).optional().describe('Filter by specific directories (e.g., ["src/", "docs/"])'),
    maxResults: z.number().default(10).describe('Maximum number of results to return'),
    includeContext: z.boolean().default(true).describe('Include surrounding code context'),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      file: z.string().describe('File path'),
      content: z.string().describe('Relevant code or content'),
      score: z.number().describe('Relevance score'),
      lineNumbers: z.object({
        start: z.number(),
        end: z.number(),
      }).optional().describe('Line number range'),
      context: z.string().optional().describe('Surrounding context'),
    })),
    summary: z.string().describe('Summary of search results'),
    suggestions: z.array(z.string()).describe('Suggested follow-up searches'),
  }),
  execute: async ({ context }) => {
    const { query, fileTypes, directories, maxResults, includeContext } = context;
    
    try {
      // Build metadata filter based on input parameters
      const filter: any = {};
      
      if (fileTypes && fileTypes.length > 0) {
        filter.fileType = { $in: fileTypes };
      }
      
      if (directories && directories.length > 0) {
        filter.directory = { $in: directories };
      }
      
      // Perform vector search using the vector query tool
      const vectorResults = await codebaseVectorQueryTool.execute({
        context: {
          queryText: query,
          topK: maxResults,
          filter,
        },
      });
      
      // Process and enhance results
      const enhancedResults = vectorResults.results.map((result: any) => {
        const metadata = result.metadata || {};
        
        return {
          file: metadata.filePath || 'unknown',
          content: result.text || '',
          score: result.score || 0,
          lineNumbers: metadata.lineNumbers ? {
            start: metadata.lineNumbers.start,
            end: metadata.lineNumbers.end,
          } : undefined,
          context: includeContext ? metadata.context : undefined,
        };
      });
      
      // Generate summary and suggestions
      const summary = generateSearchSummary(query, enhancedResults);
      const suggestions = generateSearchSuggestions(query, enhancedResults);
      
      return {
        results: enhancedResults,
        summary,
        suggestions,
      };
      
    } catch (error) {
      console.error('Error in codebase search:', error);
      return {
        results: [],
        summary: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestions: ['Try a different search query', 'Check if the codebase has been indexed'],
      };
    }
  },
});

/**
 * Code Documentation Search Tool
 * 
 * Specialized tool for searching through code documentation and comments.
 */
export const codeDocumentationSearchTool = createTool({
  id: 'code-documentation-search',
  description: 'Search through code documentation, comments, and README files',
  inputSchema: z.object({
    query: z.string().describe('Documentation search query'),
    docTypes: z.array(z.enum(['readme', 'comments', 'jsdoc', 'api-docs'])).optional().describe('Types of documentation to search'),
    maxResults: z.number().default(5).describe('Maximum number of results'),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      file: z.string(),
      content: z.string(),
      type: z.string().describe('Type of documentation (readme, comment, etc.)'),
      score: z.number(),
    })),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { query, docTypes, maxResults } = context;
    
    // Build filter for documentation types
    const filter: any = {};
    if (docTypes && docTypes.length > 0) {
      filter.documentationType = { $in: docTypes };
    } else {
      // Default to searching documentation-related content
      filter.documentationType = { $in: ['readme', 'comments', 'jsdoc', 'api-docs'] };
    }
    
    try {
      const vectorResults = await codebaseVectorQueryTool.execute({
        context: {
          queryText: query,
          topK: maxResults,
          filter,
        },
      });
      
      const results = vectorResults.results.map((result: any) => ({
        file: result.metadata?.filePath || 'unknown',
        content: result.text || '',
        type: result.metadata?.documentationType || 'unknown',
        score: result.score || 0,
      }));
      
      const summary = `Found ${results.length} documentation entries related to "${query}"`;
      
      return {
        results,
        summary,
      };
      
    } catch (error) {
      return {
        results: [],
        summary: `Documentation search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

// Helper functions
function generateSearchSummary(query: string, results: any[]): string {
  if (results.length === 0) {
    return `No results found for "${query}". Try broadening your search terms or checking if the codebase has been indexed.`;
  }
  
  const fileCount = new Set(results.map(r => r.file)).size;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  return `Found ${results.length} relevant code snippets across ${fileCount} files for "${query}". Average relevance score: ${avgScore.toFixed(2)}.`;
}

function generateSearchSuggestions(query: string, results: any[]): string[] {
  const suggestions: string[] = [];
  
  if (results.length === 0) {
    suggestions.push('Try using different keywords');
    suggestions.push('Search for related concepts or synonyms');
    suggestions.push('Check specific file types or directories');
  } else {
    // Extract common patterns from results to suggest related searches
    const files = results.map(r => r.file);
    const commonDirs = extractCommonDirectories(files);
    
    if (commonDirs.length > 0) {
      suggestions.push(`Search within ${commonDirs[0]} directory`);
    }
    
    suggestions.push('Search for related functions or classes');
    suggestions.push('Look for usage examples or tests');
  }
  
  return suggestions.slice(0, 3); // Limit to 3 suggestions
}

function extractCommonDirectories(filePaths: string[]): string[] {
  const dirCounts: Record<string, number> = {};
  
  filePaths.forEach(path => {
    const parts = path.split('/');
    if (parts.length > 1) {
      const dir = parts.slice(0, -1).join('/');
      dirCounts[dir] = (dirCounts[dir] || 0) + 1;
    }
  });
  
  return Object.entries(dirCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([dir]) => dir)
    .slice(0, 3);
}
