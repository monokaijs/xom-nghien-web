'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBolt,
  IconBomb,
  IconClock,
  IconCrosshair,
  IconDownload,
  IconFlame,
  IconMap,
  IconPlayerPlay,
  IconShieldCheck,
  IconSkull,
  IconSwords,
  IconTrophy,
} from '@tabler/icons-react';
import { getMapImage } from '@/lib/utils/mapImage';

export interface MatchDetailData {
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
  };
  maps: Array<{
    matchid: number;
    mapnumber: number;
    start_time: string;
    end_time: string | null;
    winner: string;
    mapname: string;
    team1_score: number;
    team2_score: number;
  }>;
  players: Player[];
  demos: Demo[];
  rounds: Array<{
    mapnumber: number;
    demo_id: number;
    round_number: number;
    start_tick: number | null;
    end_tick: number | null;
    winner_side: string | null;
    winner_team: string | null;
    end_reason: string | null;
    team1_score: number;
    team2_score: number;
  }>;
  events: DemoEvent[];
}

interface Player {
  matchid: number;
  mapnumber: number;
  steamid64: string;
  team: string;
  name: string;
  mapname: string;
  avatar: string | null;
  avatarmedium: string | null;
  kills: number;
  deaths: number;
  damage: number;
  assists: number;
  enemy5ks: number;
  enemy4ks: number;
  enemy3ks: number;
  enemy2ks: number;
  shots_fired_total: number;
  shots_on_target_total: number;
  v1_count: number;
  v1_wins: number;
  v2_count: number;
  v2_wins: number;
  entry_count: number;
  entry_wins: number;
  head_shot_kills: number;
  utility_damage: number;
  enemies_flashed: number;
  xn_rating: number | null;
  rating_delta: number | null;
  rating_after: number | null;
}

interface Demo {
  id: number;
  matchid: number;
  mapnumber: number;
  file_name: string;
  file_size: number;
  sha256: string;
  uploaded_at: string;
  parse_status: 'queued' | 'processing' | 'complete' | 'failed';
  parser_version: string | null;
  parsed_at: string | null;
  parse_error: string | null;
}

interface DemoEvent {
  id: number;
  mapnumber: number;
  round_number: number;
  tick: number;
  event_type: string;
  actor_steamid64: string | null;
  target_steamid64: string | null;
  weapon: string | null;
  value: number | null;
}

type Tab = 'overview' | 'timeline' | 'players' | 'weapons' | 'duels' | 'insights' | 'highlights';
type SortKey = 'rating' | 'kills' | 'deaths' | 'assists' | 'diff' | 'kd' | 'kr' | 'adr' | 'hs' | 'aim' | 'clutch';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'timeline', label: 'Dòng thời gian' },
  { id: 'players', label: 'Người chơi' },
  { id: 'weapons', label: 'Vũ khí' },
  { id: 'duels', label: 'Đối đầu' },
  { id: 'insights', label: 'Phân tích' },
  { id: 'highlights', label: 'Highlights' },
];

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Không rõ thời gian'
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatDuration(start: string, end: string | null) {
  if (!end) return 'Đang diễn ra';
  const milliseconds = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return '—';
  const minutes = Math.floor(milliseconds / 60_000);
  return `${minutes}:${String(Math.floor(milliseconds / 1_000) % 60).padStart(2, '0')}`;
}

function playerMetric(player: Player, key: SortKey, rounds: number) {
  const kills = number(player.kills);
  const deaths = number(player.deaths);
  switch (key) {
    case 'rating': return number(player.rating_after ?? player.xn_rating);
    case 'kills': return kills;
    case 'deaths': return deaths;
    case 'assists': return number(player.assists);
    case 'diff': return kills - deaths;
    case 'kd': return deaths ? kills / deaths : kills;
    case 'kr': return rounds ? kills / rounds : 0;
    case 'adr': return rounds ? number(player.damage) / rounds : 0;
    case 'hs': return kills ? number(player.head_shot_kills) / kills * 100 : 0;
    case 'aim': return number(player.shots_fired_total) ? number(player.shots_on_target_total) / number(player.shots_fired_total) * 100 : 0;
    case 'clutch': return number(player.v1_wins) + number(player.v2_wins);
  }
}

