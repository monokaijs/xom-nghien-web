export interface CommunityLeaderboardPlayer {
  name: string;
  avatar: string | null;
  points: number;
}

export interface CommunityLeaderboardResponse {
  players: CommunityLeaderboardPlayer[];
}
