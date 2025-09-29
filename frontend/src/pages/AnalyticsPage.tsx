import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';

type DistItem = { label: string; value: number };
type SeriesPoint = { date: string; value: number };

type AnalyticsData = {
  totalUsers: number;
  totalSessions: number;
  avgWatchTimeMinutes?: number | null;
  completionRate?: number | null;
  deviceDistribution?: DistItem[];
  subscriptionTypes?: DistItem[];
  sessionsOverTime?: SeriesPoint[];
};

function pick(obj: any, ...paths: string[]) {
  for (const p of paths) {
    const parts = p.split('.');
    let cur = obj;
    let ok = true;
    for (const part of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, part)) {
        cur = cur[part];
      } else {
        ok = false;
        break;
      }
    }
    if (ok && cur !== undefined) return cur;
  }
  return undefined;
}

function normalizeAnalytics(payload: any): AnalyticsData {
  let raw =
    pick(payload, 'analytics') ??
    pick(payload, 'data.analytics') ??
    pick(payload, 'data') ??
    payload;

  const statistics =
    pick(raw, 'statistics') ??
    pick(payload, 'statistics') ??
    pick(payload, 'data.statistics');

  if (Array.isArray(statistics) && statistics.length > 0) raw = { ...raw, ...statistics[0] };
  else if (statistics && typeof statistics === 'object') raw = { ...raw, ...statistics };

  const toNum = (v: any) => (v == null ? null : Number(v) || 0);

  const totalUsers = toNum(raw?.totalUsers) ?? toNum(raw?.total_users) ?? 0;
  const totalSessions = toNum(raw?.totalSessions) ?? toNum(raw?.total_sessions) ?? 0;

  const avgWatchTimeMinutes =
    toNum(raw?.avgWatchTimeMinutes) ??
    toNum(raw?.avg_watch_time_minutes) ??
    toNum(raw?.avg_watch_time) ??
    null;

  const completionRate =
    toNum(raw?.completionRate) ??
    toNum(raw?.completion_rate) ??
    toNum(raw?.avg_completion) ??
    null;

  const deviceDistribution: DistItem[] =
    raw?.deviceDistribution ?? raw?.device_distribution ?? [];

  const subscriptionTypes: DistItem[] =
    raw?.subscriptionTypes ?? raw?.subscription_types ?? [];

  const sessionsOverTime: SeriesPoint[] =
    raw?.sessionsOverTime ?? raw?.sessions_over_time ?? [];

  return {
    totalUsers: Number(totalUsers) || 0,
    totalSessions: Number(totalSessions) || 0,
    avgWatchTimeMinutes: avgWatchTimeMinutes,
    completionRate: completionRate,
    deviceDistribution: Array.isArray(deviceDistribution) ? deviceDistribution : [],
    subscriptionTypes: Array.isArray(subscriptionTypes) ? subscriptionTypes : [],
    sessionsOverTime: Array.isArray(sessionsOverTime) ? sessionsOverTime : [],
  };
}

const formatPct = (n: number | null | undefined) =>
  n == null ? '-' : `${Math.round(n)}%`;
