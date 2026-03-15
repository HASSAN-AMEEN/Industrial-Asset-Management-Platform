"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
const server = async () => {
    try {
        try {
            await database_1.prisma.$connect();
            logger_1.logger.info('Database connected successfully');
        }
        catch (dbError) {
            logger_1.logger.error('Database connection failed:', dbError);
            if (env_1.config.NODE_ENV === 'production') {
                throw dbError;
            }
        }
        const app = (0, app_1.default)();
        const appServer = app.listen(env_1.config.PORT, () => {
            logger_1.logger.info(`Server running on port ${env_1.config.PORT} in ${env_1.config.NODE_ENV} mode`);
            logger_1.logger.info(`Health check available at http://localhost:${env_1.config.PORT}/health`);
            logger_1.logger.info(`API test endpoint available at http://localhost:${env_1.config.PORT}/api/test`);
        });
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
            appServer.close(async () => {
                logger_1.logger.info('HTTP server closed');
                try {
                    await database_1.prisma.$disconnect();
                    logger_1.logger.info('Database disconnected');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.logger.error('Error during database disconnection:', error);
                    process.exit(1);
                }
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
server();
//# sourceMappingURL=server.js.map