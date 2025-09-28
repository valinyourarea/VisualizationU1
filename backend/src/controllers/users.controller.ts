// backend/src/controllers/users.controller.ts
import type { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database';

const pool = mysql.createPool(dbConfig);

// GET /api/users
export async function getUsers(req: Request, res: Response) {
  try {
    const { 
      search = '', 
      sortBy = 'user_id', 
      order = 'ASC',
      page = 1,
      limit = 50
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build search condition
    let searchCondition = '';
    const searchParams: string[] = [];
    if (search) {
      searchCondition = `WHERE 
        u.user_id LIKE ? OR 
        u.country LIKE ? OR 
        s.name LIKE ?`;
      const searchTerm = `%${search}%`;
      searchParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Validate sort column
    const validSortColumns = ['user_id', 'age', 'country', 'subscription_type', 'total_sessions', 'total_minutes', 'last_activity'];
    const sortColumn = validSortColumns.includes(String(sortBy)) ? sortBy : 'user_id';
    const sortOrder = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // Main query with joins
    const query = `
      SELECT 
        u.user_id,
        u.age,
        u.country,
        s.name as subscription_type,
        COALESCE(um.total_sessions, 0) as total_sessions,
        COALESCE(um.total_minutes, 0) as total_watch_hours,
        COALESCE(um.avg_completion, 0) as avg_completion,
        um.favorite_device,
        um.last_activity
      FROM users u
      LEFT JOIN subscription_types s ON u.subscription_type_id = s.id
      LEFT JOIN user_metrics um ON u.user_id = um.user_id
      ${searchCondition}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    
    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN subscription_types s ON u.subscription_type_id = s.id
      ${searchCondition}
    `;
    
    // Execute queries
    const [users] = await pool.query(query, [...searchParams, Number(limit), offset]);
    const [[{ total }]]: any = await pool.query(countQuery, searchParams);
    
    // Format data
    const formattedUsers = (users as any[]).map(user => ({
      ...user,
      total_watch_hours: user.total_watch_hours ? Math.round(user.total_watch_hours / 60) : 0,
      avg_completion: user.avg_completion ? Math.round(user.avg_completion) : 0,
      last_activity: user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'
    }));
    
    return res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        pages: Math.ceil(Number(total) / Number(limit))
      }
    });
  } catch (err: any) {
    console.error('[users] error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err?.message || 'Internal error' 
    });
  }
}

// GET /api/users/stats
export async function getUserStats(req: Request, res: Response) {
  try {
    const [[stats]]: any = await pool.query(`
      SELECT 
        COUNT(DISTINCT u.user_id) as total_users,
        AVG(u.age) as avg_age,
        COUNT(DISTINCT u.country) as countries,
        AVG(um.total_sessions) as avg_sessions_per_user,
        AVG(um.total_minutes) as avg_minutes_per_user
      FROM users u
      LEFT JOIN user_metrics um ON u.user_id = um.user_id
    `);
    
    const [topCountries]: any = await pool.query(`
      SELECT country, COUNT(*) as count
      FROM users
      WHERE country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 5
    `);
    
    return res.json({
      success: true,
      stats: {
        total_users: stats.total_users || 0,
        avg_age: Math.round(stats.avg_age) || 0,
        countries: stats.countries || 0,
        avg_sessions: Math.round(stats.avg_sessions_per_user) || 0,
        avg_watch_hours: Math.round((stats.avg_minutes_per_user || 0) / 60),
        top_countries: topCountries
      }
    });
  } catch (err: any) {
    console.error('[user stats] error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err?.message || 'Internal error' 
    });
  }
}