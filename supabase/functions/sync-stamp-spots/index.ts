import { createSyncStampSpotsHandler } from './handler.ts';

const requiredEnvironment = (name: string): string => {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const stampSpotSyncToken = requiredEnvironment('STAMP_SPOT_SYNC_TOKEN');

if (stampSpotSyncToken.length < 32) {
  throw new Error('STAMP_SPOT_SYNC_TOKEN must be at least 32 characters');
}

Deno.serve(
  createSyncStampSpotsHandler({
    stampSpotSyncToken,
    tourApiServiceKey: requiredEnvironment('TOUR_API_SERVICE_KEY'),
    supabaseUrl: requiredEnvironment('SUPABASE_URL'),
    supabaseServiceRoleKey: requiredEnvironment('SUPABASE_SERVICE_ROLE_KEY'),
  }),
);
