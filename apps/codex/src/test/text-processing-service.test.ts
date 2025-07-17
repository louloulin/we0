/**
 * Text Processing Service Tests
 * 
 * Tests for text processing and analysis functionality
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { TextProcessingService, analyzeText, formatText } from '../mastra/services/text-processing-service';

describe('TextProcessingService', () => {
  let service: TextProcessingService;

  beforeEach(() => {
    service = new TextProcessingService();
  });

  describe('text analysis', () => {
    test('should analyze simple text correctly', () => {
      const text = 'Hello world. This is a test sentence. How are you today?';
      const analysis = service.analyzeText(text);

      expect(analysis.wordCount).toBe(11); // Corrected count
      expect(analysis.characterCount).toBe(text.length);
      expect(analysis.sentenceCount).toBe(3);
      expect(analysis.paragraphCount).toBe(1);
      expect(analysis.averageWordsPerSentence).toBeCloseTo(3.67, 1);
      expect(analysis.readabilityScore).toBeDefined();
    });

    test('should handle empty text', () => {
      const analysis = service.analyzeText('');

      expect(analysis.wordCount).toBe(0);
      expect(analysis.characterCount).toBe(0);
      expect(analysis.sentenceCount).toBe(0);
      expect(analysis.paragraphCount).toBe(0);
      expect(analysis.averageWordsPerSentence).toBe(0);
    });

    test('should handle null/undefined text', () => {
      const analysis1 = service.analyzeText(null as any);
      const analysis2 = service.analyzeText(undefined as any);

      expect(analysis1.wordCount).toBe(0);
      expect(analysis2.wordCount).toBe(0);
    });

    test('should count paragraphs correctly', () => {
      const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const analysis = service.analyzeText(text);

      expect(analysis.paragraphCount).toBe(3);
    });

    test('should calculate readability score', () => {
      const simpleText = 'The cat sat on the mat. It was a nice day.';
      const complexText = 'The implementation of sophisticated algorithms requires comprehensive understanding of computational complexity theory and advanced mathematical concepts.';

      const simpleAnalysis = service.analyzeText(simpleText);
      const complexAnalysis = service.analyzeText(complexText);

      expect(simpleAnalysis.readabilityScore).toBeGreaterThan(complexAnalysis.readabilityScore);
    });
  });

  describe('text formatting', () => {
    test('should remove extra whitespace', () => {
      const text = 'Hello    world   with   extra   spaces';
      const formatted = service.formatText(text, { removeExtraWhitespace: true });

      expect(formatted).toBe('Hello world with extra spaces');
    });

    test('should normalize line breaks', () => {
      const text = 'Line 1\r\nLine 2\rLine 3\nLine 4';
      const formatted = service.formatText(text, { normalizeLineBreaks: true });

      expect(formatted).toBe('Line 1\nLine 2\nLine 3\nLine 4');
    });

    test('should trim lines', () => {
      const text = '  Line 1  \n  Line 2  \n  Line 3  ';
      const formatted = service.formatText(text, { trimLines: true });

      expect(formatted).toBe('Line 1\nLine 2\nLine 3');
    });

    test('should remove empty lines', () => {
      const text = 'Line 1\n\nLine 2\n\n\nLine 3';
      const formatted = service.formatText(text, { removeEmptyLines: true });

      expect(formatted).toBe('Line 1\nLine 2\nLine 3');
    });

    test('should convert case', () => {
      const text = 'Hello World';
      const lower = service.formatText(text, { convertToLowercase: true });
      const upper = service.formatText(text, { convertToUppercase: true });

      expect(lower).toBe('hello world');
      expect(upper).toBe('HELLO WORLD');
    });

    test('should remove special characters', () => {
      const text = 'Hello @#$% World! How are you?';
      const formatted = service.formatText(text, { removeSpecialCharacters: true });

      expect(formatted).toBe('Hello  World! How are you?');
    });

    test('should preserve URLs when requested', () => {
      const text = 'Visit https://example.com for more info';
      const formatted = service.formatText(text, { 
        removeSpecialCharacters: true, 
        preserveUrls: true 
      });

      expect(formatted).toContain('https://example.com');
    });

    test('should preserve emails when requested', () => {
      const text = 'Contact us at test@example.com for help';
      const formatted = service.formatText(text, { 
        removeSpecialCharacters: true, 
        preserveEmails: true 
      });

      expect(formatted).toContain('test@example.com');
    });

    test('should apply multiple formatting options', () => {
      const text = '  Hello    world  \n\n  How   are   you?  ';
      const formatted = service.formatText(text, {
        removeExtraWhitespace: true,
        trimLines: true,
        removeEmptyLines: true,
      });

      expect(formatted).toBe('Hello world\nHow are you?');
    });
  });

  describe('code extraction', () => {
    test('should extract code blocks', () => {
      const text = `
Here's some JavaScript:

\`\`\`javascript
function hello() {
  console.log('Hello world');
}
\`\`\`

And some Python:

\`\`\`python
def hello():
    print("Hello world")
\`\`\`
      `;

      const result = service.extractCode(text);

      expect(result.codeBlocks).toHaveLength(2);
      expect(result.codeBlocks[0].language).toBe('javascript');
      expect(result.codeBlocks[0].code).toContain('function hello()');
      expect(result.codeBlocks[1].language).toBe('python');
      expect(result.codeBlocks[1].code).toContain('def hello()');
      expect(result.totalCodeLines).toBeGreaterThan(0);
    });

    test('should extract inline code', () => {
      const text = 'Use `console.log()` to print and `Array.map()` to transform arrays.';
      const result = service.extractCode(text);

      expect(result.inlineCode).toHaveLength(2);
      expect(result.inlineCode).toContain('console.log()');
      expect(result.inlineCode).toContain('Array.map()');
    });

    test('should handle text without code', () => {
      const text = 'This is just regular text without any code.';
      const result = service.extractCode(text);

      expect(result.codeBlocks).toHaveLength(0);
      expect(result.inlineCode).toHaveLength(0);
      expect(result.totalCodeLines).toBe(0);
    });
  });

  describe('text summarization', () => {
    test('should generate summary for long text', () => {
      const text = `
        Artificial intelligence is transforming the world. Machine learning algorithms can process vast amounts of data.
        Deep learning networks are particularly effective for image recognition. Natural language processing helps computers understand human language.
        Computer vision enables machines to interpret visual information. Robotics combines AI with physical systems.
        The future of AI looks very promising. Many industries are adopting AI technologies.
      `;

      const summary = service.generateSummary(text, 3);

      expect(summary.keyPoints).toHaveLength(3);
      expect(summary.summary.length).toBeLessThan(text.length);
      expect(summary.compressionRatio).toBeLessThan(1);
      expect(summary.originalLength).toBe(text.length);
    });

    test('should return original text if shorter than max sentences', () => {
      const text = 'Short text. Only two sentences.';
      const summary = service.generateSummary(text, 5);

      expect(summary.summary).toBe(text);
      expect(summary.compressionRatio).toBe(1);
    });

    test('should handle empty text', () => {
      const summary = service.generateSummary('');

      expect(summary.originalLength).toBe(0);
      expect(summary.summaryLength).toBe(0);
      expect(summary.keyPoints).toHaveLength(0);
      expect(summary.summary).toBe('');
    });
  });

  describe('URL and email extraction', () => {
    test('should extract URLs', () => {
      const text = 'Visit https://example.com and http://test.org for more info.';
      const urls = service.extractUrls(text);

      expect(urls).toHaveLength(2);
      expect(urls).toContain('https://example.com');
      expect(urls).toContain('http://test.org');
    });

    test('should extract email addresses', () => {
      const text = 'Contact us at support@example.com or admin@test.org.';
      const emails = service.extractEmails(text);

      expect(emails).toHaveLength(2);
      expect(emails).toContain('support@example.com');
      expect(emails).toContain('admin@test.org');
    });

    test('should handle text without URLs or emails', () => {
      const text = 'This text has no URLs or email addresses.';
      const urls = service.extractUrls(text);
      const emails = service.extractEmails(text);

      expect(urls).toHaveLength(0);
      expect(emails).toHaveLength(0);
    });
  });

  describe('pattern operations', () => {
    test('should count patterns', () => {
      const text = 'The cat and the dog and the bird.';
      const count = service.countPatterns(text, /the/gi);

      expect(count).toBe(3);
    });

    test('should replace patterns', () => {
      const text = 'Hello world, hello universe!';
      const replaced = service.replacePatterns(text, /hello/gi, 'hi');

      expect(replaced).toBe('hi world, hi universe!');
    });
  });

  describe('text validation', () => {
    test('should validate good text', () => {
      const text = 'This is a well-written text with proper sentence structure. It has good readability and appropriate length.';
      const validation = service.validateText(text);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    test('should detect short text', () => {
      const text = 'Too short.';
      const validation = service.validateText(text);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('short'))).toBe(true);
    });

    test('should detect long sentences', () => {
      const text = 'This is an extremely long sentence that goes on and on without any breaks or pauses and contains way too many words for good readability and should be broken down into smaller more manageable sentences.';
      const validation = service.validateText(text);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('long'))).toBe(true);
    });

    test('should detect high repetition', () => {
      const text = 'The the the the the the the the the the.';
      const validation = service.validateText(text);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('repetition'))).toBe(true);
    });

    test('should handle empty text', () => {
      const validation = service.validateText('');

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('empty'))).toBe(true);
    });
  });

  describe('convenience functions', () => {
    test('analyzeText should work', () => {
      const text = 'Hello world. This is a test.';
      const analysis = analyzeText(text);

      expect(analysis.wordCount).toBeGreaterThan(0);
      expect(analysis.sentenceCount).toBe(2);
    });

    test('formatText should work', () => {
      const text = '  Hello   world  ';
      const formatted = formatText(text, { removeExtraWhitespace: true });

      expect(formatted).toBe('Hello world');
    });
  });
});