const formatMin = (n: number | null | undefined) =>
  n == null ? '-' : `${Math.round(n)} min`;

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Interactividad: distribuciones
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  // Interactividad: serie temporal
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; date: string; value: number } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ date: string; value: number } | null>(null);
  const chartWrapRef = useRef<HTMLDivElement | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics');
      const normalized = normalizeAnalytics(res);
      setData(normalized);
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const hasData = useMemo(() => {
    if (!data) return false;
    const arrays =
      (data.deviceDistribution?.length ?? 0) > 0 ||
      (data.subscriptionTypes?.length ?? 0) > 0 ||
      (data.sessionsOverTime?.length ?? 0) > 0;
    const kpis =
      (data.totalUsers ?? 0) > 0 ||
      (data.totalSessions ?? 0) > 0 ||
      (data.avgWatchTimeMinutes ?? 0) > 0 ||
      (data.completionRate ?? 0) > 0;
    return arrays || kpis;
  }, [data]);

  const approxCountFromPct = (pct: number, total: number) =>
    Math.round((Math.max(0, pct) / 100) * Math.max(0, total));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Data insights and metrics</p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800"
        >
          Refresh
        </button>
        {loading && <span className="text-sm text-gray-500">Loading…</span>}
        {error && <span className="text-sm text-red-600">Error: {error}</span>}
      </div>

      {!loading && !error && !hasData && (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 bg-white">
          <p className="text-gray-700 font-medium mb-1">No analytics yet</p>
          <p className="text-sm text-gray-500">
            Ejecuta el ETL y luego pulsa <span className="font-medium">Refresh</span>.
          </p>
        </div>
      )}

      {hasData && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{data?.totalUsers ?? '-'}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{data?.totalSessions ?? '-'}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Avg Watch Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatMin(data?.avgWatchTimeMinutes)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatPct(data?.completionRate)}
              </p>
            </div>
          </div>

          {/* Distribuciones: Device */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Device Distribution</h3>
                {selectedDevice && (
                  <button
                    onClick={() => setSelectedDevice(null)}
                    className="text-xs text-gray-600 hover:text-gray-900 underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              {data?.deviceDistribution && data.deviceDistribution.length > 0 ? (
                <div className="space-y-3">
                  {data.deviceDistribution.map((d, idx) => {
                    const isActive = selectedDevice === d.label;
                    const approx = approxCountFromPct(d.value, data?.totalSessions ?? 0);
                    return (
                      <div
                        key={`${d.label}-${idx}`}
                        className={[
                          'rounded-md p-3 transition-colors cursor-pointer',
                          isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
                        ].join(' ')}
                        onClick={() => setSelectedDevice(isActive ? null : d.label)}
                      >
                        <div className="flex justify-between text-sm text-gray-700">
                          <span className="font-medium">{d.label}</span>
                          <span>{d.value}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded mt-2">
                          <div
                            className="h-2 bg-black rounded"
                            style={{ width: `${Math.min(100, Math.max(0, d.value))}%` }}
                          />
                        </div>
                        {isActive && (
                          <div className="mt-2 text-xs text-gray-600">
                            Aproximado: {approx} sesiones de {data?.totalSessions}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No data</p>
              )}
            </div>

            {/* Distribuciones: Subscription */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Subscription Types</h3>
                {selectedSub && (
                  <button
                    onClick={() => setSelectedSub(null)}
                    className="text-xs text-gray-600 hover:text-gray-900 underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              {data?.subscriptionTypes && data.subscriptionTypes.length > 0 ? (
                <div className="space-y-2">
                  {data.subscriptionTypes.map((d, idx) => {
                    const isActive = selectedSub === d.label;
                    const approx = approxCountFromPct(d.value, data?.totalUsers ?? 0);
                    return (
                      <div
                        key={`${d.label}-${idx}`}
                        className={[
                          'flex justify-between items-center rounded-md px-3 py-2 text-sm',
                          isActive ? 'bg-gray-100' : 'hover:bg-gray-50 cursor-pointer'
                        ].join(' ')}
                        onClick={() => setSelectedSub(isActive ? null : d.label)}
                      >
                        <span className="font-medium text-gray-800">{d.label}</span>
                        <span className="text-gray-700">{d.value}%</span>
                        {isActive && (
                          <div className="w-full text-xs text-gray-600 mt-2 col-span-2">
                            Aproximado: {approx} usuarios de {data?.totalUsers}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No data</p>
              )}
            </div>
          </div>

          {/* Serie temporal interactiva */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sessions Over Time</h3>
              {selectedPoint && (
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="text-xs text-gray-600 hover:text-gray-900 underline"
                >
                  Clear
                </button>
              )}
            </div>

            {data?.sessionsOverTime && data.sessionsOverTime.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <div ref={chartWrapRef} className="relative">
                  {(() => {
                    const points = data.sessionsOverTime.map(p => ({
                      date: String(p.date),
                      value: Number((p as any).value ?? 0),
                    }));
                    const n = points.length;
                    const max = Math.max(1, ...points.map(p => p.value));
                    const barW = 14;
                    const gap = 10;
                    const leftPad = 30;
                    const chartH = 220;
                    const baseY = 180;
                    const usableH = 150;
                    const minPx = 4;
                    const svgW = Math.max(900, leftPad + n * (barW + gap));
                    const showEvery = Math.max(1, Math.ceil(n / 12));

                    return (
                      <>
                        <svg width={svgW} height={chartH} className="block">
                          <line x1="20" y1={baseY} x2={svgW - 10} y2={baseY} stroke="#E5E7EB" />

                          {points.map((p, i) => {
                            const x = leftPad + i * (barW + gap);
                            const h = Math.max(minPx, (p.value / max) * usableH);
                            const y = baseY - h;
                            const isSelected = selectedPoint?.date === p.date && selectedPoint?.value === p.value;

                            return (
                              <g key={`${p.date}-${i}`}>
                                <rect
                                  x={x} y={y} width={barW} height={h} rx="2"
                                  fill={isSelected ? '#111827' : '#000000'}
                                  className="cursor-pointer"
                                  onMouseEnter={() =>
                                    setHoverPoint({ x: x + barW / 2, y, date: p.date, value: p.value })
                                  }
                                  onMouseLeave={() => setHoverPoint(null)}
                                  onClick={() =>
                                    setSelectedPoint(isSelected ? null : { date: p.date, value: p.value })
                                  }
                                />
                                {i % showEvery === 0 && (
                                  <text
                                    x={x + barW / 2}
                                    y={baseY + 15}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#6B7280"
                                  >
                                    {p.date}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </svg>

                        {/* Tooltip hover */}
                        {hoverPoint && (
                          <div
                            className="absolute pointer-events-none bg-white border border-gray-200 rounded shadow px-3 py-2 text-xs text-gray-800"
                            style={{
                              left: Math.max(0, hoverPoint.x - 40),
                              top: Math.max(0, hoverPoint.y - 38),
                            }}
                          >
                            <div className="font-medium">{hoverPoint.date}</div>
                            <div>{hoverPoint.value} sessions</div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Detalle “fijado” por click */}
                {selectedPoint && (
                  <div className="mt-3 text-sm text-gray-700">
                    <span className="font-medium">Selected:</span>{' '}
                    {selectedPoint.date} — {selectedPoint.value} sessions
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
