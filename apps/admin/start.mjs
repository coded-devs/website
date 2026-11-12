import { getApiOrigin } from './api-origin.mjs';

// Standalone Next.js servers do not execute next.config.mjs at runtime.
// Validate deployment-specific configuration before opening the HTTP listener.
getApiOrigin(process.env.API_INTERNAL_ORIGIN);
await import('./server.js');
