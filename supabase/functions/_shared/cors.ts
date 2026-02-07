/**
 * CORS Configuration — R9 Fix
 * Restricts CORS to authorized domains only instead of wildcard '*'
 */

const ALLOWED_ORIGINS = [
  'https://id-preview--09ef06eb-64a5-45f4-bf3f-f933a7ff7f3c.lovable.app',
  'https://lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

/**
 * Build CORS headers for the given request.
 * Only allows whitelisted origins; falls back to first allowed origin.
 */
export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers?.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle OPTIONS preflight request.
 */
export function handleCorsOptions(req: Request): Response {
  return new Response(null, { headers: getCorsHeaders(req) });
}
