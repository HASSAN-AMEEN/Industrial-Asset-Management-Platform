import { Router } from 'express';
import { ApiResponse } from '../../types';

/**
 * Test routes for API connectivity testing
 */

const router = Router();

/**
 * GET /api/test
 * Test endpoint to verify API is working
 */
router.get('/', (req, res) => {
  const payload: ApiResponse = {
    success: true,
    message: 'API working',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  };

  res.status(200).json(payload);
});

export default router;
