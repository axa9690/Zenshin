import React, { useState, useEffect, useCallback } from 'react';
import { Task, BacklogTask } from '../types';

// --- SIMULATION CONFIG ---
// This file simulates Google Drive API calls for demonstration purposes.
// In a real application, you would use the Google Drive API library.
const SIMULATED_LATENCY = 1500; // ms
const DRIVE_TASKS_KEY = 'gdrive_tasks';
const DRIVE_BACKLOG_KEY = 'gdrive_backlogTasks';
const DRIVE_AUTH_KEY = 'gdrive_auth_token'; // Simulate auth token

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

// This is where you would handle the entire Google API client loading and initialization
const useGoogleDrive = (onDataLoaded: (data: { tasks: Task[], backlogTasks: BacklogTask[] }) => void) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem(DRIVE_AUTH_KEY));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Effect to load data on initial auth check
  useEffect(() => {
    if (isAuthenticated) {
      setSyncStatus('syncing');
      console.log('Already authenticated. Fetching data from Drive...');
      // Simulate API call to load data
      setTimeout(() => {
        const tasksData = localStorage.getItem(DRIVE_TASKS_KEY);
        const backlogData = localStorage.getItem(DRIVE_BACKLOG_KEY);
        if (tasksData && backlogData) {
          console.log('Data loaded from Drive.');
          onDataLoaded({
            tasks: JSON.parse(tasksData),
            backlogTasks: JSON.parse(backlogData),
          });
          setSyncStatus('synced');
        } else {
          console.log('No data found in Drive. Will upload local data on next change.');
          setSyncStatus('idle'); // Idle until first save
        }
      }, SIMULATED_LATENCY);
    }
  }, [isAuthenticated, onDataLoaded]);


  const connect = useCallback(() => {
    if (isAuthenticated) return;
    
    setSyncStatus('syncing');
    setError(null);
    console.log('Simulating Google Auth and Drive connection...');
    
    // Simulate OAuth popup and token retrieval
    setTimeout(() => {
      console.log('Successfully authenticated with Google.');
      localStorage.setItem(DRIVE_AUTH_KEY, 'simulated_token');
      setIsAuthenticated(true);
      // Data loading is handled by the useEffect above
    }, SIMULATED_LATENCY);
  }, [isAuthenticated]);

  const saveData = useCallback(async (tasks: Task[], backlogTasks: BacklogTask[]) => {
    if (!isAuthenticated) return;

    setSyncStatus('syncing');
    setError(null);
    console.log('Simulating save to Google Drive...');

    // Simulate API call to find/create file and update content
    await new Promise(resolve => setTimeout(resolve, SIMULATED_LATENCY / 2));
    
    // Simulate potential API failure
    if (Math.random() < 0.1) { // 10% chance of failure
        console.error('Simulated API Error: Failed to save data.');
        setError('Failed to save data. Please try again.');
        setSyncStatus('error');
    } else {
        localStorage.setItem(DRIVE_TASKS_KEY, JSON.stringify(tasks));
        localStorage.setItem(DRIVE_BACKLOG_KEY, JSON.stringify(backlogTasks));
        console.log('Data saved to Drive.');
        setSyncStatus('synced');
    }
  }, [isAuthenticated]);

  return { connect, saveData, syncStatus, isAuthenticated, error };
};

export default useGoogleDrive;
