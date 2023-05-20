"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crawler = require('../crawler');
const query = require('../../db/db');
const router = (0, express_1.Router)();
router.post('/', (req, res) => {
    //console.log(req.body);
    let trackRequest = {
        price_url: req.body.url,
        orig_price: crawler.extractNumber(req.body.price),
        email: req.body.email
    };
    res.setHeader('Access-Control-Allow-Origin', '*');
    crawler.findAndSavePrices(trackRequest, res);
});
router.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    res.send(`User with id ${userId} requested`);
});
router.get('/:id', (req, res) => {
    const userId = req.params.id;
    console.log(req.params);
    getTracks(userId, res);
});
// catch unknown get /track request
router.get('/', (req, res) => {
    console.log(req.params);
    res.send('Unknown get request :' + req.query);
});
function getTracks(userId, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield query(`SELECT * FROM track`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(result.rows);
    });
}
exports.default = router;
