// Basic Library Imports
import dotenv from 'dotenv';
import express, { json, urlencoded } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import hpp from 'hpp';
import { resolve } from 'path';
import router from './src/route/api.js';

dotenv.config();
const app = new express();
const __dirname = resolve();

// Middleware

app.use(cors());

app.use(hpp());
app.use(json({ limit: "20MB" }));
app.use(urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3000 });
app.use(limiter);

app.use('/api', router);


// Serve static files from the React app
app.use(express.static(resolve(__dirname, 'client', 'dist')));

// Serve React front end for all routes not handled by the API
app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api')) {
    // If route starts with /api but no handler matched, pass to next middleware (404)
    return next();
  }
  // Otherwise serve React app
  res.sendFile(resolve(__dirname, 'client', 'dist', 'index.html'));
});

export default app;