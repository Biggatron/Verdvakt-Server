"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const track_1 = __importDefault(require("./routes/track"));
const crawler = require('./crawler');
const app = (0, express_1.default)();
const port = 8000;
const jsonParser = body_parser_1.default.json();
// Subfunction runs on interval to compare tracks and email users if price has changed
crawler.updatePrices();
// Enable pre-flight across the board
app.options('*', (0, cors_1.default)());
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running ats http://localhost:${port}`);
});
app.use('/track', jsonParser, track_1.default);
app.get('/', (req, res) => {
    res.send('Express + TypeScript Servers');
});
