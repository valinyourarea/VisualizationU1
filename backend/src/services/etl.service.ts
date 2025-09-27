import fs from 'fs';
import csv from 'csv-parser';
import mysql from 'mysql2/promise';

export interface ETLNode {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  dependencies: string[];
}

export interface ETLDag {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  nodes: ETLNode[];
  startTime?: Date;
  endTime?: Date;
  currentNode?: string;
}

export class ETLService {
  private connection: mysql.Pool | null = null;
  private dag: ETLDag;

  constructor() {
    this.dag = this.initializeDAG();
  }

  private initializeDAG(): ETLDag {
    return {
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
    };
  }

  async connectDB() {
    if (!this.connection) {
      this.connection = mysql.createPool({
        host: process.env.DB_HOST || 'mysql',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'etluser',
        password: process.env.DB_PASSWORD || 'etlpass',
        database: process.env.DB_NAME || 'streaming_db',
        waitForConnections: true,
        connectionLimit: 10
      });
    }
    return this.connection;
  }

  async runETL() {
    try {
      this.dag = this.initializeDAG();
      this.dag.status = 'running';
      this.dag.startTime = new Date();

      const pool = await this.connectDB();

      // Execute nodes in order
      await this.executeNode('validate_files', () => this.validateFiles());
      await this.executeNode('create_schema', () => this.createSchema(pool));
      await this.executeNode('load_dimensions', () => this.loadDimensions(pool));
      await this.executeNode('process_users', () => this.processUsers(pool));
      await this.executeNode('process_sessions', () => this.processSessions(pool));
      await this.executeNode('create_aggregations', () => this.createAggregations(pool));
      await this.executeNode('validate_data', () => this.validateData(pool));
      await this.executeNode('generate_stats', () => this.generateStatistics(pool));

      this.dag.status = 'completed';
      this.dag.endTime = new Date();

    } catch (error) {
      this.dag.status = 'failed';
      this.dag.endTime = new Date();
      throw error;
    }
  }

  private async executeNode(nodeId: string, task: () => Promise<void>) {
    const node = this.dag.nodes.find(n => n.id === nodeId);
    if (!node) return;

    try {
      node.status = 'running';
      node.startTime = new Date();
      this.dag.currentNode = nodeId;

      await task();
      
      node.status = 'success';
      node.endTime = new Date();
    } catch (error) {
      node.status = 'failed';
      node.endTime = new Date();
      node.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Mark dependent nodes as skipped
      this.markDependentsAsSkipped(nodeId);
      
      throw error;
    }
  }

  private markDependentsAsSkipped(failedNodeId: string) {
    this.dag.nodes.forEach(node => {
      if (node.dependencies.includes(failedNodeId) && node.status === 'pending') {
        node.status = 'skipped';
      }
    });
  }

  private async validateFiles(): Promise<void> {
    const usersFile = '/app/data/users.csv';
    const sessionsFile = '/app/data/viewing_sessions.csv';

    if (!fs.existsSync(usersFile)) {
      throw new Error('Users CSV file not found');
    }
    if (!fs.existsSync(sessionsFile)) {
      throw new Error('Sessions CSV file not found');
    }

    // Simulate processing time
    await this.sleep(1000);
  }

  private async createSchema(pool: mysql.Pool): Promise<void> {
    const queries = [
      'DROP TABLE IF EXISTS user_metrics',
      'DROP TABLE IF EXISTS viewing_sessions',
      'DROP TABLE IF EXISTS users',
      'DROP TABLE IF EXISTS subscription_types',
      'DROP TABLE IF EXISTS device_types',
      
      `CREATE TABLE subscription_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) UNIQUE,
        price DECIMAL(10, 2)
      )`,
      
      `CREATE TABLE device_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) UNIQUE,
        category VARCHAR(50)
      )`,
      
      `CREATE TABLE users (
        user_id VARCHAR(20) PRIMARY KEY,
        age INT,
        country VARCHAR(100),
        subscription_type_id INT,
        registration_date DATE,
        total_watch_hours DECIMAL(10, 2),
        FOREIGN KEY (subscription_type_id) REFERENCES subscription_types(id)
      )`,
      
      `CREATE TABLE viewing_sessions (
        session_id VARCHAR(20) PRIMARY KEY,
        user_id VARCHAR(20),
        content_id VARCHAR(20),
        device_type_id INT,
        quality VARCHAR(10),
        watch_date DATE,
        duration_minutes INT,
        completion_percentage DECIMAL(5, 2),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (device_type_id) REFERENCES device_types(id)
      )`,
      
      `CREATE TABLE user_metrics (
        user_id VARCHAR(20) PRIMARY KEY,
        total_sessions INT,
        avg_completion DECIMAL(5, 2),
        favorite_device VARCHAR(50),
        last_activity DATE,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )`
    ];

    const connection = await pool.getConnection();
    try {
      for (const query of queries) {
        await connection.execute(query);
      }
    } finally {
      connection.release();
    }
    
    await this.sleep(1500);
  }

