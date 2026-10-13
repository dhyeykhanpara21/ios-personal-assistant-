"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const vercel_1 = require("@hono/node-server/vercel");
const index_js_1 = __importDefault(require("../src/index.js"));
exports.config = {
    runtime: 'nodejs',
};
exports.default = (0, vercel_1.handle)(index_js_1.default);
//# sourceMappingURL=index.js.map