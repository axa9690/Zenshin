
export enum QuadrantType {
  IMPORTANT_URGENT = 'IMPORTANT_URGENT',
  IMPORTANT_NOT_URGENT = 'IMPORTANT_NOT_URGENT',
  NOT_IMPORTANT_URGENT = 'NOT_IMPORTANT_URGENT',
  NOT_IMPORTANT_NOT_URGENT = 'NOT_IMPORTANT_NOT_URGENT',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  quadrant: QuadrantType;
  date: string; // YYYY-MM-DD format
  completed: boolean;
}

export interface BacklogTask {
  id: string;
  title: string;
  description: string;
}

// AI Categorization Types
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

export interface CacheEntry {
  taskHash: string;
  result: AICategorizationResult;
  timestamp: number;
  simpleTask: boolean;
}
