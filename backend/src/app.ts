import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { httpLogger } from './utils/logger';
import testRoutes from './modules/test/test.routes';
import trainingRoutes from './modules/training/training.routes';
import authRoutes from './modules/auth/auth.routes';
import warehouseRoutes from './modules/warehouse/warehouse.routes';
import machineRoutes from './modules/machine/machine.routes';
import shipmentRoutes from './modules/shipment/shipment.routes';
import clientRoutes from './modules/client/client.routes';
import installationRoutes from './modules/installation/installation.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import userRoutes from './modules/user/user.routes';

/**
 * Express application configuration
 * Sets up middleware, routes, and error handling
 */

const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: config.NODE_ENV === 'production' ? config.FRONTEND_URL : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP request logging
  app.use(httpLogger());

  // Serve locally-stored uploads (training PDFs, etc.).
  // Sets inline Content-Disposition so WebView renders the PDF instead of downloading.
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      setHeaders: (res, filePath) => {
        // Helmet defaults CORP to 'same-origin' which would block the mobile WebView
        // from loading these files. Allow cross-origin reads for upload assets.
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        if (filePath.toLowerCase().endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline');
        }
      },
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use('/api/training', trainingRoutes);
  app.use('/api/test', testRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/warehouses', warehouseRoutes);
  app.use('/api/machines', machineRoutes);
  app.use('/api/shipments', shipmentRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/installations', installationRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/users', userRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
