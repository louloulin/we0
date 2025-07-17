/**
 * File Processing Tests
 * 
 * Tests for message parsing and file processing utilities
 */

import { describe, test, expect } from '@jest/globals';
import { 
  parseMessage, 
  isFileExcluded, 
  extractFileActions, 
  validateArtifactContent,
  cleanFilePath,
  getFileExtension,
  isCodeFile,
  estimateFileComplexity
} from '../mastra/utils/message-parser';
import { 
  processFiles, 
  determineProjectType, 
  filterFiles, 
  getFileStatistics, 
  validateFiles 
} from '../mastra/utils/file-processor';

describe('Message Parser', () => {
  describe('parseMessage', () => {
    test('should parse simple message without boltArtifact', () => {
      const content = 'This is a simple message';
      const result = parseMessage(content);
      
      expect(result.content).toBe(content);
      expect(result.files).toBeUndefined();
    });

    test('should parse message with boltArtifact and extract files', () => {
      const content = `
Here's your code:

<boltArtifact id="test" title="Test Project">
<boltAction type="file" filePath="src/index.js">
console.log('Hello World');
</boltAction>
<boltAction type="file" filePath="src/utils.js">
export function helper() {
  return 'helper';
}
</boltAction>
</boltArtifact>

That's it!
      `.trim();
      
      const result = parseMessage(content);
      
      expect(result.content).toContain('已经修改好了的目录');
      expect(result.files).toBeDefined();
      expect(result.files!['src/index.js']).toBe("console.log('Hello World');");
      expect(result.files!['src/utils.js']).toBe("export function helper() {\n  return 'helper';\n}");
    });

    test('should exclude files in exclude list', () => {
      const content = `
<boltArtifact id="test" title="Test">
<boltAction type="file" filePath="components/weicon/base64.js">
// This should be excluded
</boltAction>
<boltAction type="file" filePath="src/main.js">
// This should be included
</boltAction>
</boltArtifact>
      `.trim();
      
      const result = parseMessage(content);
      
      expect(result.files).toBeDefined();
      expect(result.files!['components/weicon/base64.js']).toBeUndefined();
      expect(result.files!['src/main.js']).toBe('// This should be included');
    });
  });

  describe('isFileExcluded', () => {
    test('should exclude exact matches', () => {
      expect(isFileExcluded('components/weicon/base64.js')).toBe(true);
      expect(isFileExcluded('src/main.js')).toBe(false);
    });

    test('should exclude glob patterns', () => {
      expect(isFileExcluded('node_modules/react/index.js')).toBe(true);
      expect(isFileExcluded('dist/bundle.js')).toBe(true);
      expect(isFileExcluded('src/components/Button.js')).toBe(false);
    });

    test('should exclude log files', () => {
      expect(isFileExcluded('debug.log')).toBe(true);
      expect(isFileExcluded('error.log')).toBe(true);
      expect(isFileExcluded('app.js')).toBe(false);
    });
  });

  describe('extractFileActions', () => {
    test('should extract all file actions', () => {
      const artifactContent = `
<boltAction type="file" filePath="src/index.js">
console.log('test');
</boltAction>
<boltAction type="file" filePath="src/utils.js">
export const utils = {};
</boltAction>
      `.trim();
      
      const actions = extractFileActions(artifactContent);
      
      expect(actions).toHaveLength(2);
      expect(actions[0].filePath).toBe('src/index.js');
      expect(actions[1].filePath).toBe('src/utils.js');
    });
  });

  describe('validateArtifactContent', () => {
    test('should validate correct artifact content', () => {
      const content = `
<boltArtifact id="test">
<boltAction type="file" filePath="test.js">
console.log('test');
</boltAction>
</boltArtifact>
      `.trim();
      
      expect(validateArtifactContent(content)).toBe(true);
    });

    test('should reject invalid artifact content', () => {
      const content = 'No artifact here';
      expect(validateArtifactContent(content)).toBe(false);
    });
  });

  describe('utility functions', () => {
    test('cleanFilePath should normalize paths', () => {
      expect(cleanFilePath('/src/index.js')).toBe('src/index.js');
      expect(cleanFilePath('//src//utils.js')).toBe('src/utils.js');
      expect(cleanFilePath('  src/main.js  ')).toBe('src/main.js');
    });

    test('getFileExtension should extract extensions', () => {
      expect(getFileExtension('index.js')).toBe('js');
      expect(getFileExtension('style.css')).toBe('css');
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('path/to/file.tsx')).toBe('tsx');
    });

    test('isCodeFile should identify code files', () => {
      expect(isCodeFile('index.js')).toBe(true);
      expect(isCodeFile('style.css')).toBe(true);
      expect(isCodeFile('README.md')).toBe(true);
      expect(isCodeFile('image.png')).toBe(false);
      expect(isCodeFile('video.mp4')).toBe(false);
    });

    test('estimateFileComplexity should calculate complexity', () => {
      const simpleCode = 'console.log("hello");';
      const complexCode = `
import React from 'react';
import { useState } from 'react';

function Component() {
  const [state, setState] = useState(0);
  
  const handleClick = () => {
    setState(state + 1);
  };
  
  return <div onClick={handleClick}>{state}</div>;
}

export default Component;
      `.trim();
      
      expect(estimateFileComplexity(simpleCode)).toBeLessThan(estimateFileComplexity(complexCode));
      expect(estimateFileComplexity(complexCode)).toBeGreaterThan(0);
    });
  });
});

