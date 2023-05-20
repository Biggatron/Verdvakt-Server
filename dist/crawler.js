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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const jsdom_1 = require("jsdom");
const fs_1 = __importDefault(require("fs"));
const query = require('../db/db');
const constants = require('../config/const');
module.exports = {
    updatePrices: function () {
        console.log({ intervalTime: constants.crawler.intervalTime });
        //getAndUpdatePrices();
        //setInterval(getAndUpdatePrices, constants.crawler.intervalTime)
    },
    extractNumber,
    findAndSavePrices
};
function getAndUpdatePrices() {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield query(`SELECT * FROM track`);
        for (let i = 0; i < result.rows.length; i++) {
            let track = result.rows[i];
            console.log({ id: track.id,
                productName: track.product_name,
                currPrice: track.curr_price,
                url: track.price_url });
            const html = yield getHTML(track.price_url);
            findPriceFromDiv(html, track);
        }
    });
}
function getHTML(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, node_fetch_1.default)(url);
        let html = yield response.text();
        const fileName = './HTMLs/' + url.slice(0, 40).replace(/[^A-Za-z0-9]/g, '') + '.html';
        fs_1.default.writeFile(fileName, html, function (err) {
            if (err)
                throw err;
            console.log('HTML file saved!');
        });
        return html;
    });
}
function findPriceFromDiv(html, track) {
    return __awaiter(this, void 0, void 0, function* () {
        let match = html.match(track.price_div)[1];
        console.log({ match: match });
        console.log({ cleanMatch: extractNumber(match) });
        // If tracked price has changed we update database and send email to user
        if (match !== track.curr_price) {
            updatePrice(match, track);
            sendEmail(track);
        }
    });
}
;
function findAndSavePrices(trackRequest, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = yield getHTML(trackRequest.price_url);
        const doc = new jsdom_1.JSDOM(html);
        let title = '';
        // Get product name from title
        try {
            title = doc.window.document.getElementsByTagName("title")[0].textContent || '';
            console.log('Title: ' + title);
        }
        catch (err) {
            console.log('No title element found in html');
        }
        // Use the DOM API to extract values from elements
        const elements = Array.from(doc.window.document.querySelectorAll("*")).map((x) => x.textContent);
        let tracks = [];
        let htmlStringPos = 0;
        console.log('Looking for price: ' + trackRequest.orig_price);
        console.log('Elements to search: ' + elements.length);
        // Loop through elements to find given price
        for (let i = 0; i < elements.length; i++) {
            let htmlPrice = elements[i] || '';
            let htmlPriceClean = extractNumber(htmlPrice);
            // If element value matches price given by user it get tracked
            if (htmlPriceClean === trackRequest.orig_price) {
                // If price string is not found in html we process next element. 
                let htmlPriceLocation = html.indexOf(htmlPrice, htmlStringPos);
                if (htmlPriceLocation === -1) {
                    console.log({
                        htmlStringPos: htmlStringPos,
                        htmlPrice: htmlPrice
                    });
                    console.log('Price match found but not location');
                    continue;
                }
                ;
                // Get html strings around tracked price to keep track of price
                htmlStringPos = htmlPriceLocation;
                let startPos = htmlPriceLocation - 500;
                let endPos = htmlPriceLocation + htmlPrice.length + 500;
                let priceDiv = html.substring(startPos, endPos).replace(htmlPrice, '(.*?)');
                let track = {
                    orig_price: htmlPriceClean,
                    curr_price: htmlPriceClean,
                    price_url: trackRequest.price_url,
                    price_div: priceDiv,
                    product_name: title,
                    email: trackRequest.email,
                    email_sent: false,
                    active: true,
                    create_timestamp: new Date(),
                    modify_timestamp: new Date()
                };
                tracks.push(track);
            }
        }
        if (tracks.length === 0) {
            res.status(200).send('Price not found on page');
        }
        else {
            addTracksToDatabase(tracks, res);
        }
    });
}
function addTracksToDatabase(tracks, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Adding ' + tracks.length + ' tracks to database');
        let trackInsertCount = 0;
        for (let i = 0; i < tracks.length; i++) {
            let track = tracks[i];
            const trackResult = yield query('INSERT INTO track (orig_price, curr_price, price_url, price_div, product_name, userid, email, create_timestamp, modify_timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [track.orig_price, track.curr_price, track.price_url, track.price_div, track.product_name, track.userid, track.email, track.create_timestamp, track.modify_timestamp]);
            if (trackResult.rows[0].id) {
                ++trackInsertCount;
            }
        }
        if (trackInsertCount === 0) {
            res.status(500).send('Error saving track to database');
        }
        else if (trackInsertCount < tracks.length) {
            res.status(206).send(trackInsertCount + ' out of ' + tracks.length + ' saved to database');
        }
        else {
            res.status(201).send(trackInsertCount + ' tracks added to database');
        }
    });
}
function updatePrice(newPrice, track) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Uppfæra track: ' + track.id);
        const compResult = yield query('UPDATE track SET "curr_price" = $1, "modify_timestamp" = $2 WHERE "id" = $3', [newPrice, new Date(), track.id]);
    });
}
function sendEmail(track) {
    return __awaiter(this, void 0, void 0, function* () {
        // Síðasta sem ég geri
    });
}
function extractNumber(price) {
    return price.replace(/\D/g, '');
}
