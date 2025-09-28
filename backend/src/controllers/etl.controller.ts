import type { Request, Response } from 'express';
import { ETLService } from '../services/etl.service';

const etlService = new ETLService();

/** Helper: deshabilitar caché para respuestas dinámicas */
function noStore(res: Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

/**
 * POST /api/etl/start
 * Inicia la ejecución del ETL (asíncrona).
 */
export async function startETL(_req: Request, res: Response) {
  try {
    noStore(res);

    const current = etlService.getDAGStatus();
    if (current.status === 'running') {
      return res.status(409).json({
        success: false,
        message: 'ETL pipeline is already running',
        dag: current,
      });
    }

    // Ejecuta en background
    etlService.runETL().catch((err) => {
      console.error('ETL failed:', err);
    });

    return res.json({
      success: true,
      message: 'ETL pipeline started',
      dag: etlService.getDAGStatus(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, message });
  }
}

/**
 * GET /api/etl/status
 * Devuelve el estado actual del DAG del ETL.
 */
export async function getETLStatus(_req: Request, res: Response) {
  try {
    noStore(res);
    const dag = etlService.getDAGStatus();
    return res.json({ success: true, dag });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, message });
  }
}

/**
 * POST /api/etl/reset
 * Resetea el estado del ETL (solo si NO está corriendo).
 */
export async function resetETL(_req: Request, res: Response) {
  try {
    noStore(res);

    const current = etlService.getDAGStatus();
    if (current.status === 'running') {
      return res.status(409).json({
        success: false,
        message: 'Cannot reset while ETL is running',
        dag: current,
      });
    }

    etlService.resetETL();

    return res.json({
      success: true,
      message: 'ETL pipeline reset successfully',
      dag: etlService.getDAGStatus(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, message });
  }
}
