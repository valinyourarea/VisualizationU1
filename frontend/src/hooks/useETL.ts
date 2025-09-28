// frontend/src/hooks/useETL.ts

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';

/** Tipos base (ajústalos a tus tipos si ya existen) */
export type DagNodeStatus = 'pending' | 'running' | 'success' | 'error' | 'idle' | string;

export type DagNode = {
  id: string;
  name: string;
  status: DagNodeStatus;
  dependencies: string[];
};

export type ETLDag = {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error' | string;
  nodes: DagNode[];
  startTime?: string; // ISO
  endTime?: string;   // ISO
  stats?: Record<string, unknown>;
};

/** ←-- TU DAG SEMILLA (el que tenías) */
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
  /** DAG real (null hasta que el backend responda) */
  dag: ETLDag | null;
  /** DAG para visualizar (usa el SEED si aún no hay real) */
  viewDag: ETLDag;
  /** ¿Ya intentamos/terminamos la primera carga desde API? */
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  isRunning: boolean;
  refresh: () => Promise<void>;
  startETL: () => Promise<void>;
  resetETL: () => Promise<void>;
};

/** Endpoints (ajústalos si cambian en tu backend) */
const ENDPOINT_STATUS = '/etl/status';
const ENDPOINT_START  = '/etl/start';
const ENDPOINT_RESET  = '/etl/reset';

/** Normaliza distintas formas de respuesta:
 *  - { dag }, { data:{ dag } }, { result:{ dag } }, o el DAG directo
 */
function normalizeDag(res: any): ETLDag | undefined {
  const wrapped =
    res?.dag ??
    res?.data?.dag ??
    res?.result?.dag;

  if (wrapped && typeof wrapped === 'object') return wrapped as ETLDag;

  if (res && typeof res === 'object' && res.id && res.nodes) {
    return res as ETLDag;
  }
  return undefined;
}

export function useETL(): UseETLState {
  // Guardamos el DAG real aquí (null hasta que llegue del backend)
  const [dag, setDag] = useState<ETLDag | null>(null);

  // Bandera para saber si ya intentamos hidratar (éxito o fallo)
  const [hydrated, setHydrated] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error,   setError]   = useState<string | null>(null);

  // Evita setState tras unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(ENDPOINT_STATUS);
      const next = normalizeDag(res);

      if (!next) {
        console.error('[useETL] Unexpected payload from', ENDPOINT_STATUS, res);
        if (mountedRef.current) {
          setError('Unexpected payload: missing dag');
          setDag(null);
        }
      } else {
        if (mountedRef.current) setDag(next);
      }
    } catch (e: any) {
      console.error('[useETL] fetch error:', e);
      if (mountedRef.current) {
        setError(e?.message || String(e));
        setDag(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setHydrated(true); // ← ya intentamos hidratar (haya salido bien o mal)
      }
    }
  }, []);

  const startETL = useCallback(async () => {
    try {
      await api.post(ENDPOINT_START);
      await fetchStatus();
    } catch (e) {
      console.error('[useETL] start error:', e);
      if (mountedRef.current) setError((e as Error)?.message || String(e));
    }
  }, [fetchStatus]);

  const resetETL = useCallback(async () => {
    try {
      await api.post(ENDPOINT_RESET);
      await fetchStatus();
    } catch (e) {
      console.error('[useETL] reset error:', e);
      if (mountedRef.current) setError((e as Error)?.message || String(e));
    }
  }, [fetchStatus]);

  // DAG “efectivo” que ve la UI: si no hay real, usamos el SEED
  const viewDag = useMemo<ETLDag>(() => dag ?? SEED_DAG, [dag]);

  const isRunning = useMemo(() => viewDag.status === 'running', [viewDag.status]);

  /** (Opcional) Auto-poll mientras esté corriendo */
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => { fetchStatus().catch(() => void 0); }, 2000);
    return () => clearInterval(id);
  }, [isRunning, fetchStatus]);

  /** Carga inicial */
  useEffect(() => { fetchStatus().catch(() => void 0); }, [fetchStatus]);

  return {
    dag,              // null hasta hidratar; te sirve para saber si hay datos reales
    viewDag,          // siempre tiene algo que pintar (seed o real)
    hydrated,         // ya intentamos hablar con el backend
    loading,
    error,
    isRunning,
    refresh: fetchStatus,
    startETL,
    resetETL,
  };
}
