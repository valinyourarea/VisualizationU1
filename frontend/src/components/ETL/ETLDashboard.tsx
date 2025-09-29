import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DAGFlow } from './DAGFlow';
import { NodeStatus } from './NodeStatus';

/** Tipos mínimos locales para no depender de otros archivos */
type DagNodeStatus = 'pending' | 'running' | 'success' | 'error' | 'idle' | string;

type DagNode = {
  id: string;
  name: string;
  status: DagNodeStatus;
  dependencies: string[];
  error?: string;
};

type ETLDag = {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error' | string;
  nodes: DagNode[];
  startTime?: string; // ISO
  endTime?: string;   // ISO
};

interface ETLDashboardProps {
  /** DAG real (p.ej. de la API o del hook). Si no hay, puedes pasar un seed. */
  dag: ETLDag | null | undefined;
  /** Iniciar en modo simulación (opcional) */
  simulateDefault?: boolean;
  /** Duración por nodo en ms cuando está en auto (opcional, default 900) */
  simulateStepMs?: number;
}

/**
 * ETLDashboard con simulación:
 * - Si no hay DAG real, renderizamos mensajes seguros.
 * - Botones: Simulate Run, Step, Reset.
 * - Simulación respeta el orden actual de los nodos (suficiente para tu pipeline lineal).
 * - No toca el DAG original: trabajamos sobre una copia local (localDag).
 */
export const ETLDashboard: React.FC<ETLDashboardProps> = ({
  dag,
  simulateDefault = false,
  simulateStepMs = 900,
}) => {
  // Copia local para "jugar" sin modificar el prop
  const [localDag, setLocalDag] = useState<ETLDag | null>(dag ?? null);

  // Estado de simulación
  const [simulating, setSimulating] = useState<boolean>(simulateDefault);
  const [autoRun, setAutoRun] = useState<boolean>(simulateDefault);

  // Índice del nodo actual en simulación
  const [cursor, setCursor] = useState<number>(0);

  // Timers para limpiar al desmontar / reset
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza localDag desde prop cuando NO estamos simulando
  useEffect(() => {
    if (!simulating) {
      setLocalDag(dag ?? null);
      setCursor(0);
    }
  }, [dag, simulating]);

  // Cálculo seguro de nodos
  const nodes: DagNode[] = useMemo(() => {
    const arr = Array.isArray(localDag?.nodes) ? localDag!.nodes : [];
    return arr.map(n => ({ ...n })); // copiar por seguridad
  }, [localDag]);

  // Progreso
  const { completed, total, percent } = useMemo(() => {
    const t = nodes.length;
    const c = nodes.filter(n => n.status === 'success').length;
    return { completed: c, total: t, percent: t ? Math.round((c / t) * 100) : 0 };
  }, [nodes]);

  /** Helpers de simulación */
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current as any);
      timerRef.current = null;
    }
  };

  const markDagStatus = (status: ETLDag['status']) => {
    setLocalDag(prev => (prev ? { ...prev, status } : prev));
  };

  const setNodeStatus = (idx: number, status: DagNodeStatus, error?: string) => {
    setLocalDag(prev => {
      if (!prev || !Array.isArray(prev.nodes) || !prev.nodes[idx]) return prev;
      const nextNodes = prev.nodes.slice();
      nextNodes[idx] = { ...nextNodes[idx], status, error };
      return { ...prev, nodes: nextNodes };
    });
  };

  const resetSimulation = () => {
    clearTimer();
    if (dag) {
      // Reinicia a pending/idle sólo en la copia local
      const resetNodes = (dag.nodes || []).map(n => ({
        ...n,
        status: 'pending' as DagNodeStatus,
        error: undefined,
      }));
      setLocalDag({
        ...dag,
        status: 'idle',
        nodes: resetNodes,
        startTime: undefined,
        endTime: undefined,
      });
    } else {
      setLocalDag(null);
    }
    setCursor(0);
    setSimulating(false);
    setAutoRun(false);
  };

  const stepOnce = () => {
    if (!localDag || !Array.isArray(localDag.nodes) || localDag.nodes.length === 0) return;

    // Si todos están success, nada que hacer
    if (cursor >= localDag.nodes.length) return;

    if (cursor === 0) {
      // Marcar inicio si no existe
      setLocalDag(prev => {
        if (!prev) return prev;
        return { ...prev, status: 'running', startTime: new Date().toISOString(), endTime: undefined };
      });
    }

    // 1) running actual
    setNodeStatus(cursor, 'running');

    // 2) simular trabajo y cerrar en success
    timerRef.current = setTimeout(() => {
      setNodeStatus(cursor, 'success');

      const nextIdx = cursor + 1;
      setCursor(nextIdx);

      // Si hemos terminado todos los nodos, marcar success global
      if (nextIdx >= (localDag?.nodes?.length || 0)) {
        setLocalDag(prev => (prev ? { ...prev, status: 'success', endTime: new Date().toISOString() } : prev));
        setAutoRun(false);
        setSimulating(false);
      } else if (autoRun) {
        // Seguir automáticamente
        stepOnce();
      }
    }, simulateStepMs);
  };

  const startSimulateRun = () => {
    if (!localDag || !Array.isArray(localDag.nodes) || localDag.nodes.length === 0) return;

    // Si venimos de datos reales, clonar a pending
    const freshNodes = localDag.nodes.map(n => ({
      ...n,
      status: 'pending' as DagNodeStatus,
      error: undefined,
    }));

    setLocalDag(prev => (prev ? {
      ...prev,
      status: 'idle',
      nodes: freshNodes,
      startTime: undefined,
      endTime: undefined,
    } : prev));

    setCursor(0);
    setSimulating(true);
    setAutoRun(true);

    // Disparar primer paso (el resto se encadena si autoRun = true)
    // Pequeño delay para que React aplique el estado anterior
    timerRef.current = setTimeout(() => {
      stepOnce();
    }, 50);
  };

  // Limpieza al desmontar
  useEffect(() => {
    return () => clearTimer();
  }, []);

  // Estado visual seguro si no hay DAG
  if (!localDag || !Array.isArray(localDag.nodes)) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">ETL Dashboard</h3>
          <div className="text-xs text-gray-500">No DAG available</div>
        </div>
        <div className="text-sm text-gray-500">
          Aún no hay datos para visualizar. Inicia el ETL desde el backend o usa la simulación cuando haya un seed de nodos.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panel de controles de simulación */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">ETL Dashboard</h3>
            <p className="text-xs text-gray-500">
              {simulating || autoRun ? 'Simulation mode' : 'Live view'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startSimulateRun}
              className="px-3 py-2 rounded-md text-white bg-black hover:bg-gray-800 text-sm"
              title="Simular ejecución completa"
            >
              Simulate Run
            </button>

            <button
              onClick={() => { setSimulating(true); setAutoRun(false); stepOnce(); }}
              className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
              title="Avanzar un paso"
            >
              Step
            </button>

            <button
              onClick={resetSimulation}
              className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
              title="Reiniciar simulación"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Progreso y estado global */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span className="capitalize">
              Status: <span className="font-medium">{localDag.status}</span>
            </span>
            <span>{completed}/{total} steps · {percent}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${localDag.status === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Visualización DAG + panel de nodos */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          {/* Pasamos la copia local para no alterar el prop al simular */}
          <DAGFlow dag={localDag} />
        </div>
        <div>
          <NodeStatus nodes={nodes} />
        </div>
      </div>
    </div>
  );
};

export default ETLDashboard;