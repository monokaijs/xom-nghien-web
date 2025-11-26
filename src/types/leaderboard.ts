export type LeaderboardType = 'kills' | 'headshots' | 'damage';

export interface LeaderboardPlayerRaw {
  steamid64: string;
  name: string;
  total_kills: string;
  total_deaths: string;
  total_damage: string;
  total_headshots: string;
  matches_played: string;
  headshot_percentage?: string;
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
  headshotPercentage?: number;
}

export interface LeaderboardResponse {
  topKillers: LeaderboardPlayerRaw[];
  topDamage: LeaderboardPlayerRaw[];
  topHeadshot: LeaderboardPlayerRaw[];
}
