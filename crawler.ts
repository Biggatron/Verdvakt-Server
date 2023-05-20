import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Response } from 'express';
import fs from 'fs';
const query = require('../db/db');
const constants = require('../config/const');

export type Track = {
  id?: number,
  orig_price: string,
  curr_price: string,
  price_url: string,
  price_div: string,
  product_name?: string,
  userid?: number,
  email: string,
  email_sent: boolean,
  active: boolean,
  create_timestamp?: Date,
  modify_timestamp?: Date
};

export type TrackRequest = {
  orig_price: string,
  price_url: string,
  email: string
};

module.exports = {
  updatePrices: function () {
     console.log({intervalTime: constants.crawler.intervalTime});
     //getAndUpdatePrices();
     //setInterval(getAndUpdatePrices, constants.crawler.intervalTime)
  },
  extractNumber,
  findAndSavePrices
};
 
async function getAndUpdatePrices() {
  const result = await query(
    `SELECT * FROM track`
  );
  for (let i = 0; i < result.rows.length; i++) {
    let track = result.rows[i];
    console.log({ id: track.id,
                  productName: track.product_name,
                  currPrice: track.curr_price,
                  url: track.price_url});  
    const html: string = await getHTML(track.price_url);
    findPriceFromDiv(html, track)
  }
}

async function getHTML(url: string) {
  const response = await fetch(url);
  let html: string = await response.text();
  const fileName = './HTMLs/' + url.slice(0,40).replace(/[^A-Za-z0-9]/g, '') + '.html';
  fs.writeFile(fileName, html, function(err) {
    if (err) throw err;
    console.log('HTML file saved!');
  });
  return html;
}

async function findPriceFromDiv(html: any, track: Track) {
  let match = html.match(track.price_div)[1];  
  console.log({ match: match});
  console.log({ cleanMatch: extractNumber(match)});
  // If tracked price has changed we update database and send email to user
  
  if (match !== track.curr_price) {
    updatePrice(match, track);
    sendEmail(track);
  }
};  

async function findAndSavePrices(trackRequest: TrackRequest, res: Response) {
  const html = await getHTML(trackRequest.price_url);
  const doc = new JSDOM(html);
  let title: string = '';

  // Get product name from title
  try {
    title = doc.window.document.getElementsByTagName("title")[0].textContent || '';
    console.log('Title: '+ title);
  } catch (err) {
    console.log('No title element found in html');
  }
  // Use the DOM API to extract values from elements
  const elements = Array.from(doc.window.document.querySelectorAll("*")).map((x) => x.textContent);
  let tracks: Track[] = [];
  let htmlStringPos = 0;

  console.log('Looking for price: ' + trackRequest.orig_price);
  console.log('Elements to search: ' + elements.length)
  // Loop through elements to find given price
  for (let i=0;i<elements.length;i++) {
    let htmlPrice = elements[i] || ''; 
    let htmlPriceClean: string = extractNumber(htmlPrice);
    
    // If element value matches price given by user it get tracked
    if (htmlPriceClean === trackRequest.orig_price) {
      
      // If price string is not found in html we process next element. 
      let htmlPriceLocation = html.indexOf(htmlPrice, htmlStringPos);
      if (htmlPriceLocation === -1) {
        console.log({
          htmlStringPos: htmlStringPos,
          htmlPrice: htmlPrice})
        console.log('Price match found but not location')
        continue; 
      };
      
      // Get html strings around tracked price to keep track of price
      htmlStringPos = htmlPriceLocation; 
      let startPos = htmlPriceLocation - 500;
      let endPos = htmlPriceLocation + htmlPrice.length + 500;
      let priceDiv = html.substring(startPos, endPos).replace(htmlPrice, '(.*?)');

      let track: Track = {
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
      }
      tracks.push(track);
    }
  }
  if (tracks.length === 0) {
    res.status(200).send('Price not found on page'); 
  } else {
    addTracksToDatabase(tracks, res);
  }
}

async function addTracksToDatabase(tracks: Track[], res: Response) {
  console.log('Adding ' + tracks.length + ' tracks to database')
  let trackInsertCount: number = 0;
  for (let i = 0; i < tracks.length; i++) {
    let track = tracks[i];
    const trackResult = await query(
      'INSERT INTO track (orig_price, curr_price, price_url, price_div, product_name, userid, email, create_timestamp, modify_timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [ track.orig_price, track.curr_price, track.price_url, track.price_div, track.product_name, track.userid, track.email, track.create_timestamp, track.modify_timestamp ]
    );
    if (trackResult.rows[0].id) {
      ++trackInsertCount;
    }
  }
  if ( trackInsertCount === 0 ) {
    res.status(500).send('Error saving track to database');
  } else if (trackInsertCount < tracks.length) {
    res.status(206).send(trackInsertCount + ' out of ' + tracks.length + ' saved to database');
  } else {
    res.status(201).send(trackInsertCount + ' tracks added to database');
  }
}

async function updatePrice(newPrice: string, track: Track) {
  console.log('Uppfæra track: ' + track.id)
  const compResult = await query(
    'UPDATE track SET "curr_price" = $1, "modify_timestamp" = $2 WHERE "id" = $3',
    [newPrice, new Date(), track.id]
  );
}

async function sendEmail(track: Track) {
  // Síðasta sem ég geri
}

function extractNumber(price: string) {
  return price.replace(/\D/g,'');
}