import { useState, useEffect, useCallback } from 'react';
import { ETLDag } from '../types';
import { api } from '../services/api';

export const useETL = () => {
  const [dag, setDag] = useState<ETLDag>({
    id: 'streaming_etl_dag',
    name: 'Streaming Data ETL Pipeline',
    status: 'idle',
    nodes: [
      {
        id: 'validate_files',
        name: 'Validate CSV Files',
        status: 'pending',
        dependencies: []
      },
      {
        id: 'create_schema',
        name: 'Create Database Schema',
        status: 'pending',
        dependencies: ['validate_files']
      },
      {
        id: 'load_dimensions',
        name: 'Load Dimension Tables',
        status: 'pending',
        dependencies: ['create_schema']
      },
      {
        id: 'process_users',
        name: 'Process Users Data',
        status: 'pending',
        dependencies: ['load_dimensions']
      },
      {
        id: 'process_sessions',
        name: 'Process Sessions Data',
        status: 'pending',
        dependencies: ['process_users']
      },
      {
        id: 'create_aggregations',
        name: 'Create Aggregations',
        status: 'pending',
        dependencies: ['process_sessions']
      },
      {
        id: 'validate_data',
        name: 'Validate Data Quality',
        status: 'pending',
        dependencies: ['create_aggregations']
      },
      {
        id: 'generate_stats',
        name: 'Generate Statistics',
        status: 'pending',
        dependencies: ['validate_data']
      }
    ]
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch DAG status from backend
  const fetchDAGStatus = useCallback(async () => {
    try {
      const response = await api.get('/etl/status');
      setDag(response.data.dag);
      setIsRunning(response.data.dag.status === 'running');
    } catch (err) {
      console.error('Failed to fetch DAG status:', err);
    }
  }, []);

  // Start ETL process
  const startETL = useCallback(async () => {
    try {
      setError(null);
      setIsRunning(true);
      
      const response = await api.post('/etl/start');
      
      if (response.data.success) {
        // Start polling for status updates
        const pollInterval = setInterval(async () => {
          const statusResponse = await api.get('/etl/status');
          const updatedDag = statusResponse.data.dag;
          
          setDag(updatedDag);
          
          if (updatedDag.status === 'completed' || updatedDag.status === 'failed') {
            clearInterval(pollInterval);
            setIsRunning(false);
            
            if (updatedDag.status === 'failed') {
              setError('ETL pipeline failed. Check the logs for details.');
            }
          }
        }, 1000); // Poll every second
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start ETL');
      setIsRunning(false);
    }
  }, []);

  // Reset ETL
  const resetETL = useCallback(async () => {
    try {
      await api.post('/etl/reset');
      await fetchDAGStatus();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to reset ETL');
    }
  }, [fetchDAGStatus]);

  // Initial load
  useEffect(() => {
    fetchDAGStatus();
  }, [fetchDAGStatus]);

  // Poll for updates if running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(fetchDAGStatus, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, fetchDAGStatus]);

  return {
    dag,
    isRunning,
    error,
    startETL,
    resetETL,
    fetchDAGStatus
  };
};