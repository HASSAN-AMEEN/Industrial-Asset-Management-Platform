"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    const payload = {
        success: true,
        message: 'API working',
        data: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
        },
    };
    res.status(200).json(payload);
});
exports.default = router;
//# sourceMappingURL=test.routes.js.map