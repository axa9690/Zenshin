import { useState, useCallback, useRef, useEffect } from 'react';
import { aiCategorizationService, AICategorizationResult, AIStatus, AICategorizationError } from '../services/aiCategorizationService';

export interface UseAICategorizationState {
  result: AICategorizationResult | null;
  status: AIStatus;
  isLoading: boolean;
  error: string | null;
  fromCache: boolean;
  retryCount: number;
}

export interface UseAICategorizationReturn extends UseAICategorizationState {
  categorizeTask: (title: string, description: string) => Promise<void>;
  resetCategorization: () => void;
  retry: () => Promise<void>;
  isAvailable: boolean;
}

const RETRY_DELAY_BASE = 1000; // Base delay in milliseconds
const MAX_RETRIES = 3;

export const useAICategorization = (): UseAICategorizationReturn => {
  const [state, setState] = useState<UseAICategorizationState>({
    result: null,
    status: AIStatus.IDLE,
    isLoading: false,
    error: null,
    fromCache: false,
    retryCount: 0
  });

  const activeRequestRef = useRef<{
    title: string;
    description: string;
    requestId: number;
  } | null>(null);

  const requestIdRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetCategorization = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    activeRequestRef.current = null;
    requestIdRef.current += 1;

    setState({
      result: null,
      status: AIStatus.IDLE,
      isLoading: false,
      error: null,
      fromCache: false,
      retryCount: 0
    });
  }, []);

  const categorizeTask = useCallback(async (title: string, description: string) => {
    // Cancel any previous request
    const currentRequestId = ++requestIdRef.current;
    activeRequestRef.current = { title, description, requestId: currentRequestId };

    // Validate input before making API call
    if (!title || title.trim().length < 3) {
      setState(prev => ({
        ...prev,
        status: AIStatus.ERROR,
        isLoading: false,
        error: 'Task title must be at least 3 characters long.',
        fromCache: false
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      status: AIStatus.ANALYZING,
      isLoading: true,
      error: null,
      fromCache: false
    }));

    try {
      const response = await aiCategorizationService.categorizeTask(title.trim(), description.trim());

      // Check if this request is still the active one
      if (activeRequestRef.current?.requestId !== currentRequestId) {
        return; // Request was superseded
      }

      setState({
        result: response.result,
        status: response.status,
        isLoading: false,
        error: null,
        fromCache: response.fromCache,
        retryCount: 0
      });

    } catch (error) {
      // Check if this request is still the active one
      if (activeRequestRef.current?.requestId !== currentRequestId) {
        return; // Request was superseded
      }

      const aiError = error as AICategorizationError;
      const errorMessage = aiError.message || 'Failed to categorize task';

      setState(prev => {
        const newRetryCount = aiError.retryable && prev.retryCount < MAX_RETRIES
          ? prev.retryCount + 1
          : prev.retryCount;

        return {
          ...prev,
          status: AIStatus.ERROR,
          isLoading: false,
          error: errorMessage,
          fromCache: false,
          retryCount: newRetryCount
        };
      });
    }
  }, []);

  const retry = useCallback(async () => {
    if (!activeRequestRef.current || state.retryCount >= MAX_RETRIES) {
      return;
    }

    const delay = RETRY_DELAY_BASE * Math.pow(2, state.retryCount); // Exponential backoff

    setState(prev => ({
      ...prev,
      status: AIStatus.ANALYZING,
      isLoading: true,
      error: null
    }));

    // Wait before retrying
    await new Promise(resolve => {
      retryTimeoutRef.current = setTimeout(resolve, delay);
    });

    // Retry the last request
    const { title, description } = activeRequestRef.current;
    await categorizeTask(title, description);
  }, [state.retryCount, categorizeTask]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const isAvailable = aiCategorizationService.isAvailable();

  return {
    ...state,
    categorizeTask,
    resetCategorization,
    retry,
    isAvailable
  };
};