/**
 * Text Processing Service
 * 
 * Provides advanced text processing and analysis capabilities
 * Including text cleaning, formatting, analysis, and transformation
 */

export interface TextAnalysis {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  readabilityScore?: number;
  language?: string;
}

export interface TextSummary {
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  keyPoints: string[];
  summary: string;
}

export interface TextFormatOptions {
  removeExtraWhitespace?: boolean;
  normalizeLineBreaks?: boolean;
  trimLines?: boolean;
  removeEmptyLines?: boolean;
  convertToLowercase?: boolean;
  convertToUppercase?: boolean;
  removeSpecialCharacters?: boolean;
  preserveUrls?: boolean;
  preserveEmails?: boolean;
}

export interface CodeExtractionResult {
  codeBlocks: Array<{
    language: string;
    code: string;
    startLine: number;
    endLine: number;
  }>;
  inlineCode: string[];
  totalCodeLines: number;
}

/**
 * Text Processing Service Class
 * Handles various text processing and analysis operations
 */
export class TextProcessingService {
  private readonly urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  private readonly emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  private readonly codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/gi;
  private readonly inlineCodeRegex = /`([^`]+)`/gi;

  constructor() {}

  /**
   * Analyze text and return comprehensive statistics
   */
  analyzeText(text: string): TextAnalysis {
    if (!text || typeof text !== 'string') {
      return {
        wordCount: 0,
        characterCount: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        averageWordsPerSentence: 0,
      };
    }

    const characterCount = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Count sentences (rough approximation)
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const sentenceCount = sentences.length;
    
    // Count paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0);
    const paragraphCount = paragraphs.length;
    
    const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    
    // Simple readability score (Flesch Reading Ease approximation)
    const averageSentenceLength = averageWordsPerSentence;
    const averageSyllablesPerWord = this.estimateSyllables(words);
    const readabilityScore = 206.835 - (1.015 * averageSentenceLength) - (84.6 * averageSyllablesPerWord);

    return {
      wordCount,
      characterCount,
      sentenceCount,
      paragraphCount,
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 100) / 100,
      readabilityScore: Math.round(readabilityScore * 100) / 100,
    };
  }

  /**
   * Estimate average syllables per word (simple approximation)
   */
  private estimateSyllables(words: string[]): number {
    if (words.length === 0) return 0;
    
    let totalSyllables = 0;
    
    for (const word of words) {
      // Simple syllable counting: count vowel groups
      const vowelGroups = word.toLowerCase().match(/[aeiouy]+/g);
      let syllables = vowelGroups ? vowelGroups.length : 1;
      
      // Adjust for silent 'e'
      if (word.toLowerCase().endsWith('e') && syllables > 1) {
        syllables--;
      }
      
      // Minimum of 1 syllable per word
      syllables = Math.max(1, syllables);
      totalSyllables += syllables;
    }
    
    return totalSyllables / words.length;
  }

  /**
   * Clean and format text according to options
   */
  formatText(text: string, options: TextFormatOptions = {}): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    let result = text;

    // Preserve URLs and emails if requested
    const preservedUrls: string[] = [];
    const preservedEmails: string[] = [];
    
    if (options.preserveUrls) {
      const urls = result.match(this.urlRegex) || [];
      urls.forEach((url, index) => {
        const placeholder = `__URL_PLACEHOLDER_${index}__`;
        preservedUrls.push(url);
        result = result.replace(url, placeholder);
      });
    }
    
    if (options.preserveEmails) {
      const emails = result.match(this.emailRegex) || [];
      emails.forEach((email, index) => {
        const placeholder = `__EMAIL_PLACEHOLDER_${index}__`;
        preservedEmails.push(email);
        result = result.replace(email, placeholder);
      });
    }

    // Apply formatting options
    if (options.removeExtraWhitespace) {
      // Replace multiple spaces/tabs with single space, but preserve line breaks
      result = result.replace(/[ \t]+/g, ' ');
    }

    if (options.normalizeLineBreaks) {
      result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }

    if (options.trimLines) {
      result = result.split('\n').map(line => line.trim()).join('\n');
    }

    if (options.removeEmptyLines) {
      result = result.split('\n').filter(line => line.trim().length > 0).join('\n');
    }

    if (options.removeSpecialCharacters) {
      // Keep alphanumeric, spaces, and basic punctuation
      result = result.replace(/[^\w\s.,!?;:()\-"']/g, '');
    }

    if (options.convertToLowercase) {
      result = result.toLowerCase();
    }

    if (options.convertToUppercase) {
      result = result.toUpperCase();
    }

    // Restore preserved content
    preservedUrls.forEach((url, index) => {
      const placeholder = `__URL_PLACEHOLDER_${index}__`;
      result = result.replace(placeholder, url);
    });
    
    preservedEmails.forEach((email, index) => {
      const placeholder = `__EMAIL_PLACEHOLDER_${index}__`;
      result = result.replace(placeholder, email);
    });

    return result.trim();
  }

  /**
   * Extract code blocks and inline code from text
   */
  extractCode(text: string): CodeExtractionResult {
    if (!text || typeof text !== 'string') {
      return {
        codeBlocks: [],
        inlineCode: [],
        totalCodeLines: 0,
      };
    }

    const codeBlocks: Array<{
      language: string;
      code: string;
      startLine: number;
      endLine: number;
    }> = [];
    
    const inlineCode: string[] = [];
    let totalCodeLines = 0;

    // Extract code blocks
    const lines = text.split('\n');
    let match;
    
    // Reset regex
    this.codeBlockRegex.lastIndex = 0;
    
    while ((match = this.codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      const codeLines = code.split('\n');
      
      // Find start line
      const beforeMatch = text.substring(0, match.index);
      const startLine = beforeMatch.split('\n').length;
      const endLine = startLine + codeLines.length - 1;
      
      codeBlocks.push({
        language,
        code,
        startLine,
        endLine,
      });
      
      totalCodeLines += codeLines.length;
    }

    // Extract inline code
    this.inlineCodeRegex.lastIndex = 0;
    
    while ((match = this.inlineCodeRegex.exec(text)) !== null) {
      inlineCode.push(match[1]);
    }

    return {
      codeBlocks,
      inlineCode,
      totalCodeLines,
    };
  }

  /**
   * Generate a simple extractive summary
   */
  generateSummary(text: string, maxSentences: number = 3): TextSummary {
    if (!text || typeof text !== 'string') {
      return {
        originalLength: 0,
        summaryLength: 0,
        compressionRatio: 0,
        keyPoints: [],
        summary: '',
      };
    }

    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    
    if (sentences.length <= maxSentences) {
      return {
        originalLength: text.length,
        summaryLength: text.length,
        compressionRatio: 1,
        keyPoints: sentences.map(s => s.trim()),
        summary: text,
      };
    }

    // Simple scoring: prefer sentences with more common words
    const wordFreq = this.calculateWordFrequency(text);
    const sentenceScores = sentences.map(sentence => {
      const words = sentence.toLowerCase().split(/\s+/);
      const score = words.reduce((sum, word) => sum + (wordFreq[word] || 0), 0) / words.length;
      return { sentence: sentence.trim(), score };
    });

    // Sort by score and take top sentences
    const topSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .map(item => item.sentence);

    const summary = topSentences.join('. ') + '.';
    const compressionRatio = summary.length / text.length;

    return {
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      keyPoints: topSentences,
      summary,
    };
  }

  /**
   * Calculate word frequency in text
   */
  private calculateWordFrequency(text: string): Record<string, number> {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2); // Filter out short words
    
    const frequency: Record<string, number> = {};
    
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
    
    return frequency;
  }

  /**
   * Extract URLs from text
   */
  extractUrls(text: string): string[] {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    return text.match(this.urlRegex) || [];
  }

  /**
   * Extract email addresses from text
   */
  extractEmails(text: string): string[] {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    return text.match(this.emailRegex) || [];
  }

  /**
   * Count specific patterns in text
   */
  countPatterns(text: string, pattern: RegExp): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    
    const matches = text.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Replace patterns in text
   */
  replacePatterns(text: string, pattern: RegExp, replacement: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text.replace(pattern, replacement);
  }

  /**
   * Validate text against common criteria
   */
  validateText(text: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!text || typeof text !== 'string') {
      issues.push('Text is empty or invalid');
      return { isValid: false, issues, suggestions };
    }

    const analysis = this.analyzeText(text);

    // Check for common issues
    if (analysis.wordCount < 10) {
      issues.push('Text is very short (less than 10 words)');
      suggestions.push('Consider adding more content for better analysis');
    }

    if (analysis.averageWordsPerSentence > 25) {
      issues.push('Sentences are too long on average');
      suggestions.push('Consider breaking long sentences into shorter ones');
    }

    if (analysis.readabilityScore && analysis.readabilityScore < 30) {
      issues.push('Text may be difficult to read');
      suggestions.push('Consider simplifying vocabulary and sentence structure');
    }

    // Check for excessive repetition
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    
    if (repetitionRatio < 0.5) {
      issues.push('High word repetition detected');
      suggestions.push('Consider using more varied vocabulary');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }
}

// Global text processing service instance
export const textProcessingService = new TextProcessingService();

/**
 * Convenience function for text analysis
 */
export function analyzeText(text: string): TextAnalysis {
  return textProcessingService.analyzeText(text);
}

/**
 * Convenience function for text formatting
 */
export function formatText(text: string, options?: TextFormatOptions): string {
  return textProcessingService.formatText(text, options);
}
