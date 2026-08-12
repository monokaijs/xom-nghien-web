export const XN_INITIAL_RATING = 1_000;
export const XN_PLACEMENT_MATCHES = 10;

export interface RatingInput {
  rating: number;
  matchesPlayed: number;
  opponentTeamRating: number;
  result: 0 | 0.5 | 1;
  scoreFor: number;
  scoreAgainst: number;
}

export interface RatingChange {
  expected: number;
  delta: number;
  after: number;
  provisional: boolean;
}

export function expectedScore(rating: number, opponentRating: number) {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

export function calculateRatingChange(input: RatingInput): RatingChange {
  const expected = expectedScore(input.rating, input.opponentTeamRating);
  const provisional = input.matchesPlayed < XN_PLACEMENT_MATCHES;
  const kFactor = provisional ? 48 : 32;
  const roundMargin = Math.abs(input.scoreFor - input.scoreAgainst);
  const marginMultiplier = 1 + Math.min(0.15, roundMargin * 0.025);
  const delta = Math.round(kFactor * (input.result - expected) * marginMultiplier);

  return {
    expected,
    delta,
    after: Math.max(0, input.rating + delta),
    provisional,
  };
}

export function normalizeServerAddress(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

export function isRatedServer(serverAddress: string, allowlist: string[]) {
  const normalized = normalizeServerAddress(serverAddress);
  if (!normalized) return false;

  return allowlist.some((entry) => {
    const candidate = normalizeServerAddress(entry);
    return candidate.length > 0 && (
      candidate === normalized
      || (!candidate.includes(':') && normalized.split(':')[0] === candidate)
    );
  });
}
