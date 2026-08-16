"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { IconChevronLeft, IconChevronRight, IconDownload, IconFileUpload, IconTrash, IconTrophy } from '@tabler/icons-react';

interface DemoInfo {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  parseStatus: 'queued' | 'processing' | 'complete' | 'failed';
  parseError: string | null;
}

interface MatchMap {
  matchid: number;
  mapnumber: number;
  mapname: string;
  team1_score: number;
  team2_score: number;
  demo: DemoInfo | null;
}

interface ManagedMatch {
  matchid: number;
  start_time: string;
  team1_name: string;
  team1_score: number;
  team2_name: string;
  team2_score: number;
  maps: MatchMap[];
}

const PAGE_SIZE = 25;
const MAX_DEMO_BYTES = 500 * 1024 * 1024;
const UPLOAD_CHUNK_BYTES = 50 * 1024 * 1024;

function sizeLabel(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function statusLabel(status: DemoInfo['parseStatus']) {
  if (status === 'complete') return 'Processed';
  if (status === 'processing') return 'Processing';
  if (status === 'failed') return 'Failed';
  return 'Queued';
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<ManagedMatch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/matches?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load matches');
      setMatches(data.matches || []);
      setTotal(Number(data.total) || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void loadMatches(); }, [loadMatches]);

  const upload = async (map: MatchMap, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const key = `${map.matchid}:${map.mapnumber}`;
    if (file.size === 0) {
      setError('Demo file is empty');
      return;
    }
    if (file.size > MAX_DEMO_BYTES) {
      setError('Demo exceeds the 500 MiB upload limit');
      return;
    }
    setBusy(key);
    setError(null);
    try {
      const uploadId = crypto.randomUUID();
      for (let start = 0; start < file.size; start += UPLOAD_CHUNK_BYTES) {
        const end = Math.min(start + UPLOAD_CHUNK_BYTES, file.size);
        const response = await fetch(`/api/admin/matches/${map.matchid}/demos/${map.mapnumber}`, {
          method: 'POST',
          headers: {
            'content-range': `bytes ${start}-${end - 1}/${file.size}`,
            'x-demo-file-name': encodeURIComponent(file.name),
            'x-demo-upload-id': uploadId,
          },
          body: file.slice(start, end),
        });
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : null;
        if (!response.ok) throw new Error(data?.error || `Upload failed (${response.status})`);
        setUploadProgress((current) => ({ ...current, [key]: Math.round((end / file.size) * 100) }));
      }
      await loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload demo');
    } finally {
      setBusy(null);
      setUploadProgress((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  const remove = async (map: MatchMap) => {
    if (!map.demo || !window.confirm(`Delete ${map.demo.fileName}? This cannot be undone.`)) return;
    const key = `${map.matchid}:${map.mapnumber}`;
    setBusy(key);
    setError(null);
    try {
      const response = await fetch(`/api/admin/matches/${map.matchid}/demos/${map.mapnumber}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete demo');
      await loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete demo');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-1">CS2 Match Management</h2>
        <p className="text-sm text-white/50">Upload missing demos for processing and remove demo files after a map has finished processing.</p>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      {loading ? (
        <div className="py-12 text-center text-white/50">Loading matches...</div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-10 text-center text-white/50">
          <IconTrophy size={36} className="mx-auto mb-3 opacity-40" />
          No CS2 matches found.
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <article key={match.matchid} className="overflow-hidden rounded-2xl border border-white/5 bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
                <div>
                  <Link href={`/cs2/matches/${match.matchid}`} className="font-semibold hover:text-accent-primary">
                    #{match.matchid} · {match.team1_name} {match.team1_score}–{match.team2_score} {match.team2_name}
                  </Link>
                  <div className="mt-1 text-xs text-white/40">{new Date(match.start_time).toLocaleString()}</div>
                </div>
                <span className="text-xs text-white/40">{match.maps.length} map{match.maps.length === 1 ? '' : 's'}</span>
              </div>
              <div className="divide-y divide-white/5">
                {match.maps.map((map) => {
                  const key = `${map.matchid}:${map.mapnumber}`;
                  const isBusy = busy === key;
                  return (
                    <div key={key} className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <div className="min-w-40 flex-1">
                        <div className="text-sm font-medium">Map {map.mapnumber}: {map.mapname || 'Unknown'}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
                          <span>{map.team1_score}–{map.team2_score}</span>
                          {map.demo && (
                            <span className={map.demo.parseStatus === 'complete' ? 'text-green-400' : map.demo.parseStatus === 'failed' ? 'text-red-400' : 'text-amber-400'} title={map.demo.parseError || undefined}>
                              {statusLabel(map.demo.parseStatus)}
                            </span>
                          )}
                        </div>
                      </div>
                      {map.demo ? (
                        <>
                          <div className="max-w-64 truncate text-right text-xs text-white/50" title={map.demo.fileName}>
                            {map.demo.fileName}<br />{sizeLabel(map.demo.fileSize)}
                          </div>
                          <a href={`/api/matches/${map.matchid}/demos/${map.mapnumber}`} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" title="Download demo">
                            <IconDownload size={18} />
                          </a>
                          <button type="button" onClick={() => void remove(map)} disabled={map.demo.parseStatus !== 'complete' || isBusy}
                            className="rounded-lg p-2 text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30" title={map.demo.parseStatus === 'complete' ? 'Delete demo' : 'Available after processing'}>
                            <IconTrash size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <input ref={(node) => { fileInputs.current[key] = node; }} type="file" accept=".dem" className="hidden" onChange={(event) => void upload(map, event)} />
                          <button type="button" disabled={isBusy} onClick={() => fileInputs.current[key]?.click()}
                            className="flex items-center gap-2 rounded-xl bg-accent-primary px-3 py-2 text-sm font-medium hover:bg-accent-primary/80 disabled:opacity-50">
                            <IconFileUpload size={17} />{isBusy ? `Uploading ${uploadProgress[key] || 0}%` : 'Upload demo'}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-white/50">
          <span>Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded-lg bg-white/5 p-2 hover:bg-white/10 disabled:opacity-30"><IconChevronLeft size={18} /></button>
            <button type="button" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage((value) => value + 1)} className="rounded-lg bg-white/5 p-2 hover:bg-white/10 disabled:opacity-30"><IconChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
