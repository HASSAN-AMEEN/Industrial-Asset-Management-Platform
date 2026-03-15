"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.httpLogger = void 0;
const morgan_1 = __importDefault(require("morgan"));
morgan_1.default.token('id', (req) => req.headers['x-request-id'] || 'N/A');
const developmentFormat = ':id :method :url :status :response-time ms - :res[content-length]';
const productionFormat = ':id :method :url :status :response-time ms - :remote-addr';
const httpLogger = () => {
    if (process.env.NODE_ENV === 'production') {
        return (0, morgan_1.default)(productionFormat);
    }
    return (0, morgan_1.default)(developmentFormat);
};
exports.httpLogger = httpLogger;
exports.logger = {
    info: (message, ...args) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    },
    error: (message, ...args) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    },
    warn: (message, ...args) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    },
    debug: (message, ...args) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
        }
    },
};
//# sourceMappingURL=logger.js.map