  private async loadDimensions(pool: mysql.Pool): Promise<void> {
    const connection = await pool.getConnection();
    try {
      // Load subscription types
      await connection.execute(
        `INSERT INTO subscription_types (name, price) VALUES 
         ('Basic', 8.99), ('Standard', 13.99), ('Premium', 17.99)`
      );
      
      // Load device types
      await connection.execute(
        `INSERT INTO device_types (name, category) VALUES 
         ('Desktop', 'Computer'), ('Mobile', 'Phone'), 
         ('Smart TV', 'Television'), ('Tablet', 'Tablet')`
      );
    } finally {
      connection.release();
    }
    
    await this.sleep(1000);
  }

  private async processUsers(pool: mysql.Pool): Promise<void> {
    const users: any[] = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream('/app/data/users.csv')
        .pipe(csv())
        .on('data', (data) => users.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const connection = await pool.getConnection();
    try {
      for (const user of users.slice(0, 100)) { // Process first 100 for demo
        await connection.execute(
          `INSERT INTO users (user_id, age, country, subscription_type_id, registration_date, total_watch_hours)
           SELECT ?, ?, ?, id, ?, ?
           FROM subscription_types WHERE name = ? LIMIT 1`,
          [user.user_id, user.age, user.country, user.registration_date, 
           user.total_watch_time_hours, user.subscription_type]
        );
      }
    } finally {
      connection.release();
    }
    
    await this.sleep(2000);
  }

  private async processSessions(pool: mysql.Pool): Promise<void> {
    const sessions: any[] = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream('/app/data/viewing_sessions.csv')
        .pipe(csv())
        .on('data', (data) => sessions.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const connection = await pool.getConnection();
    try {
      for (const session of sessions.slice(0, 200)) { // Process first 200 for demo
        await connection.execute(
          `INSERT INTO viewing_sessions 
           (session_id, user_id, content_id, device_type_id, quality, watch_date, duration_minutes, completion_percentage)
           SELECT ?, ?, ?, dt.id, ?, ?, ?, ?
           FROM device_types dt WHERE dt.name = ? LIMIT 1`,
          [session.session_id, session.user_id, session.content_id, session.quality_level,
           session.watch_date, session.watch_duration_minutes, session.completion_percentage,
           session.device_type]
        );
      }
    } finally {
      connection.release();
    }
    
    await this.sleep(2500);
  }

  private async createAggregations(pool: mysql.Pool): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.execute(`
        INSERT INTO user_metrics (user_id, total_sessions, avg_completion, last_activity)
        SELECT 
          u.user_id,
          COUNT(vs.session_id),
          AVG(vs.completion_percentage),
          MAX(vs.watch_date)
        FROM users u
        LEFT JOIN viewing_sessions vs ON u.user_id = vs.user_id
        GROUP BY u.user_id
        ON DUPLICATE KEY UPDATE
          total_sessions = VALUES(total_sessions),
          avg_completion = VALUES(avg_completion),
          last_activity = VALUES(last_activity)
      `);
    } finally {
      connection.release();
    }
    
    await this.sleep(1500);
  }

  private async validateData(pool: mysql.Pool): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
      const [sessionCount] = await connection.execute('SELECT COUNT(*) as count FROM viewing_sessions');
      
      console.log('Data validation:', { userCount, sessionCount });
    } finally {
      connection.release();
    }
    
    await this.sleep(1000);
  }

  private async generateStatistics(pool: mysql.Pool): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(DISTINCT u.user_id) as total_users,
          COUNT(DISTINCT vs.session_id) as total_sessions,
          AVG(vs.completion_percentage) as avg_completion
        FROM users u
        LEFT JOIN viewing_sessions vs ON u.user_id = vs.user_id
      `);
      
      console.log('Statistics generated:', stats);
    } finally {
      connection.release();
    }
    
    await this.sleep(800);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDAGStatus(): ETLDag {
    return this.dag;
  }

  resetETL() {
    this.dag = this.initializeDAG();
  }
}