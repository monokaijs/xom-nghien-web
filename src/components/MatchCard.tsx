'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MatchCardProps {
  match: {
    matchid: number;
    start_time: string;
    end_time: string | null;
    winner: string;
    series_type: string;
    team1_name: string;
    team1_score: number;
    team2_name: string;
    team2_score: number;
    server_ip: string;
    maps_played: number;
    maps: any[];
    players: any[];
  };
}

export default function MatchCard({ match }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [avatars, setAvatars] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (expanded && match.players.length > 0) {
      const steamIds = [...new Set(match.players.map((p: any) => p.steamid64))];

      fetch('/api/steam/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamIds }),
      })
        .then((res) => res.json())
        .then(({ profiles }) => {
          const avatarMap = new Map<string, string>(
            profiles.map((p: any) => [p.steamId64 as string, (p.profile?.avatarMedium || '') as string])
          );
          setAvatars(avatarMap);
        })
        .catch((err) => console.error('Error fetching avatars:', err));
    }
  }, [expanded, match.players]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const team1Players = match.players.filter((p: any) => p.team === match.team1_name);
  const team2Players = match.players.filter((p: any) => p.team === match.team2_name);

  const renderPlayerList = (players: any[]) => (
    <div className="space-y-2">
      {players.map((player: any) => (
        <Link
          key={`${player.steamid64}-${player.mapnumber}`}
          href={`/player/${player.steamid64}`}
          className="flex items-center gap-2 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors cursor-pointer"
        >
          {avatars.get(player.steamid64.toString()) ? (
            <img
              src={avatars.get(player.steamid64.toString())}
              alt={player.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-white text-xs">
                {player.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="text-white text-sm">{player.name}</div>
          </div>
          <div className="text-xs text-slate-400">
            {player.kills}K / {player.deaths}D
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Match #{match.matchid}
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(match.start_time)}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {match.server_ip}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-white">{match.team1_name}</div>
            <div className="text-sm text-slate-400 mt-1">Team 1</div>
          </div>
          <div className="px-8">
            <div className="text-4xl font-bold text-white">
              {match.team1_score} - {match.team2_score}
            </div>
            <div className="text-xs text-slate-400 text-center mt-1">
              {match.series_type}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-white">{match.team2_name}</div>
            <div className="text-sm text-slate-400 mt-1">Team 2</div>
          </div>
        </div>

        {match.winner && (
          <div className="text-center py-2 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
            <span className="text-green-400 font-medium">
              Chiến thắng: {match.winner}
            </span>
          </div>
        )}

        {match.players.length > 0 && (
          <div className="mt-4">
            <Button
              onClick={() => setExpanded(!expanded)}
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Ẩn chi tiết
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Xem chi tiết
                </>
              )}
            </Button>

            {expanded && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-semibold mb-2">{match.team1_name}</h4>
                  {renderPlayerList(team1Players)}
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">{match.team2_name}</h4>
                  {renderPlayerList(team2Players)}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

