
import { QuadrantType } from './types';

interface QuadrantConfig {
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
}

export const QUADRANT_CONFIG: Record<QuadrantType, QuadrantConfig> = {
  [QuadrantType.IMPORTANT_URGENT]: {
    title: 'Important & Urgent',
    description: 'Do it now',
    bgColor: 'bg-quadrant-1',
    borderColor: 'border-quadrant-1-border',
  },
  [QuadrantType.IMPORTANT_NOT_URGENT]: {
    title: 'Important & Not Urgent',
    description: 'Schedule it',
    bgColor: 'bg-quadrant-2',
    borderColor: 'border-quadrant-2-border',
  },
  [QuadrantType.NOT_IMPORTANT_URGENT]: {
    title: 'Not Important & Urgent',
    description: 'Delegate it',
    bgColor: 'bg-quadrant-3',
    borderColor: 'border-quadrant-3-border',
  },
  [QuadrantType.NOT_IMPORTANT_NOT_URGENT]: {
    title: 'Not Important & Not Urgent',
    description: 'Eliminate it',
    bgColor: 'bg-quadrant-4',
    borderColor: 'border-quadrant-4-border',
  },
};

export const QUADRANT_ORDER = [
  QuadrantType.IMPORTANT_URGENT,
  QuadrantType.IMPORTANT_NOT_URGENT,
  QuadrantType.NOT_IMPORTANT_URGENT,
  QuadrantType.NOT_IMPORTANT_NOT_URGENT,
];
