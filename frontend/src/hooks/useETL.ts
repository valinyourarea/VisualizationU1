// frontend/src/hooks/useETL.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';

export type DagNodeStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'error'
  | 'skipped'
  | 'idle'
  | string;

export type DagNode = {
  id: string;
  name: string;
  status: DagNodeStatus;
  dependencies?: string[];
  startTime?: string; // ISO
  endTime?: string;   // ISO
};

export type ETLDag = {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error' | string;
  nodes?: DagNode[];
  startTime?: string; // ISO
  endTime?: string;   // ISO
  stats?: Record<string, unknown>;
};

// Seed para mostrar algo siempre
const SEED_DAG: ETLDag = {
  id: 'streaming_etl_dag',
  name: 'Streaming Data ETL Pipeline',
  status: 'idle',
  nodes: [
    { id: 'validate_files',      name: 'Validate CSV Files',     status: 'pending', dependencies: [] },
    { id: 'create_schema',       name: 'Create Database Schema', status: 'pending', dependencies: ['validate_files'] },
    { id: 'load_dimensions',     name: 'Load Dimension Tables',  status: 'pending', dependencies: ['create_schema'] },
    { id: 'process_users',       name: 'Process Users Data',     status: 'pending', dependencies: ['load_dimensions'] },
    { id: 'process_sessions',    name: 'Process Sessions Data',  status: 'pending', dependencies: ['process_users'] },
    { id: 'create_aggregations', name: 'Create Aggregations',    status: 'pending', dependencies: ['process_sessions'] },
    { id: 'validate_data',       name: 'Validate Data Quality',  status: 'pending', dependencies: ['create_aggregations'] },
    { id: 'generate_stats',      name: 'Generate Statistics',    status: 'pending', dependencies: ['validate_data'] },
  ],
};

type UseETLState = {
  dag: ETLDag | null;
  viewDag: ETLDag;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  isRunning: boolean;
  refresh: () => Promise<void>;
  startETL: () => Promise<void>;
  resetETL: () => Promise<void>;
};

const ENDPOINT_STATUS = '/etl/status';
const ENDPOINT_START  = '/etl/start';
const ENDPOINT_RESET  = '/etl/reset';

function normalizeDag(res: any): ETLDag | undefined {
  const wrapped = res?.dag ?? res?.data?.dag ?? res?.result?.dag;
  if (wrapped && typeof wrapped === 'object') return wrapped as ETLDag;
  if (res && typeof res === 'object' && res.id && res.nodes) return res as ETLDag;
  return undefined;
}

export function useETL(): UseETLState {
  const [dag, setDag] = useState<ETLDag | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const debugEnabled = typeof window !== 'undefined' && localStorage.getItem('etl_debug') === '1';

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(ENDPOINT_STATUS);
      const next = normalizeDag(res);

      if (debugEnabled) {
        console.groupCollapsed('[ETL] /etl/status payload');
        console.log(res);
        console.groupEnd();
      }

      if (!next) {
        if (mountedRef.current) {
          setError('Unexpected payload: missing dag');
          setDag(null);
        }
      } else {
        if (mountedRef.current) setDag(next);
      }
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e?.message || String(e));
        setDag(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setHydrated(true);
      }
    }
  }, [debugEnabled]);

  const startETL = useCallback(async () => {
    try {
      if (debugEnabled) console.debug('[ETL] POST /etl/start');
      await api.post(ENDPOINT_START);
      await fetchStatus();
    } catch (e: any) {
      if (mountedRef.current) setError(e?.message || String(e));
    }
  }, [fetchStatus, debugEnabled]);

  const resetETL = useCallback(async () => {
    try {
      if (debugEnabled) console.debug('[ETL] POST /etl/reset');
      await api.post(ENDPOINT_RESET);
      await fetchStatus();
    } catch (e: any) {
      if (mountedRef.current) setError(e?.message || String(e));
    }
  }, [fetchStatus, debugEnabled]);

  const viewDag = useMemo<ETLDag>(() => {
    const v = dag ?? SEED_DAG;
    if (debugEnabled) {
      console.groupCollapsed('[ETL] viewDag');
      console.log(v);
      console.groupEnd();
    }
    return v;
  }, [dag, debugEnabled]);

  const isRunning = useMemo(() => viewDag.status === 'running', [viewDag.status]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => { fetchStatus().catch(() => void 0); }, 2000);
    return () => clearInterval(id);
  }, [isRunning, fetchStatus]);

  useEffect(() => { fetchStatus().catch(() => void 0); }, [fetchStatus]);

  return {
    dag,
    viewDag,
    hydrated,
    loading,
    error,
    isRunning,
    refresh: fetchStatus,
    startETL,
    resetETL,
  };
}


