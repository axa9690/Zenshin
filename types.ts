
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
