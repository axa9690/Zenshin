import OpenAI from 'openai';
import { QuadrantType } from '../types';
import { generateTaskHash } from '../utils/cacheService';

export interface AICategorizationResult {
  quadrant: QuadrantType;
  reasoning: string;
  confidence: number;
}

export enum AIStatus {
  IDLE = 'idle',
  ANALYZING = 'analyzing',
  SUCCESS = 'success',
  ERROR = 'error',
  UNCERTAIN = 'uncertain'
}

export class AICategorizationError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AICategorizationError';
  }
}

class AICategorizationService {
  private openai: OpenAI | null = null;
  private readonly CACHE_KEY_PREFIX = 'ai_categorization_';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not found. AI categorization will not be available.');
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  }

  private isConfigured(): boolean {
    return this.openai !== null;
  }

  private generatePrompt(title: string, description: string): string {
    return `You are an expert productivity assistant using the Eisenhower Matrix for task prioritization.

Analyze this task and categorize it into the appropriate Eisenhower Matrix quadrant:

Task: ${title}
Description: ${description}

Eisenhower Matrix Categories:
1. IMPORTANT_URGENT: Do it now - Critical deadlines, crises, high-impact time-sensitive tasks
2. IMPORTANT_NOT_URGENT: Schedule it - Important goals, strategic planning, relationship building, skill development
3. NOT_IMPORTANT_URGENT: Delegate it - Interruptions, meetings, tasks others can do, popular requests
4. NOT_IMPORTANT_NOT_URGENT: Eliminate it - Time-wasters, trivial tasks, excessive social media, busywork

Consider these factors:
- Deadlines and time sensitivity
- Impact on goals and values
- Consequences of not doing it
- Whether someone else could do it
- Long-term vs short-term value

Respond with a JSON object:
{
  "quadrant": "CATEGORY_NAME",
  "reasoning": "Brief one-sentence explanation",
  "confidence": 0.85
}`;
  }

  private parseAIResponse(content: string): AICategorizationResult {
    try {
      const cleanContent = content.trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new AICategorizationError('Invalid response format from AI');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.quadrant || !Object.values(QuadrantType).includes(parsed.quadrant)) {
        throw new AICategorizationError('Invalid quadrant returned by AI');
      }

      if (!parsed.reasoning || typeof parsed.reasoning !== 'string') {
        throw new AICategorizationError('Invalid reasoning returned by AI');
      }

      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;

      return {
        quadrant: parsed.quadrant as QuadrantType,
        reasoning: parsed.reasoning.trim(),
        confidence: Math.max(0.1, Math.min(1.0, confidence))
      };
    } catch (error) {
      if (error instanceof AICategorizationError) {
        throw error;
      }
      throw new AICategorizationError(`Failed to parse AI response: ${error.message}`);
    }
  }

  private isSimpleTask(title: string, description: string): boolean {
    const totalLength = (title + description).length;
    const hasComplexIndicators = /\b(deadline|due|urgent|asap|meeting|call|email|report|project|plan|review)\b/i.test(title + description);
    const hasDateOrTime = /\b(today|tomorrow|week|month|year|am|pm|:|o'clock)\b/i.test(title + description);

    return totalLength < 50 && !hasComplexIndicators && !hasDateOrTime;
  }

  private checkCache(title: string, description: string): AICategorizationResult | null {
    if (!this.isSimpleTask(title, description)) {
      return null; // Don't cache complex tasks
    }

    try {
      const taskHash = generateTaskHash(title + description);
      const cacheKey = `${this.CACHE_KEY_PREFIX}${taskHash}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const cacheEntry = JSON.parse(cached);
      const now = Date.now();

      if (now - cacheEntry.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheEntry.result as AICategorizationResult;
    } catch (error) {
      console.warn('Cache check failed:', error);
      return null;
    }
  }

  private saveToCache(title: string, description: string, result: AICategorizationResult): void {
    if (!this.isSimpleTask(title, description)) {
      return; // Don't cache complex tasks
    }

    try {
      const taskHash = generateTaskHash(title + description);
      const cacheKey = `${this.CACHE_KEY_PREFIX}${taskHash}`;
      const cacheEntry = {
        taskHash,
        result,
        timestamp: Date.now(),
        simpleTask: true
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Cache save failed:', error);
    }
  }

  private determineStatus(result: AICategorizationResult): AIStatus {
    if (result.confidence < 0.7) {
      return AIStatus.UNCERTAIN;
    }
    return AIStatus.SUCCESS;
  }

  public async categorizeTask(title: string, description: string): Promise<{
    result: AICategorizationResult;
    status: AIStatus;
    fromCache: boolean;
  }> {
    // Check configuration
    if (!this.isConfigured()) {
      throw new AICategorizationError(
        'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY environment variable.',
        401,
        false
      );
    }

    // Validate input
    if (!title || title.trim().length < 3) {
      throw new AICategorizationError(
        'Task title must be at least 3 characters long.',
        400,
        false
      );
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    // Check cache for simple tasks
    const cached = this.checkCache(trimmedTitle, trimmedDescription);
    if (cached) {
      return {
        result: cached,
        status: this.determineStatus(cached),
        fromCache: true
      };
    }

    try {
      const prompt = this.generatePrompt(trimmedTitle, trimmedDescription);

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini', // Using mini model for cost efficiency and speed
        messages: [
          {
            role: 'system',
            content: 'You are an expert productivity assistant specializing in Eisenhower Matrix task prioritization. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 150, // Keep responses concise
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AICategorizationError('No response received from AI service');
      }

      const result = this.parseAIResponse(content);
      const status = this.determineStatus(result);

      // Cache successful results for simple tasks
      if (status === AIStatus.SUCCESS) {
        this.saveToCache(trimmedTitle, trimmedDescription, result);
      }

      return {
        result,
        status,
        fromCache: false
      };

    } catch (error) {
      if (error instanceof AICategorizationError) {
        throw error;
      }

      // Handle OpenAI specific errors
      if (error?.status === 429) {
        throw new AICategorizationError(
          'AI service is busy, please try again.',
          429,
          true
        );
      }

      if (error?.status === 401) {
        throw new AICategorizationError(
          'Invalid API key. Please check your OpenAI configuration.',
          401,
          false
        );
      }

      if (error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT') {
        throw new AICategorizationError(
          'Network connection issue. Please check your internet connection.',
          503,
          true
        );
      }

      throw new AICategorizationError(
        `AI categorization failed: ${error.message || 'Unknown error'}`,
        500,
        true
      );
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured();
  }
}

// Singleton instance
export const aiCategorizationService = new AICategorizationService();
export default aiCategorizationService;