function parserLabel(status: Demo['parse_status']) {
  switch (status) {
    case 'complete': return 'Đã phân tích';
    case 'processing': return 'Đang phân tích';
    case 'failed': return 'Phân tích lỗi';
    default: return 'Đang chờ';
  }
}

function EmptyParsedState({ demos }: { demos: Demo[] }) {
  const failed = demos.find((demo) => demo.parse_status === 'failed');
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
      {failed ? <IconAlertTriangle className="mx-auto mb-3 text-amber-400" size={34} /> : <IconClock className="mx-auto mb-3 text-white/35" size={34} />}
      <p className="font-semibold">{failed ? 'Không thể phân tích demo' : 'Dữ liệu nâng cao chưa sẵn sàng'}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm text-white/50">
        {failed?.parse_error || 'Demo đang trong hàng đợi. Trang này sẽ có timeline, vũ khí, đối đầu và highlights sau khi worker hoàn tất.'}
      </p>
    </div>
  );
}

function TeamTable({
  teamName,
  score,
  players,
  rounds,
  winner,
  demo,
  matchId,
}: {
  teamName: string;
  score: number;
  players: Player[];
  rounds: number;
  winner: boolean;
  demo?: Demo;
  matchId: number;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('adr');
  const ordered = [...players].sort((a, b) => playerMetric(b, sortKey, rounds) - playerMetric(a, sortKey, rounds));
  const averageRating = players.filter((player) => player.rating_after || player.xn_rating).length
    ? Math.round(players.reduce((sum, player) => sum + number(player.rating_after ?? player.xn_rating), 0) / players.filter((player) => player.rating_after || player.xn_rating).length)
    : null;

  const heading = (label: string, key: SortKey, title?: string) => (
    <button type="button" onClick={() => setSortKey(key)} title={title} className={`whitespace-nowrap px-2 py-3 text-xs font-semibold uppercase tracking-wide ${sortKey === key ? 'text-emerald-300' : 'text-white/40 hover:text-white/70'}`}>
      {label}{sortKey === key ? ' ↓' : ''}
    </button>
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#10191d]">
      <header className="flex items-center justify-between gap-4 bg-[#1b292e] px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <strong className={`text-2xl ${winner ? 'text-emerald-300' : 'text-rose-400'}`}>{score}</strong>
          <h3 className="truncate font-bold uppercase tracking-[0.16em]">{teamName || 'Đội chưa đặt tên'}</h3>
          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${winner ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}>{winner ? 'Thắng' : 'Thua'}</span>
        </div>
        <div className="flex items-center gap-3">
          {averageRating !== null && <span className="hidden text-xs text-white/45 sm:inline">XN AVG <b className="ml-1 text-violet-300">{averageRating.toLocaleString('vi-VN')}</b></span>}
          {demo && (
            <Link href={`/api/matches/${matchId}/demos/${demo.mapnumber}`} title={`${demo.file_name} · ${(number(demo.file_size) / 1024 / 1024).toFixed(1)} MB`} className="rounded-lg bg-white/5 p-2 text-white/55 hover:bg-white/10 hover:text-white">
              <IconDownload size={17} />
            </Link>
          )}
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-sm">
          <thead className="border-b border-white/10 bg-black/15 text-left">
            <tr>
              <th className="min-w-56 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/40">Người chơi</th>
              {heading('XN', 'rating', 'XN Rating')}
              {heading('K', 'kills', 'Kills')}
              {heading('D', 'deaths', 'Deaths')}
              {heading('A', 'assists', 'Assists')}
              {heading('+/−', 'diff')}
              {heading('K/D', 'kd')}
              {heading('K/R', 'kr')}
              {heading('ADR', 'adr')}
              {heading('HS%', 'hs')}
              {heading('AIM', 'aim', 'Shots on target')}
              {heading('CL', 'clutch', '1v1 + 1v2 clutches won')}
            </tr>
          </thead>
          <tbody>
            {ordered.map((player) => {
              const kills = number(player.kills);
              const deaths = number(player.deaths);
              const diff = kills - deaths;
              const adr = playerMetric(player, 'adr', rounds);
              const rating = number(player.rating_after ?? player.xn_rating);
              const delta = player.rating_delta === null ? null : number(player.rating_delta);
              return (
                <tr key={player.steamid64} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.035]">
                  <td className="px-4 py-2.5">
                    <Link href={`/player/${player.steamid64}`} className="flex items-center gap-3 font-semibold hover:text-emerald-300">
                      <img src={player.avatarmedium || player.avatar || '/favicon.png'} alt="" className="h-9 w-9 rounded-md bg-white/10 object-cover" />
                      <span className="max-w-44 truncate">{player.name}</span>
                    </Link>
                  </td>
                  <td className="px-2 text-center">
                    {rating ? <span className="inline-flex flex-col rounded border border-violet-400/50 bg-violet-400/10 px-2 py-0.5 text-xs font-bold text-violet-300"><span>{rating.toLocaleString('vi-VN')}</span>{delta !== null && <small className={delta >= 0 ? 'text-emerald-300' : 'text-rose-400'}>{delta >= 0 ? '+' : ''}{delta}</small>}</span> : <span className="text-white/25">—</span>}
                  </td>
                  <td className="px-2 text-center font-bold">{kills}</td>
                  <td className="px-2 text-center text-white/70">{deaths}</td>
                  <td className="px-2 text-center text-white/70">{number(player.assists)}</td>
                  <td className={`px-2 text-center font-semibold ${diff > 0 ? 'text-emerald-300' : diff < 0 ? 'text-rose-400' : 'text-white/55'}`}>{diff > 0 ? '+' : ''}{diff}</td>
                  <td className="px-2 text-center">{playerMetric(player, 'kd', rounds).toFixed(2)}</td>
                  <td className="px-2 text-center">{playerMetric(player, 'kr', rounds).toFixed(2)}</td>
                  <td className="relative px-2 text-center font-semibold"><span className="absolute inset-y-0 left-0 bg-emerald-400/20" style={{ width: `${Math.min(100, adr)}%` }} /><span className="relative">{adr.toFixed(1)}</span></td>
                  <td className="px-2 text-center">{playerMetric(player, 'hs', rounds).toFixed(0)}%</td>
                  <td className="px-2 text-center">{playerMetric(player, 'aim', rounds).toFixed(0)}%</td>
                  <td className="px-2 text-center text-amber-300">{playerMetric(player, 'clutch', rounds) || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoundStrip({ data, mapnumber }: { data: MatchDetailData; mapnumber: number }) {
  const rounds = data.rounds.filter((round) => number(round.mapnumber) === mapnumber);
  if (!rounds.length) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1519] px-4 py-4">
      <div className="flex min-w-max items-center gap-1.5">
        {rounds.map((round) => {
          const ct = round.winner_side?.toUpperCase() === 'CT';
          return (
            <div key={round.round_number} title={`Round ${round.round_number} · ${round.end_reason || round.winner_side || 'Unknown'}`} className={`flex h-11 w-9 flex-col items-center justify-center rounded-md border text-[10px] ${ct ? 'border-sky-400/25 bg-sky-400/10 text-sky-300' : 'border-amber-400/25 bg-amber-400/10 text-amber-300'}`}>
              <IconSkull size={15} />
              <span>{round.round_number}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Timeline({ data }: { data: MatchDetailData }) {
  if (!data.rounds.length) return <EmptyParsedState demos={data.demos} />;
  return <div className="space-y-5">{data.maps.map((map) => (
    <section key={map.mapnumber} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><IconMap size={19} className="text-emerald-300" />{map.mapname}</h2>
      <RoundStrip data={data} mapnumber={map.mapnumber} />
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {data.events.filter((event) => event.mapnumber === map.mapnumber && ['bomb_planted', 'bomb_defused', 'bomb_exploded'].includes(event.event_type)).map((event) => (
          <div key={event.id} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2 text-sm"><IconBomb size={17} className="text-amber-300" /><span>Round {event.round_number}: {event.event_type.replaceAll('_', ' ')}</span></div>
        ))}
      </div>
    </section>
  ))}</div>;
}

function Weapons({ data, names }: { data: MatchDetailData; names: Map<string, string> }) {
  const rows = useMemo(() => {
    const totals = new Map<string, { kills: number; players: Set<string> }>();
    for (const event of data.events.filter((item) => item.event_type === 'player_death')) {
      const weapon = event.weapon || 'unknown';
      const current = totals.get(weapon) || { kills: 0, players: new Set<string>() };
      current.kills += 1;
      if (event.actor_steamid64) current.players.add(names.get(event.actor_steamid64) || event.actor_steamid64);
      totals.set(weapon, current);
    }
    return [...totals].sort((a, b) => b[1].kills - a[1].kills);
  }, [data.events, names]);
  if (!rows.length) return <EmptyParsedState demos={data.demos} />;
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map(([weapon, stat], index) => (
    <div key={weapon} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 font-bold text-emerald-300">#{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate font-bold uppercase">{weapon.replace(/^weapon_/, '')}</p><p className="truncate text-xs text-white/45">{[...stat.players].join(', ')}</p></div><strong className="text-2xl text-emerald-300">{stat.kills}</strong></div>
  ))}</div>;
}

function Duels({ data, names }: { data: MatchDetailData; names: Map<string, string> }) {
  const rows = useMemo(() => {
    const totals = new Map<string, { actor: string; target: string; count: number }>();
    for (const event of data.events.filter((item) => item.event_type === 'player_death' && item.actor_steamid64 && item.target_steamid64)) {
      const key = `${event.actor_steamid64}:${event.target_steamid64}`;
      const current = totals.get(key) || { actor: event.actor_steamid64!, target: event.target_steamid64!, count: 0 };
      current.count += 1;
      totals.set(key, current);
    }
    return [...totals.values()].sort((a, b) => b.count - a.count).slice(0, 20);
  }, [data.events]);
  if (!rows.length) return <EmptyParsedState demos={data.demos} />;
  return <div className="grid gap-3 lg:grid-cols-2">{rows.map((duel) => (
    <div key={`${duel.actor}:${duel.target}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><Link href={`/player/${duel.actor}`} className="truncate text-right font-semibold hover:text-emerald-300">{names.get(duel.actor) || duel.actor}</Link><span className="flex items-center gap-2 rounded-lg bg-rose-400/10 px-3 py-1.5 font-bold text-rose-300"><IconSwords size={16} />{duel.count}</span><Link href={`/player/${duel.target}`} className="truncate font-semibold hover:text-rose-300">{names.get(duel.target) || duel.target}</Link></div>
  ))}</div>;
}

function Insights({ data }: { data: MatchDetailData }) {
  const totalRounds = data.maps.reduce((sum, map) => sum + number(map.team1_score) + number(map.team2_score), 0) || 1;
  const players = [...data.players].sort((a, b) => number(b.damage) - number(a.damage));
  const bestAdr = players[0];
  const bestEntry = [...players].sort((a, b) => number(b.entry_wins) - number(a.entry_wins))[0];
  const bestClutch = [...players].sort((a, b) => (number(b.v1_wins) + number(b.v2_wins)) - (number(a.v1_wins) + number(a.v2_wins)))[0];
  const cards = [
    { label: 'ADR cao nhất', player: bestAdr, value: bestAdr ? (number(bestAdr.damage) / totalRounds).toFixed(1) : '—', icon: IconFlame },
    { label: 'Entry thắng', player: bestEntry, value: bestEntry ? number(bestEntry.entry_wins) : '—', icon: IconBolt },
    { label: 'Clutch thắng', player: bestClutch, value: bestClutch ? number(bestClutch.v1_wins) + number(bestClutch.v2_wins) : '—', icon: IconShieldCheck },
  ];
  return <div className="grid gap-4 md:grid-cols-3">{cards.map(({ label, player, value, icon: Icon }) => (
    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><Icon className="mb-5 text-emerald-300" /><p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">{label}</p><p className="mt-2 truncate text-lg font-bold">{player?.name || 'Chưa có dữ liệu'}</p><p className="mt-1 text-3xl font-black text-emerald-300">{value}</p></div>
  ))}</div>;
}

function Highlights({ data, names }: { data: MatchDetailData; names: Map<string, string> }) {
  const highlights = useMemo(() => {
    const rounds = new Map<string, { steamid: string; round: number; map: number; kills: number }>();
    for (const event of data.events.filter((item) => item.event_type === 'player_death' && item.actor_steamid64)) {
      const key = `${event.mapnumber}:${event.round_number}:${event.actor_steamid64}`;
      const current = rounds.get(key) || { steamid: event.actor_steamid64!, round: event.round_number, map: event.mapnumber, kills: 0 };
      current.kills += 1;
      rounds.set(key, current);
    }
    return [...rounds.values()].filter((item) => item.kills >= 3).sort((a, b) => b.kills - a.kills);
  }, [data.events]);
  if (!data.events.length) return <EmptyParsedState demos={data.demos} />;
  if (!highlights.length) return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/50">Không có multi-kill từ 3 mạng trong trận này.</div>;
  return <div className="grid gap-3 md:grid-cols-2">{highlights.map((item) => (
    <div key={`${item.map}:${item.round}:${item.steamid}`} className="flex items-center gap-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4"><IconPlayerPlay className="text-amber-300" /><div className="min-w-0 flex-1"><p className="truncate font-bold">{names.get(item.steamid) || item.steamid}</p><p className="text-xs text-white/45">{data.maps.find((map) => map.mapnumber === item.map)?.mapname} · Round {item.round}</p></div><strong className="text-2xl text-amber-300">{item.kills}K</strong></div>
  ))}</div>;
}

export function MatchDetailView({ data }: { data: MatchDetailData }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { match, maps, players, demos } = data;
  const firstMap = maps[0];
  const team1Won = match.winner === match.team1_name || number(match.team1_score) > number(match.team2_score);
  const team2Won = match.winner === match.team2_name || number(match.team2_score) > number(match.team1_score);
  const parsedCount = demos.filter((demo) => demo.parse_status === 'complete').length;
  const names = useMemo(() => new Map(players.map((player) => [player.steamid64, player.name])), [players]);
  const uniqueRated = new Map(players.filter((player) => player.rating_after || player.xn_rating).map((player) => [player.steamid64, number(player.rating_after ?? player.xn_rating)]));
  const matchAverage = uniqueRated.size ? Math.round([...uniqueRated.values()].reduce((sum, rating) => sum + rating, 0) / uniqueRated.size) : null;

  return (
    <div className="-m-4 min-h-full bg-[#091014] text-white md:-m-6">
      <section className="relative overflow-hidden border-b border-white/10" aria-labelledby="match-heading">
        {firstMap?.mapname && <img src={getMapImage(firstMap.mapname)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,16,20,.96),rgba(8,16,20,.72),rgba(8,16,20,.94)),linear-gradient(0deg,#091014,transparent_55%)]" />
        <div className="relative px-5 py-6 md:px-8 md:py-8">
          <Link href="/cs2/matches" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"><IconArrowLeft size={17} />Lịch sử trận đấu</Link>
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto_1fr]">
            <div>
              <p className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/65"><IconMap size={17} className="text-emerald-300" />{match.series_type || 'Competitive'}<span className="text-white/25">|</span>{match.server_ip || 'XN Dedicated Server'}</p>
              <h1 id="match-heading" className="text-4xl font-black tracking-tight md:text-6xl">{firstMap?.mapname || 'CS2 Match'}</h1>
              <p className="mt-4 flex flex-wrap gap-5 text-xs uppercase tracking-[0.12em] text-white/45"><span><b className="mr-2 text-white/65">Ngày</b>{formatDate(match.start_time)}</span><span><b className="mr-2 text-white/65">Thời lượng</b>{formatDuration(match.start_time, match.end_time)}</span></p>
            </div>
            <div className="flex items-center justify-center gap-7 text-center">
              <div><p className={`text-xs font-bold uppercase tracking-[0.18em] ${team1Won ? 'text-emerald-300' : 'text-white/45'}`}>{team1Won ? 'Thắng' : 'Đội A'}</p><p className={`text-6xl font-black md:text-7xl ${team1Won ? 'text-emerald-300' : 'text-white/50'}`}>{match.team1_score}</p></div>
              <span className="text-5xl font-black text-white/25">:</span>
              <div><p className={`text-xs font-bold uppercase tracking-[0.18em] ${team2Won ? 'text-emerald-300' : 'text-white/45'}`}>{team2Won ? 'Thắng' : 'Đội B'}</p><p className={`text-6xl font-black md:text-7xl ${team2Won ? 'text-emerald-300' : 'text-white/50'}`}>{match.team2_score}</p></div>
            </div>
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 bg-black/25 backdrop-blur-sm">
              <div className="p-4 text-center"><IconShieldCheck className="mx-auto mb-1 text-emerald-300" size={25} /><strong className="text-2xl">{demos.length}</strong><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Demo xác thực</p></div>
              <div className="border-l border-white/10 p-4 text-center"><IconCrosshair className="mx-auto mb-1 text-sky-300" size={25} /><strong className="text-2xl">{parsedCount}/{demos.length}</strong><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Đã phân tích</p></div>
              <div className="col-span-2 flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-white/45"><span>XN Rating trung bình</span><b className="text-violet-300">{matchAverage?.toLocaleString('vi-VN') || 'Chưa xếp hạng'}</b></div>
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-20 overflow-x-auto border-b border-white/10 bg-[#091014]/95 px-5 backdrop-blur md:px-8" aria-label="Chi tiết trận đấu">
        <div className="flex min-w-max gap-8">{TABS.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'border-emerald-300 text-white' : 'border-transparent text-white/50 hover:text-white'}`}>{tab.label}</button>)}</div>
      </nav>

      <main className="space-y-6 px-5 py-7 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Match #{match.matchid}</p><div className="flex flex-wrap gap-2">{demos.map((demo) => <span key={demo.id} title={demo.parse_error || demo.parser_version || demo.sha256} className={`rounded-md px-2 py-1 text-[11px] font-semibold ${demo.parse_status === 'complete' ? 'bg-emerald-400/10 text-emerald-300' : demo.parse_status === 'failed' ? 'bg-rose-400/10 text-rose-300' : 'bg-amber-400/10 text-amber-300'}`}>Map {demo.mapnumber}: {parserLabel(demo.parse_status)}</span>)}</div></div>

        {activeTab === 'overview' && <div className="space-y-7">{maps.map((map) => {
          const mapPlayers = players.filter((player) => number(player.mapnumber) === number(map.mapnumber));
          const mapRounds = number(map.team1_score) + number(map.team2_score);
          const demo = demos.find((item) => number(item.mapnumber) === number(map.mapnumber));
          return <section key={map.mapnumber} className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-xl font-black uppercase tracking-wide">{map.mapname}</h2><span className="text-sm text-white/45">{map.team1_score} : {map.team2_score}</span></div><TeamTable teamName={match.team1_name} score={map.team1_score} players={mapPlayers.filter((player) => player.team === match.team1_name)} rounds={mapRounds} winner={map.team1_score > map.team2_score} demo={demo} matchId={match.matchid} /><RoundStrip data={data} mapnumber={map.mapnumber} /><TeamTable teamName={match.team2_name} score={map.team2_score} players={mapPlayers.filter((player) => player.team === match.team2_name)} rounds={mapRounds} winner={map.team2_score > map.team1_score} demo={demo} matchId={match.matchid} /></section>;
        })}</div>}
        {activeTab === 'timeline' && <Timeline data={data} />}
        {activeTab === 'players' && <div className="space-y-6">{maps.map((map) => {
          const mapPlayers = players.filter((player) => player.mapnumber === map.mapnumber);
          const mapRounds = map.team1_score + map.team2_score;
          const demo = demos.find((item) => item.mapnumber === map.mapnumber);
          return <section key={map.mapnumber} className="space-y-3"><h2 className="text-lg font-bold">{map.mapname}</h2><TeamTable teamName={match.team1_name} score={map.team1_score} players={mapPlayers.filter((player) => player.team === match.team1_name)} rounds={mapRounds} winner={map.team1_score > map.team2_score} demo={demo} matchId={match.matchid} /><TeamTable teamName={match.team2_name} score={map.team2_score} players={mapPlayers.filter((player) => player.team === match.team2_name)} rounds={mapRounds} winner={map.team2_score > map.team1_score} demo={demo} matchId={match.matchid} /></section>;
        })}</div>}
        {activeTab === 'weapons' && <Weapons data={data} names={names} />}
        {activeTab === 'duels' && <Duels data={data} names={names} />}
        {activeTab === 'insights' && <Insights data={data} />}
        {activeTab === 'highlights' && <Highlights data={data} names={names} />}
      </main>
    </div>
  );
}
