// backend/src/controllers/database.controller.ts
import type { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database';

const pool = mysql.createPool(dbConfig);

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  key: 'PRI' | 'MUL' | 'UNI' | '';
  default: any;
  extra: string;
}

interface ForeignKey {
  constraintName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

interface Table {
  name: string;
  columns: Column[];
  foreignKeys: ForeignKey[];
  rowCount: number;
}

// GET /api/database/schema
export async function getDatabaseSchema(_req: Request, res: Response) {
  try {
    // Obtener todas las tablas
    const [tables]: any = await pool.query(
      `SELECT TABLE_NAME, TABLE_ROWS 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_TYPE = 'BASE TABLE'`
    );

    const schema: Table[] = [];

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      // Obtener columnas de cada tabla
      const [columns]: any = await pool.query(
        `SELECT 
          COLUMN_NAME,
          COLUMN_TYPE,
          IS_NULLABLE,
          COLUMN_KEY,
          COLUMN_DEFAULT,
          EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION`,
        [tableName]
      );

      // Obtener foreign keys
      const [foreignKeys]: any = await pool.query(
        `SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL`,
        [tableName]
      );

      // Obtener conteo real de filas
      const [[{ count }]]: any = await pool.query(
        `SELECT COUNT(*) as count FROM \`${tableName}\``
      );

      schema.push({
        name: tableName,
        columns: columns.map((col: any) => ({
          name: col.COLUMN_NAME,
          type: col.COLUMN_TYPE,
          nullable: col.IS_NULLABLE === 'YES',
          key: col.COLUMN_KEY || '',
          default: col.COLUMN_DEFAULT,
          extra: col.EXTRA || ''
        })),
        foreignKeys: foreignKeys.map((fk: any) => ({
          constraintName: fk.CONSTRAINT_NAME,
          columnName: fk.COLUMN_NAME,
          referencedTable: fk.REFERENCED_TABLE_NAME,
          referencedColumn: fk.REFERENCED_COLUMN_NAME
        })),
        rowCount: Number(count) || 0
      });
    }

    return res.json({
      success: true,
      database: dbConfig.database,
      tables: schema,
      stats: {
        totalTables: schema.length,
        totalRows: schema.reduce((sum, t) => sum + t.rowCount, 0),
        relationships: schema.reduce((sum, t) => sum + t.foreignKeys.length, 0)
      }
    });
  } catch (err: any) {
    console.error('[database schema] error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err?.message || 'Internal error' 
    });
  }
}

// GET /api/database/stats
export async function getDatabaseStats(_req: Request, res: Response) {
  try {
    const conn = await pool.getConnection();
    
    try {
      // Tamaño de la base de datos
      const [[dbSize]]: any = await conn.query(`
        SELECT 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
      `);

      // Info de conexión
      const [[variables]]: any = await conn.query("SHOW VARIABLES LIKE 'version'");
      
      return res.json({
        success: true,
        stats: {
          database: dbConfig.database,
          host: dbConfig.host,
          port: dbConfig.port,
          version: variables?.Value || 'Unknown',
          sizeInMB: dbSize?.size_mb || 0,
          status: 'Connected'
        }
      });
    } finally {
      conn.release();
    }
  } catch (err: any) {
    console.error('[database stats] error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err?.message || 'Internal error' 
    });
  }
}