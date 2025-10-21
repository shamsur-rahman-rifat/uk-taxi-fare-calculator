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

export default app;