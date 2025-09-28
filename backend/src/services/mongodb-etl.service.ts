// backend/src/services/mongodb-etl.service.ts
import fs from 'fs';
import path from 'path';
import Content from '../models/content.model';
import { connectMongoDB } from '../config/mongodb';

interface MovieData {
  content_id: string;
  title: string;
  genre: string[];
  duration_minutes: number;
  release_year: number;
  rating: number;
  views_count: number;
  production_budget: number;
}

interface ETLResult {
  success: boolean;
  message: string;
  stats: {
    totalDocuments: number;
    inserted: number;
    updated: number;
    failed: number;
    duration: number;
  };
}

export class MongoDBETLService {
  private startTime: number = 0;

  public async runETL(): Promise<ETLResult> {
    this.startTime = Date.now();
    const stats = {
      totalDocuments: 0,
      inserted: 0,
      updated: 0,
      failed: 0,
      duration: 0
    };

    try {
      // 1. Conectar a MongoDB
      await connectMongoDB();
      console.log('[MongoDB ETL] Connected to MongoDB');

      // 2. Leer archivo JSON
      const contentPath = process.env.CONTENT_JSON || '/app/data/content.json';
      const rawData = await fs.promises.readFile(contentPath, 'utf8');
      const jsonData = JSON.parse(rawData);
      const movies: MovieData[] = jsonData.movies || [];
      
      stats.totalDocuments = movies.length;
      console.log(`[MongoDB ETL] Found ${movies.length} movies to process`);

      // 3. Limpiar colección existente (opcional)
      await Content.deleteMany({});
      console.log('[MongoDB ETL] Cleared existing collection');

      // 4. Procesar películas en batch
      const batchSize = 100;
      for (let i = 0; i < movies.length; i += batchSize) {
        const batch = movies.slice(i, i + batchSize);
        
        try {
          const operations = batch.map(movie => ({
            updateOne: {
              filter: { content_id: movie.content_id },
              update: { $set: movie },
              upsert: true
            }
          }));

          const result = await Content.bulkWrite(operations);
          stats.inserted += result.upsertedCount;
          stats.updated += result.modifiedCount;

          console.log(`[MongoDB ETL] Batch ${Math.floor(i/batchSize) + 1}: Inserted ${result.upsertedCount}, Updated ${result.modifiedCount}`);
        } catch (batchError) {
          console.error(`[MongoDB ETL] Batch error:`, batchError);
          stats.failed += batch.length;
        }
      }

      // 5. Crear índices - SINTAXIS CORREGIDA
      await Content.collection.createIndex({ content_id: 1 });
      await Content.collection.createIndex({ genre: 1 });
      await Content.collection.createIndex({ release_year: -1 });
      await Content.collection.createIndex({ rating: -1 });
      console.log('[MongoDB ETL] Indexes created');

      // 6. Calcular duración
      stats.duration = Date.now() - this.startTime;

      return {
        success: true,
        message: 'MongoDB ETL completed successfully',
        stats
      };

    } catch (error: any) {
      stats.duration = Date.now() - this.startTime;
      console.error('[MongoDB ETL] Error:', error);
      
      return {
        success: false,
        message: error.message || 'ETL failed',
        stats
      };
    }
  }

  public async getCollectionStats() {
    try {
      const totalMovies = await Content.countDocuments();
      const genres = await Content.distinct('genre');
      const yearRange = await Content.aggregate([
        {
          $group: {
            _id: null,
            minYear: { $min: '$release_year' },
            maxYear: { $max: '$release_year' },
            avgRating: { $avg: '$rating' },
            totalViews: { $sum: '$views_count' },
            avgBudget: { $avg: '$production_budget' }
          }
        }
      ]);

      const genreStats = await Content.aggregate([
        { $unwind: '$genre' },
        { 
          $group: {
            _id: '$genre',
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
        totalMovies,
        uniqueGenres: genres.length,
        yearRange: yearRange[0] || {},
        genreDistribution: genreStats
      };
    } catch (error) {
      console.error('Error getting collection stats:', error);
      throw error;
    }
  }
}