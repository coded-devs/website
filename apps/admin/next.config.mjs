import { getApiOrigin } from './api-origin.mjs';
import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

export default function nextConfig(phase) {
  if (phase !== PHASE_PRODUCTION_BUILD) {
    getApiOrigin(process.env.API_INTERNAL_ORIGIN);
  }
  return {};
}
