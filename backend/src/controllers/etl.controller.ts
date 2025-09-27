// ============= backend/src/controllers/etl.controller.ts =============
import { Request, Response } from 'express';
import { ETLService } from '../services/etl.service';

const etlService = new ETLService();

export const startETL = async (req: Request, res: Response) => {
  try {
    // Check if ETL is already running
    const currentStatus = etlService.getDAGStatus();
    if (currentStatus.status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'ETL pipeline is already running'
      });
    }

    // Start ETL in background
    etlService.runETL().catch(error => {
      console.error('ETL failed:', error);
    });

    res.json({
      success: true,
      message: 'ETL pipeline started',
      data: etlService.getDAGStatus()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getETLStatus = async (req: Request, res: Response) => {
  try {
    const status = etlService.getDAGStatus();
    res.json({
      success: true,
      dag: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const resetETL = async (req: Request, res: Response) => {
  try {
    const currentStatus = etlService.getDAGStatus();
    if (currentStatus.status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reset while ETL is running'
      });
    }

    etlService.resetETL();
    
    res.json({
      success: true,
      message: 'ETL pipeline reset successfully',
      data: etlService.getDAGStatus()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
