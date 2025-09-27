// ============= backend/src/controllers/analytics.controller.ts =============
import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database';

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();

    try {
      // Get total users
      const [userCount]: any = await connection.execute(
        'SELECT COUNT(*) as totalUsers FROM users'
      );

      // Get total sessions
      const [sessionCount]: any = await connection.execute(
        'SELECT COUNT(*) as totalSessions FROM viewing_sessions'
      );

      // Get average watch time
      const [avgWatch]: any = await connection.execute(
        'SELECT AVG(duration_minutes) as avgWatchTime FROM viewing_sessions'
      );

      // Get completion rate
      const [avgCompletion]: any = await connection.execute(
        'SELECT AVG(completion_percentage) as avgCompletionRate FROM viewing_sessions'
      );

      // Get device distribution
      const [deviceDist]: any = await connection.execute(`
        SELECT 
          dt.name as device,
          COUNT(vs.session_id) as count,
          (COUNT(vs.session_id) * 100.0 / (SELECT COUNT(*) FROM viewing_sessions)) as percentage
        FROM device_types dt
        LEFT JOIN viewing_sessions vs ON dt.id = vs.device_type_id
        GROUP BY dt.id, dt.name
      `);

      // Get subscription distribution
      const [subDist]: any = await connection.execute(`
        SELECT 
          st.name as type,
          COUNT(u.user_id) as count,
          st.price * COUNT(u.user_id) as revenue
        FROM subscription_types st
        LEFT JOIN users u ON st.id = u.subscription_type_id
        GROUP BY st.id, st.name, st.price
      `);

      res.json({
        totalUsers: userCount[0]?.totalUsers || 0,
        totalSessions: sessionCount[0]?.totalSessions || 0,
        avgWatchTime: Math.round(avgWatch[0]?.avgWatchTime || 0),
        avgCompletionRate: Math.round(avgCompletion[0]?.avgCompletionRate || 0),
        deviceDistribution: deviceDist || [],
        subscriptionDistribution: subDist || []
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();

    try {
      const [metrics]: any = await connection.execute(`
        SELECT 
          COUNT(DISTINCT u.user_id) as uniqueUsers,
          COUNT(DISTINCT vs.content_id) as uniqueContent,
          SUM(vs.duration_minutes) as totalWatchMinutes,
          MAX(vs.watch_date) as lastActivity
        FROM users u
        LEFT JOIN viewing_sessions vs ON u.user_id = vs.user_id
      `);

      res.json({
        success: true,
        data: metrics[0]
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
