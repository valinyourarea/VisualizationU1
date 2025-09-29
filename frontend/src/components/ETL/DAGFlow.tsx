// frontend/src/components/ETL/DAGFlow.tsx
import React, { useMemo } from 'react';
import type { ETLDag, DagNode } from '../../hooks/useETL';
import { NodeStatus } from './NodeStatus';

/** -------------------- Alias y normalización -------------------- */
const CANONICAL: Record<string, string[]> = {
  validate_files: ['validate_files', 'validate'],
  create_schema: ['create_schema', 'schema'],
  load_dimensions: ['load_dimensions', 'dims', 'dimensions', 'load_dims'],
  process_users: ['process_users', 'users'],
  process_sessions: ['process_sessions', 'sessions'],
  create_aggregations: ['create_aggregations', 'aggs', 'aggregations', 'create_aggs'],
  validate_data: ['validate_data', 'quality', 'data_quality'],
  generate_statistics: ['generate_statistics', 'generate_stats', 'stats', 'finish', 'finalize'],
};

function toCanon(id: string): string {
  const s = (id ?? '').toString().toLowerCase();
  for (const [canon, aliases] of Object.entries(CANONICAL)) {
    if (aliases.includes(s)) return canon;
  }
  return s;
}

/** Orden "ideal" del pipeline (por clave canónica) */
const PIPELINE_ORDER: string[] = [
  'validate_files',
  'create_schema',
  'load_dimensions',
  'process_users',
  'process_sessions',
  'create_aggregations',
  'validate_data',
  'generate_statistics',
];

/** -------------------- Layout estático -------------------- */
/** Posiciones por clave canónica. Se usa alias para encontrar éstas. */
const STATIC_POS: Record<string, { x: number; y: number }> = {
  validate_files: { x: 120, y: 120 },
  create_schema: { x: 360, y: 120 },
  load_dimensions: { x: 600, y: 120 },
  process_users: { x: 840, y: 120 },
  process_sessions: { x: 1080, y: 120 },
  create_aggregations: { x: 1320, y: 120 },
  validate_data: { x: 1560, y: 120 },
  generate_statistics: { x: 1800, y: 120 },
};

type PositionedNode = DagNode & {
  canon: string;
  x: number;
  y: number;
};

type Edge = { from: string; to: string };

/** Tamaño visual de los "rectángulos" de nodo */
const NODE_W = 220;
const NODE_H = 56;

/** Color por estado */
function statusColor(s: string) {
  const k = (s ?? '').toLowerCase();
  if (k === 'success' || k === 'completed' || k === 'complete') return 'bg-emerald-500';
  if (k === 'running') return 'bg-blue-500';
  if (k === 'error' || k === 'failed' || k === 'fail') return 'bg-red-500';
  return 'bg-slate-300';
}

