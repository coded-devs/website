import 'dotenv/config';
import { createApp } from './app.js';
import { parseApiEnvironment } from './config/env.js';
import { logApiStartup } from './security/http.js';

const port = Number(process.env.PORT ?? 4000);
createApp({
  databaseUrl: process.env.DATABASE_URL,
  environment: parseApiEnvironment(process.env),
}).listen(port, () => logApiStartup(port));
