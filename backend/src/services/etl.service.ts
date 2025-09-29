import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database';

type NodeStatus = 'pending' | 'running' | 'success' | 'failed';

// Estructura que espera el frontend
interface DagNode {
  id: string;
  name: string;
  status: NodeStatus;
  dependencies?: string[];
  startTime?: string;
  endTime?: string;
  error?: string;
}

interface DagResponse {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  nodes: DagNode[];
  startTime?: string;
  endTime?: string;
  currentNode?: string;
  stats?: {
    totalNodes: number;
    completed: number;
    running: number;
    failed: number;
  };
}

// Estructura interna del servicio
interface InternalNode {
  id: string;
  name: string;
  status: NodeStatus;
  dependencies: string[];
  startedAt?: number;
  finishedAt?: number;
  error?: string;
}

function nowSec() { return Date.now() / 1000; }
function ms(start: number) { return Math.max(0, Math.round((nowSec() - start) * 10) / 10); }

export class ETLService {
  private pool = mysql.createPool(dbConfig);
  private nodes: InternalNode[];
  private dagStatus: 'idle' | 'running' | 'success' | 'error';
  private dagStartTime?: Date;
  private dagEndTime?: Date;
  private currentNodeId?: string;

  constructor() {
    this.nodes = this.getInitialNodes();
    this.dagStatus = 'idle';
  }