/** -------------------- Componente -------------------- */
export function DAGFlow({ dag }: { dag: ETLDag }) {
  const { placed, edges } = useMemo(() => {
    const groupLabel = `[DAGFlow] render (dag.id=${dag?.id ?? '∅'} | status=${dag?.status ?? '∅'})`;
    console.groupCollapsed(groupLabel);

    const rawNodes: DagNode[] = Array.isArray(dag?.nodes) ? dag.nodes : [];
    console.info('[DAGFlow] nodos entrantes:', rawNodes);

    // Normaliza a canónica + agrega posición si existe
    const normalized: PositionedNode[] = rawNodes.map((n) => {
      const canon = toCanon(n.id);
      return {
        ...n,
        canon,
        x: STATIC_POS[canon]?.x ?? Number.NaN,
        y: STATIC_POS[canon]?.y ?? Number.NaN,
      };
    });

    // Filtra los que tengan posición conocida; loguea los que no
    const placedNodes: PositionedNode[] = [];
    for (const n of normalized) {
      if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) {
        console.warn('[DAGFlow] nodo sin posición asignada:', n.id, n.status, n);
      } else {
        placedNodes.push(n);
      }
    }
    console.info('[DAGFlow] nodos posicionados:', placedNodes.map((n) => n.id));

    // Mapa canónica -> id real presente
    const canonToRealId = new Map<string, string>();
    for (const n of placedNodes) canonToRealId.set(n.canon, n.id);

    // Construir edges:
    // 1) Si hay dependencies en algún nodo, las respetamos (normalizando canónicas).
    // 2) Si NO hay dependencies, generamos cadena secuencial según PIPELINE_ORDER.
    const hasAnyDeps = rawNodes.some(
      (n) => Array.isArray(n.dependencies) && n.dependencies.length > 0,
    );

    const edgesSet = new Set<string>();
    const edges: Edge[] = [];

    if (hasAnyDeps) {
      for (const n of rawNodes) {
        const targetCanon = toCanon(n.id);
        const targetReal = canonToRealId.get(targetCanon);
        if (!targetReal) continue;

        const deps = Array.isArray(n.dependencies) ? n.dependencies : [];
        for (const d of deps) {
          const depCanon = toCanon(d);
          const depReal = canonToRealId.get(depCanon);
          if (!depReal) continue;
          const key = `${depReal}=>${targetReal}`;
          if (!edgesSet.has(key)) {
            edgesSet.add(key);
            edges.push({ from: depReal, to: targetReal });
          }
        }
      }
    } else {
      // Fallback secuencial en base al orden canónico para nodos presentes
      const presentCanon = PIPELINE_ORDER.filter((c) => canonToRealId.has(c));
      for (let i = 0; i < presentCanon.length - 1; i++) {
        const aReal = canonToRealId.get(presentCanon[i])!;
        const bReal = canonToRealId.get(presentCanon[i + 1])!;
        const key = `${aReal}=>${bReal}`;
        if (!edgesSet.has(key)) {
          edgesSet.add(key);
          edges.push({ from: aReal, to: bReal });
        }
      }
    }

    console.info('[DAGFlow] conexiones dibujadas:', edges.length, edges);
    console.groupEnd();

    return { placed: placedNodes, edges };
  }, [dag]);

  // Contenedor ancho para permitir scroll horizontal si hace falta
  const minCanvasWidth = 2000; // px
  const minCanvasHeight = 260; // px

  // Helper para buscar pos de un id
  const getPos = (id: string) => {
    const n = placed.find((p) => p.id === id);
    return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
  };

  return (
    <div className="relative border rounded-lg bg-white/70 shadow-sm">
      {/* Grid/fondo */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)]"
        style={{ backgroundSize: '24px 24px' }}
      />
      <div className="relative overflow-x-auto overflow-y-hidden" style={{ minHeight: minCanvasHeight }}>
        <div style={{ minWidth: minCanvasWidth, height: minCanvasHeight, position: 'relative' }}>
          {/* Conexiones */}
          <svg width={minCanvasWidth} height={minCanvasHeight} className="absolute inset-0 pointer-events-none">
            {edges.map((e, idx) => {
              const a = getPos(e.from);
              const b = getPos(e.to);
              // Línea horizontal simple (rectángulos centrados verticalmente)
              const y = a.y;
              const x1 = a.x + NODE_W / 2;
              const x2 = b.x - NODE_W / 2;
              return (
                <line
                  key={`${e.from}_${e.to}_${idx}`}
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke="#CBD5E1"
                  strokeWidth={2}
                  markerEnd="url(#arrow)"
                />
              );
            })}
            {/* Flecha */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#CBD5E1" />
              </marker>
            </defs>
          </svg>

          {/* Nodos */}
          {placed.map((n) => (
            <div
              key={n.id}
              className="absolute rounded-xl border bg-white shadow-sm transition-all"
              style={{
                left: n.x - NODE_W / 2,
                top: n.y - NODE_H / 2,
                width: NODE_W,
                height: NODE_H,
              }}
            >
              <div className="flex items-center gap-2 h-full px-4">
                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${statusColor(n.status)}`} />
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-slate-700">{n.name || n.id}</span>
                  <span className="text-[11px] text-slate-400 capitalize">{n.status || 'pending'}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Leyenda de estados */}
          <div className="absolute right-4 top-3 flex items-center gap-4 rounded-md border bg-white/90 px-3 py-1.5 text-[12px] text-slate-600">
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Pending
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Running
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Success
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Failed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


