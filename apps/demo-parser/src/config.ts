function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: positiveInteger(process.env.DEMO_PARSER_PORT, 3300),
  pollIntervalMs: positiveInteger(process.env.DEMO_PARSER_POLL_INTERVAL_MS, 3_000),
  maxAttempts: positiveInteger(process.env.DEMO_PARSER_MAX_ATTEMPTS, 3),
  storageRoot: process.env.MATCH_DEMO_STORAGE_DIR || '/app/storage/match-demos',
  ratedServers: (process.env.XN_RATED_SERVER_ADDRESSES || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
};
