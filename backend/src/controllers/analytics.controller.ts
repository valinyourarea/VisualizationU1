// ============= backend/src/controllers/analytics.controller.ts =============
import type { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database';

// Pool reutilizable (no crear por request)
const pool = mysql.createPool(dbConfig);

// ---------- Column metadata cache ----------
type ColumnSet = Set<string>;
const columnCache = new Map<string, ColumnSet>();

async function loadColumns(table: string): Promise<ColumnSet> {
  const key = table.toLowerCase();
  if (!columnCache.has(key)) {
    const [rows]: any = await pool.query(
      `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?`,
      [table]
    );
    const set = new Set<string>();
    for (const r of rows as Array<{ COLUMN_NAME: string }>) {
      if (r?.COLUMN_NAME) set.add(String(r.COLUMN_NAME).toLowerCase());
    }
    columnCache.set(key, set);
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return columnCache.get(key)!;
}

// Helpers
async function columnExists(table: string, column: string) {
  const cols = await loadColumns(table);
  return cols.has(column.toLowerCase());
}

async function firstExistingColumn(table: string, candidates: string[]) {
  const cols = await loadColumns(table);
  for (const c of candidates) if (cols.has(c.toLowerCase())) return c;
  return null;
}

// GET /api/analytics
export async function getAnalytics(_req: Request, res: Response) {
  try {
    // Totales básicos
    const [[{ total_users }]]: any = await pool.query(
      'SELECT COUNT(*) AS total_users FROM users'
    );
    const [[{ total_sessions }]]: any = await pool.query(
      'SELECT COUNT(*) AS total_sessions FROM viewing_sessions'
    );

    // Promedio watch time (minutos). Intenta duration_minutes o watch_time
    let avgWatchTimeMinutes: number | null = null;
    if (await columnExists('viewing_sessions', 'duration_minutes')) {
      const [[{ avg_watch }]]: any = await pool.query(
        'SELECT AVG(duration_minutes) AS avg_watch FROM viewing_sessions'
      );
      avgWatchTimeMinutes = avg_watch != null ? Number(avg_watch) : null;
    } else if (await columnExists('viewing_sessions', 'watch_time')) {
      const [[{ avg_watch }]]: any = await pool.query(
        'SELECT AVG(watch_time) AS avg_watch FROM viewing_sessions'
      );
      avgWatchTimeMinutes = avg_watch != null ? Number(avg_watch) : null;
    }

    // Completion rate: completion_percentage (0..100) o completed (0/1)
    let completionRate: number | null = null;
    if (await columnExists('viewing_sessions', 'completion_percentage')) {
      const [[{ avg_c }]]: any = await pool.query(
        'SELECT AVG(completion_percentage) AS avg_c FROM viewing_sessions'
      );
      completionRate = avg_c != null ? Number(avg_c) : null;
    } else if (await columnExists('viewing_sessions', 'completed')) {
      const [[{ avg_c }]]: any = await pool.query(
        'SELECT AVG(CASE WHEN completed IN (1, TRUE) THEN 1 ELSE 0 END) AS avg_c FROM viewing_sessions'
      );
      completionRate = avg_c != null ? Number(avg_c) * 100 : null;
    }

    // Distribución por dispositivo (device_types.name / viewing_sessions.device_type_id)
    let deviceDistribution: Array<{ label: string; value: number }> = [];
    const totalSessionsForPct =
      total_sessions && Number(total_sessions) > 0 ? Number(total_sessions) : 0;

    if (
      (await columnExists('device_types', 'id')) &&
      (await columnExists('device_types', 'name')) &&
      (await columnExists('viewing_sessions', 'device_type_id')) &&
      totalSessionsForPct > 0
    ) {
      const [rows]: any = await pool.query(
        `SELECT dt.name AS label,
                COUNT(vs.session_id) AS cnt
           FROM device_types dt
      LEFT JOIN viewing_sessions vs ON dt.id = vs.device_type_id
          GROUP BY dt.id, dt.name
          ORDER BY cnt DESC`
      );
      deviceDistribution = (rows as any[]).map((r) => ({
        label: String(r.label),
        value: totalSessionsForPct
          ? Math.round((Number(r.cnt || 0) * 100) / totalSessionsForPct)
          : 0,
      }));
    }

    // Distribución por tipo de suscripción (users.subscription_type_id)
    let subscriptionTypes: Array<{ label: string; value: number }> = [];
    const totalUsersForPct =
      total_users && Number(total_users) > 0 ? Number(total_users) : 0;

    if (
      (await columnExists('subscription_types', 'id')) &&
      (await columnExists('subscription_types', 'name')) &&
      (await columnExists('users', 'subscription_type_id')) &&
      totalUsersForPct > 0
    ) {
      const [rows]: any = await pool.query(
        `SELECT st.name AS label,
                COUNT(u.user_id) AS cnt
           FROM subscription_types st
      LEFT JOIN users u ON st.id = u.subscription_type_id
          GROUP BY st.id, st.name
          ORDER BY cnt DESC`
      );
      subscriptionTypes = (rows as any[]).map((r) => ({
        label: String(r.label),
        value: totalUsersForPct
          ? Math.round((Number(r.cnt || 0) * 100) / totalUsersForPct)
          : 0,
      }));
    }

    // Serie temporal de sesiones (elige mejor columna de fecha disponible)
    const dateCol = await firstExistingColumn('viewing_sessions', [
      'watch_date',
      'session_date',
      'start_time',
      'created_at',
      'timestamp',
    ]);

    let sessionsOverTime: Array<{ date: string; value: number }> = [];
    if (dateCol) {
      const [rows]: any = await pool.query(
        `SELECT DATE(${dateCol}) AS d, COUNT(*) AS c
           FROM viewing_sessions
          WHERE ${dateCol} IS NOT NULL
       GROUP BY DATE(${dateCol})
       ORDER BY d ASC`
      );
      sessionsOverTime = (rows as any[]).map((r) => ({
        date:
          r.d instanceof Date
            ? r.d.toISOString().slice(0, 10)
            : String(r.d),
        value: Number(r.c || 0),
      }));
    }

    const analytics = {
      totalUsers: Number(total_users) || 0,
      totalSessions: Number(total_sessions) || 0,
      avgWatchTimeMinutes:
        avgWatchTimeMinutes != null ? Math.round(avgWatchTimeMinutes) : null,
      completionRate:
        completionRate != null ? Math.round(Number(completionRate)) : null,
      deviceDistribution,
      subscriptionTypes,
      sessionsOverTime,
    };

    return res.json({ analytics });
  } catch (err: any) {
    console.error('[analytics] error:', err);
    return res
      .status(500)
      .json({ success: false, message: err?.message || 'Internal error' });
  }
}

// GET /api/metrics
export async function getMetrics(_req: Request, res: Response) {
  try {
    // Columnas alternativas para fecha por si no existe watch_date
    const candidateDate = await firstExistingColumn('viewing_sessions', [
      'watch_date',
      'created_at',
      'timestamp',
      'start_time',
      'session_date',
    ]);

    const dateExpr = candidateDate
      ? `COALESCE(vs.${candidateDate})`
      : `vs.watch_date`;

    const [[row]]: any = await pool.query(
      `SELECT
         COUNT(DISTINCT u.user_id)      AS uniqueUsers,
         COUNT(DISTINCT vs.content_id)  AS uniqueContent,
         SUM(vs.duration_minutes)       AS totalWatchMinutes,
         MAX(${dateExpr})               AS lastActivity
       FROM users u
       LEFT JOIN viewing_sessions vs ON u.user_id = vs.user_id`
    );

    return res.json({
      success: true,
      data: {
        uniqueUsers: Number(row?.uniqueUsers || 0),
        uniqueContent: Number(row?.uniqueContent || 0),
        totalWatchMinutes: Number(row?.totalWatchMinutes || 0),
        lastActivity:
          row?.lastActivity instanceof Date
            ? row.lastActivity.toISOString()
            : row?.lastActivity ?? null,
      },
    });
  } catch (err: any) {
    console.error('[metrics] error:', err);
    return res
      .status(500)
      .json({ success: false, message: err?.message || 'Internal error' });
  }
}