describe('File Processor', () => {
  describe('processFiles', () => {
    test('should process messages and extract files', () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'Please create a simple app'
        },
        {
          role: 'assistant' as const,
          content: `
<boltArtifact id="app" title="Simple App">
<boltAction type="file" filePath="src/index.js">
console.log('Hello World');
</boltAction>
<boltAction type="file" filePath="src/style.css">
body { margin: 0; }
</boltAction>
</boltArtifact>
          `.trim()
        }
      ];
      
      const result = processFiles(messages);
      
      expect(result.fileCount).toBe(2);
      expect(result.files['src/index.js']).toBe("console.log('Hello World');");
      expect(result.files['src/style.css']).toBe('body { margin: 0; }');
      expect(result.allContent).toContain('Hello World');
    });

    test('should clear text when clearText is true', () => {
      const messages = [
        {
          role: 'user' as const,
          content: `
<boltArtifact id="test">
<boltAction type="file" filePath="test.js">
console.log('test');
</boltAction>
</boltArtifact>
          `.trim()
        }
      ];
      
      const result = processFiles(messages, true);
      
      expect(result.allContent).not.toContain('[user]:');
      expect(result.allContent).toContain('// File: test.js');
    });
  });

  describe('determineProjectType', () => {
    test('should detect mini program projects', () => {
      const files = {
        'app.json': '{}',
        'pages/index/index.js': 'Page({})',
        'pages/index/index.wxml': '<view>Hello</view>'
      };
      
      expect(determineProjectType(files)).toBe('miniProgram');
    });

    test('should detect web projects', () => {
      const files = {
        'package.json': '{"dependencies": {"react": "^18.0.0"}}',
        'src/App.jsx': 'function App() { return <div>Hello</div>; }',
        'public/index.html': '<html></html>'
      };
      
      expect(determineProjectType(files)).toBe('web');
    });

    test('should detect backend projects', () => {
      const files = {
        'server.js': 'const express = require("express");',
        'package.json': '{"dependencies": {"express": "^4.0.0"}}'
      };
      
      expect(determineProjectType(files)).toBe('backend');
    });

    test('should default to other for unknown projects', () => {
      const files = {
        'README.md': '# My Project',
        'data.txt': 'Some data'
      };
      
      expect(determineProjectType(files)).toBe('other');
    });
  });

  describe('filterFiles', () => {
    const testFiles = {
      'src/index.js': 'console.log("js");',
      'src/style.css': 'body {}',
      'README.md': '# Project',
      'image.png': 'binary data'
    };

    test('should filter by extensions', () => {
      const result = filterFiles(testFiles, { extensions: ['js', 'css'] });
      
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['src/index.js']).toBeDefined();
      expect(result['src/style.css']).toBeDefined();
    });

    test('should filter code files only', () => {
      const result = filterFiles(testFiles, { codeOnly: true });
      
      expect(Object.keys(result)).toHaveLength(3);
      expect(result['image.png']).toBeUndefined();
    });

    test('should filter by include patterns', () => {
      const result = filterFiles(testFiles, { includePatterns: ['src/.*'] });
      
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['src/index.js']).toBeDefined();
      expect(result['src/style.css']).toBeDefined();
    });

    test('should filter by exclude patterns', () => {
      const result = filterFiles(testFiles, { excludePatterns: ['.*\\.png$'] });
      
      expect(Object.keys(result)).toHaveLength(3);
      expect(result['image.png']).toBeUndefined();
    });
  });

  describe('getFileStatistics', () => {
    test('should calculate file statistics', () => {
      const files = {
        'index.js': 'console.log("hello");',
        'style.css': 'body { margin: 0; }',
        'README.md': '# Project\n\nDescription'
      };
      
      const stats = getFileStatistics(files);
      
      expect(stats.totalFiles).toBe(3);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.fileTypes.js).toBe(1);
      expect(stats.fileTypes.css).toBe(1);
      expect(stats.fileTypes.md).toBe(1);
      expect(stats.averageSize).toBeGreaterThan(0);
    });
  });

  describe('validateFiles', () => {
    test('should validate correct files', () => {
      const files = {
        'index.js': 'console.log("hello");',
        'style.css': 'body { margin: 0; }'
      };
      
      const validation = validateFiles(files);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.fileCount).toBe(2);
    });

    test('should detect empty file collection', () => {
      const validation = validateFiles({});
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No files found to process');
    });

    test('should warn about empty files', () => {
      const files = {
        'empty.js': '',
        'normal.js': 'console.log("hello");'
      };
      
      const validation = validateFiles(files);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.includes('empty.js'))).toBe(true);
    });
  });
});
