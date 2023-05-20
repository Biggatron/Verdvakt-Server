import { Request, Response, Router } from 'express';
import { Track, TrackRequest } from '../crawler';
const crawler = require('../crawler');
const query = require('../../db/db');

const router = Router();

router.post('/', (req: Request, res: Response) => {
  //console.log(req.body);
  let trackRequest: TrackRequest = {
    price_url: req.body.url,
    orig_price: crawler.extractNumber(req.body.price),
    email: req.body.email
  }
  res.setHeader('Access-Control-Allow-Origin', '*')
  crawler.findAndSavePrices(trackRequest, res);
});

router.get('/users/:id', (req: Request<{ id: string }>, res: Response) => {
  const userId = req.params.id;
  res.send(`User with id ${userId} requested`);
});

router.get('/:id', (req: Request<{ id: number }>, res: Response) => {
  const userId = req.params.id;
  console.log(req.params);
  getTracks(userId, res);
});

// catch unknown get /track request
router.get('/', (req: Request, res: Response) => {
  console.log(req.params);
  res.send('Unknown get request :' + req.query);
});

async function getTracks(userId: number, res: Response) {
  const result = await query(
    `SELECT * FROM track`
  );
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.send(result.rows);  
}

export default router;
 