function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: positiveInteger(process.env.SERVER_HEARTBEATS_PORT, 3200),
  refreshIntervalMs: positiveInteger(process.env.SERVER_HEARTBEATS_INTERVAL_MS, 15_000),
};
