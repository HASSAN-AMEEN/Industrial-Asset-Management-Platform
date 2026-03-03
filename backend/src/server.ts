import createApp from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';

/**
 * Server startup and shutdown logic
 */

const server = async () => {
  try {
    // Test database connection
    try {
      await prisma.$connect();
      logger.info('Database connected successfully');
    } catch (dbError) {
      logger.error('Database connection failed:', dbError);

      if (config.NODE_ENV === 'production') {
        throw dbError;
      }
    }

    // Create Express app
    const app = createApp();

    // Start server
    const appServer = app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
      logger.info(`Health check available at http://localhost:${config.PORT}/health`);
      logger.info(`API test endpoint available at http://localhost:${config.PORT}/api/test`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      appServer.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await prisma.$disconnect();
          logger.info('Database disconnected');
          process.exit(0);
        } catch (error) {
          logger.error('Error during database disconnection:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
server();
