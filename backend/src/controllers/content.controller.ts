import { Request, Response } from 'express';
import { MongoDBETLService } from '../services/mongodb-etl.service';
import Content from '../models/content.model';

const mongoETLService = new MongoDBETLService();

export const startMongoETL = async (req: Request, res: Response) => {
  try {
    const result = await mongoETLService.runETL();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'MongoDB ETL failed'
    });
  }
};

export const getContent = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      genre, 
      year,
      sortBy = 'rating',
      order = 'desc' 
    } = req.query;

    const query: any = {};
    
    if (genre) {
      query.genre = { $in: [genre] };
    }
    
    if (year) {
      query.release_year = Number(year);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const movies = await Content.find(query)
      .sort({ [sortBy as string]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const total = await Content.countDocuments(query);

    res.json({
      success: true,
      data: movies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getContentStats = async (req: Request, res: Response) => {
  try {
    const stats = await mongoETLService.getCollectionStats();
    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMongoSchema = async (req: Request, res: Response) => {
  try {
    const sampleDoc = await Content.findOne();
    
    const schema = {
      database: 'streaming_nosql',
      collection: 'movies',
      documentCount: await Content.countDocuments(),
      indexes: await Content.collection.indexes(),
      sampleDocument: sampleDoc,
      fields: sampleDoc ? Object.keys(sampleDoc.toObject()) : [],
      statistics: await mongoETLService.getCollectionStats()
    };

    res.json({
      success: true,
      schema
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};