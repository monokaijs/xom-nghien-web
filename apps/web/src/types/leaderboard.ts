export type LeaderboardType = 'kills' | 'headshots' | 'damage' | 'kda';

export interface LeaderboardPlayerRaw {
  steamid64: string;
  name: string;
  total_kills: string;
  total_deaths: string;
  total_damage: string;
  total_headshots: string;
  total_assists?: string;
  matches_played: string;
  headshot_percentage?: string;
  kda_ratio?: string;
  avatar?: string;
}

export interface LeaderboardPlayer {
  rank: number;
  steamId: string;
  name: string;
  avatar?: string;
  value: number;
  kills?: number;
  deaths?: number;
  damage?: number;
  headshots?: number;
  assists?: number;
  headshotPercentage?: number;
  kdaRatio?: number;
}

export interface LeaderboardResponse {
  topKillers: LeaderboardPlayerRaw[];
  topDamage: LeaderboardPlayerRaw[];
  topHeadshot: LeaderboardPlayerRaw[];
  topKDA: LeaderboardPlayerRaw[];
}
