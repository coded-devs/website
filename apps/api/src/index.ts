import 'dotenv/config';
import { createApp } from './app.js';
import { parseApiRuntimeConfiguration } from './config/env.js';
import { logApiStartup } from './security/http.js';

const { port, databaseUrl, environment } = parseApiRuntimeConfiguration(
  process.env,
);
createApp({
  databaseUrl,
  environment,
}).listen(port, () => logApiStartup(port));