  private getInitialNodes(): InternalNode[] {
    return [
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
      },
    ];
  }

  public getDAGStatus(): DagResponse {
    const completed = this.nodes.filter(n => n.status === 'success').length;
    const running = this.nodes.filter(n => n.status === 'running').length;
    const failed = this.nodes.filter(n => n.status === 'failed').length;

    // Convertir nodos internos al formato del frontend
    const frontendNodes: DagNode[] = this.nodes.map(node => ({
      id: node.id,
      name: node.name,
      status: node.status,
      dependencies: node.dependencies.length > 0 ? node.dependencies : undefined,
      startTime: node.startedAt ? new Date(node.startedAt * 1000).toISOString() : undefined,
      endTime: node.finishedAt ? new Date(node.finishedAt * 1000).toISOString() : undefined,
      error: node.error
    }));

    return {
      id: 'streaming_etl_dag',
      name: 'Streaming Data ETL Pipeline',
      status: this.dagStatus,
      nodes: frontendNodes,
      startTime: this.dagStartTime?.toISOString(),
      endTime: this.dagEndTime?.toISOString(),
      currentNode: this.currentNodeId,
      stats: {
        totalNodes: this.nodes.length,
        completed,
        running,
        failed
      }
    };
  }

  public resetETL() {
    this.nodes = this.getInitialNodes();
    this.dagStatus = 'idle';
    this.dagStartTime = undefined;
    this.dagEndTime = undefined;
    this.currentNodeId = undefined;
  }

  private setNodeStatus(nodeId: string, status: NodeStatus, error?: string) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    node.status = status;
    
    if (status === 'running') {
      node.startedAt = nowSec();
      this.currentNodeId = nodeId;
    }
    
    if (status === 'success' || status === 'failed') {
      node.finishedAt = nowSec();
      if (this.currentNodeId === nodeId) {
        this.currentNodeId = undefined;
      }
    }
    
    if (error) {
      node.error = error;
    }
  }

  // -------------------------------------------------------------------
  // RUN ETL
  // -------------------------------------------------------------------
  public async runETL() {
    this.resetETL();
    this.dagStatus = 'running';
    this.dagStartTime = new Date();

    try {
      // Ejecutar cada paso en orden
      await this.stepValidate();
      await this.stepSchema();
      await this.stepLoadDims();
      await this.stepUsers();
      await this.stepSessions();
      await this.stepAggregations();
      await this.stepQuality();
      await this.stepFinish();

      this.dagStatus = 'success';
      this.dagEndTime = new Date();
    } catch (err: any) {
      const msg = err?.message || String(err);
      this.dagStatus = 'error';
      this.dagEndTime = new Date();
      
      // Marcar el nodo actual como fallido
      const runningNode = this.nodes.find(n => n.status === 'running');
      if (runningNode) {
        this.setNodeStatus(runningNode.id, 'failed', msg);
      }
      
      throw err;
    }
  }

  // -------------------------------------------------------------------
  // Steps (actualizados con los IDs correctos)
  // -------------------------------------------------------------------
  private async stepValidate() {
    this.setNodeStatus('validate_files', 'running');
    
    const USERS_CSV = process.env.USERS_CSV || '/app/data/users.csv';
    const SESSIONS_CSV = process.env.SESSIONS_CSV || '/app/data/viewing_sessions.csv';

    if (!fs.existsSync(USERS_CSV)) {
      throw new Error(`users.csv no encontrado en ${USERS_CSV}`);
    }
    if (!fs.existsSync(SESSIONS_CSV)) {
      throw new Error(`viewing_sessions.csv no encontrado en ${SESSIONS_CSV}`);
    }

    // Log de líneas para diagnóstico
    try {
      const usersLines = (await fs.promises.readFile(USERS_CSV, 'utf8')).split('\n').length;
      const sessLines = (await fs.promises.readFile(SESSIONS_CSV, 'utf8')).split('\n').length;
      console.log(`[ETL] USERS_CSV lines: ${usersLines}`);
      console.log(`[ETL] SESSIONS_CSV lines: ${sessLines}`);
    } catch { /* no-op */ }

    // Simular algo de trabajo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.setNodeStatus('validate_files', 'success');
  }

  private async stepSchema() {
    this.setNodeStatus('create_schema', 'running');
    
    const conn = await this.pool.getConnection();
    try {
      // Verificar que las tablas existan
      await conn.query('SELECT 1 FROM subscription_types LIMIT 1');
      await conn.query('SELECT 1 FROM device_types LIMIT 1');
      await conn.query('SELECT 1 FROM users LIMIT 1');
      await conn.query('SELECT 1 FROM viewing_sessions LIMIT 1');
      await conn.query('SELECT 1 FROM user_metrics LIMIT 1');
    } finally {
      conn.release();
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    this.setNodeStatus('create_schema', 'success');
  }

  private async stepLoadDims() {
    this.setNodeStatus('load_dimensions', 'running');
    
    const conn = await this.pool.getConnection();
    try {
      // Cargar dimensiones
      await conn.query(
        `INSERT INTO device_types (name) VALUES ('Desktop'), ('Mobile'), ('Smart TV'), ('Tablet'), ('Other')
         ON DUPLICATE KEY UPDATE name = VALUES(name)`
      );
      await conn.query(
        `INSERT INTO subscription_types (name, price) VALUES
          ('Basic', 5.99), ('Standard', 9.99), ('Premium', 14.99)
         ON DUPLICATE KEY UPDATE price = VALUES(price)`
      );
    } finally {
      conn.release();
    }

    await new Promise(resolve => setTimeout(resolve, 700));
    this.setNodeStatus('load_dimensions', 'success');
  }

  private async stepUsers() {
    this.setNodeStatus('process_users', 'running');
    
    const USERS_CSV = process.env.USERS_CSV || '/app/data/users.csv';
    const conn = await this.pool.getConnection();
    
    try {
      // Limpiar datos anteriores
      await conn.query('DELETE FROM user_metrics');
      await conn.query('DELETE FROM users');

      const subIdCache = await this.buildSubTypeCache(conn);
      const batch: any[] = [];
      const BATCH_SIZE = 1000;

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(USERS_CSV)
          .pipe(csv())
          .on('data', (raw: any) => {
            const user_id = String(raw.user_id ?? raw.USER_ID ?? raw.UserId ?? '').trim();
            if (!user_id) return;

            const age = Number(String(raw.age ?? raw.Age ?? '').replace(/[^\d]/g, '')) || null;
            const country = (raw.country ?? raw.Country ?? '').toString().trim() || null;
            const subName = (raw.subscription_type ?? raw.subscription ?? raw.Subscription ?? '').toString().trim() || null;
            const subId = subName ? (subIdCache.get(subName) ?? null) : null;

            batch.push([user_id, age, country, subId]);

            if (batch.length >= BATCH_SIZE) {
              const chunk = batch.splice(0, batch.length);
              conn.query(
                `INSERT INTO users (user_id, age, country, subscription_type_id)
                 VALUES ?
                 ON DUPLICATE KEY UPDATE age=VALUES(age), country=VALUES(country), subscription_type_id=VALUES(subscription_type_id)`,
                [chunk]
              ).catch(reject);
            }
          })
          .on('end', async () => {
            if (batch.length) {
              await conn.query(
                `INSERT INTO users (user_id, age, country, subscription_type_id)
                 VALUES ?
                 ON DUPLICATE KEY UPDATE age=VALUES(age), country=VALUES(country), subscription_type_id=VALUES(subscription_type_id)`,
                [batch]
              );
            }
            resolve();
          })
          .on('error', reject);
      });
    } finally {
      conn.release();
    }

    this.setNodeStatus('process_users', 'success');
  }

  private async stepSessions() {
    this.setNodeStatus('process_sessions', 'running');
    
    const SESSIONS_CSV = process.env.SESSIONS_CSV || '/app/data/viewing_sessions.csv';
    const conn = await this.pool.getConnection();
    
    try {
      await conn.query('DELETE FROM viewing_sessions');

      const devIdCache = await this.buildDeviceTypeCache(conn);
      const BATCH_SIZE = 1000;
      const batch: any[] = [];

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(SESSIONS_CSV)
          .pipe(csv())
          .on('data', (raw: any) => {
            const session_id = String(raw.session_id ?? raw.SESSION_ID ?? raw.SessionId ?? '').trim();
            const user_id = String(raw.user_id ?? raw.USER_ID ?? raw.UserId ?? '').trim();
            if (!session_id || !user_id) return;

            const content_id = (raw.content_id ?? raw.CONTENT_ID ?? raw.ContentId ?? '').toString().trim() || null;
            
            const rawDate = (raw.watch_date ?? raw.date ?? raw.WatchDate ?? '').toString().trim();
            const watch_date = rawDate ? new Date(rawDate) : null;
            const dateVal = watch_date && !isNaN(watch_date.getTime()) ? watch_date : null;

            const duration_minutes = Number(String(raw.watch_duration_minutes ?? raw.duration_minutes ?? raw.duration ?? raw.minutes ?? '').replace(/[^\d.-]/g, ''));
            const dur = Number.isFinite(duration_minutes) ? Math.round(duration_minutes) : null;

            const comp = Number(String(raw.completion_percentage ?? raw.completion ?? raw.Completion ?? '').replace(/[^\d.-]/g, ''));
            const completion = Number.isFinite(comp) ? comp : null;

            const devName = (raw.device_type ?? raw.device ?? raw.Device ?? '').toString().trim();
            const device_type_id = devName ? (devIdCache.get(devName) ?? devIdCache.get('Other') ?? null) : null;

            batch.push([
              session_id, 
              user_id, 
              content_id, 
              dateVal ? dateVal.toISOString().slice(0, 19).replace('T', ' ') : null, 
              dur, 
              completion, 
              device_type_id
            ]);

            if (batch.length >= BATCH_SIZE) {
              const chunk = batch.splice(0, batch.length);
              conn.query(
                `INSERT INTO viewing_sessions
                  (session_id, user_id, content_id, watch_date, duration_minutes, completion_percentage, device_type_id)
                 VALUES ?
                 ON DUPLICATE KEY UPDATE
                  user_id=VALUES(user_id),
                  content_id=VALUES(content_id),
                  watch_date=VALUES(watch_date),
                  duration_minutes=VALUES(duration_minutes),
                  completion_percentage=VALUES(completion_percentage),
                  device_type_id=VALUES(device_type_id)`,
                [chunk]
              ).catch(reject);
            }
          })
          .on('end', async () => {
            if (batch.length) {
              await conn.query(
                `INSERT INTO viewing_sessions
                  (session_id, user_id, content_id, watch_date, duration_minutes, completion_percentage, device_type_id)
                 VALUES ?
                 ON DUPLICATE KEY UPDATE
                  user_id=VALUES(user_id),
                  content_id=VALUES(content_id),
                  watch_date=VALUES(watch_date),
                  duration_minutes=VALUES(duration_minutes),
                  completion_percentage=VALUES(completion_percentage),
                  device_type_id=VALUES(device_type_id)`,
                [batch]
              );
            }
            resolve();
          })
          .on('error', reject);
      });
    } finally {
      conn.release();
    }

    this.setNodeStatus('process_sessions', 'success');
  }

  private async stepAggregations() {
    this.setNodeStatus('create_aggregations', 'running');
    
    const conn = await this.pool.getConnection();
    try {
      await conn.query('DELETE FROM user_metrics');

      await conn.query(`
        INSERT INTO user_metrics (user_id, total_sessions, total_minutes, avg_completion, last_activity, favorite_device)
        SELECT 
          u.user_id,
          COUNT(vs.session_id) AS total_sessions,
          COALESCE(SUM(vs.duration_minutes), 0) AS total_minutes,
          COALESCE(AVG(vs.completion_percentage), 0) AS avg_completion,
          MAX(vs.watch_date) AS last_activity,
          (
            SELECT dt.name
            FROM viewing_sessions vs2
            JOIN device_types dt ON dt.id = vs2.device_type_id
            WHERE vs2.user_id = u.user_id
            GROUP BY dt.name
            ORDER BY COUNT(*) DESC
            LIMIT 1
          ) AS favorite_device
        FROM users u
        LEFT JOIN viewing_sessions vs ON vs.user_id = u.user_id
        GROUP BY u.user_id
      `);
    } finally {
      conn.release();
    }

    await new Promise(resolve => setTimeout(resolve, 1200));
    this.setNodeStatus('create_aggregations', 'success');
  }

  private async stepQuality() {
    this.setNodeStatus('validate_data', 'running');
    
    const conn = await this.pool.getConnection();
    try {
      const [[{ cUsers }]]: any = await conn.query('SELECT COUNT(*) AS cUsers FROM users');
      const [[{ cSess }]]: any = await conn.query('SELECT COUNT(*) AS cSess FROM viewing_sessions');

      if (Number(cUsers) === 0) throw new Error('No se cargaron usuarios');
      if (Number(cSess) === 0) throw new Error('No se cargaron sesiones');

      const [[{ badDates }]]: any = await conn.query(
        'SELECT COUNT(*) AS badDates FROM viewing_sessions WHERE watch_date IS NULL'
      );
      if (badDates > 0) {
        console.warn(`[QUALITY] ${badDates} filas sin watch_date`);
      }
    } finally {
      conn.release();
    }

    await new Promise(resolve => setTimeout(resolve, 600));
    this.setNodeStatus('validate_data', 'success');
  }

  private async stepFinish() {
    this.setNodeStatus('generate_stats', 'running');
    
    // Simular generación de estadísticas
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log('[ETL] Pipeline completed successfully!');
    this.setNodeStatus('generate_stats', 'success');
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------
  private async buildDeviceTypeCache(conn: mysql.PoolConnection) {
    const map = new Map<string, number>();
    const [rows]: any = await conn.query('SELECT id, name FROM device_types');
    for (const r of rows) map.set(String(r.name), Number(r.id));
    return map;
  }

  private async buildSubTypeCache(conn: mysql.PoolConnection) {
    const map = new Map<string, number>();
    const [rows]: any = await conn.query('SELECT id, name FROM subscription_types');
    for (const r of rows) map.set(String(r.name), Number(r.id));
    return map;
  }
}
