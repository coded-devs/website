import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';
import { getApiOrigin } from './api-origin.mjs';

export default function nextConfig(phase) {
  // Build is portable; every server start requires explicit validated configuration.
  if (phase !== PHASE_PRODUCTION_BUILD)
    getApiOrigin(process.env.API_INTERNAL_ORIGIN);
  return {
    outputFileTracingRoot: path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../',
    ),
  };
}
