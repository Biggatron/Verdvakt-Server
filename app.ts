import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import trackRoutes from './routes/track';
const crawler = require('./crawler');
const app: Express = express();
const port = 8000;
const jsonParser = bodyParser.json()

// Subfunction runs on interval to compare tracks and email users if price has changed
crawler.updatePrices();

// Enable pre-flight across the board
app.options('*', cors());

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running ats http://localhost:${port}`);
});

app.use('/track', jsonParser, trackRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Servers');
});
