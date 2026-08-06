"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  IconExternalLink,
  IconLoader2,
  IconPackage,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { getModCatalog } from '@/config/games';
import type { ServerMod, ServerModRequirement } from '@/types/server';

interface ModSearchResult extends Omit<ServerMod, 'requirement'> {
  downloads: number;
  rating: number;
}

interface ServerModPickerProps {
  game: string;
  mods: ServerMod[];
  onChange: (mods: ServerMod[]) => void;
}

const searchInputClass = 'w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20';

export default function ServerModPicker({ game, mods, onChange }: ServerModPickerProps) {
  const catalog = getModCatalog(game);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ModSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRequirement, setNewRequirement] = useState<ServerModRequirement>('required');

  const selectedKeys = useMemo(
    () => new Set(mods.map(modKey)),
    [mods],
  );

  useEffect(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, [game]);

  useEffect(() => {
    const normalized = query.trim();
    if (!catalog || normalized.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ game, q: normalized });
        const response = await fetch(`/api/admin/mods/search?${params}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to search mods');
        setResults(data.mods || []);
      } catch (searchError) {
        if (searchError instanceof Error && searchError.name === 'AbortError') return;
        setError(searchError instanceof Error ? searchError.message : 'Failed to search mods');
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [catalog, game, query]);

  const add = (result: ModSearchResult) => {
    if (selectedKeys.has(modKey(result))) return;
    const { downloads: _downloads, rating: _rating, ...mod } = result;
    onChange([...mods, { ...mod, requirement: newRequirement }]);
  };

  const remove = (target: ServerMod) => {
    onChange(mods.filter((mod) => modKey(mod) !== modKey(target)));
  };

  const setRequirement = (target: ServerMod, requirement: ServerModRequirement) => {
    onChange(mods.map((mod) => modKey(mod) === modKey(target) ? { ...mod, requirement } : mod));
  };

  const required = mods.filter((mod) => mod.requirement === 'required');
  const optional = mods.filter((mod) => mod.requirement === 'optional');

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-medium">Server mods</h4>
          <p className="mt-1 text-xs leading-5 text-white/40">
            Required mods must be installed to connect. Optional mods are recommended but not enforced.
          </p>
        </div>
        {mods.length > 0 && (
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-accent-primary/15 px-2.5 py-1 text-accent-primary">{required.length} required</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/55">{optional.length} optional</span>
          </div>
        )}
      </div>

      {!catalog ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/45">
          Mod catalog search is not available for this game yet.
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <IconSearch size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={100}
                placeholder={`Search ${catalog.community} mods on Thunderstore`}
                className={searchInputClass}
                aria-label="Search mods"
              />
              {loading && <IconLoader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-accent-primary" />}
            </div>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1" aria-label="Requirement for newly added mods">
              <RequirementButton active={newRequirement === 'required'} onClick={() => setNewRequirement('required')}>Required</RequirementButton>
              <RequirementButton active={newRequirement === 'optional'} onClick={() => setNewRequirement('optional')}>Optional</RequirementButton>
            </div>
          </div>

          {error && <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

          {query.trim().length >= 2 && !loading && !error && results.length === 0 && (
            <p className="mt-4 text-center text-sm text-white/40">No matching mods found.</p>
          )}

          {results.length > 0 && (
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1" aria-label="Mod search results">
              {results.map((result) => {
                const selected = selectedKeys.has(modKey(result));
                return (
                  <div key={modKey(result)} className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/15 p-3">
                    <ModIcon mod={result} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{result.displayName}</span>
                        <span className="shrink-0 text-[11px] text-white/35">v{result.versionNumber}</span>
                      </div>
                      <p className="truncate text-xs text-white/40">by {result.namespace} · {formatDownloads(result.downloads)} downloads</p>
                      {result.description && <p className="mt-1 line-clamp-1 text-xs text-white/50">{result.description}</p>}
                    </div>
                    <a href={result.packageUrl} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-white/35 hover:bg-white/10 hover:text-white" aria-label={`Open ${result.displayName} on Thunderstore`}>
                      <IconExternalLink size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => add(result)}
                      disabled={selected}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-primary px-3 py-2 text-xs font-medium hover:bg-accent-primary/80 disabled:bg-white/10 disabled:text-white/35"
                    >
                      <IconPlus size={15} /> {selected ? 'Added' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {mods.length > 0 && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <ConfiguredGroup title="Required to connect" empty="No required mods" mods={required} onRemove={remove} onRequirementChange={setRequirement} />
          <ConfiguredGroup title="Optional" empty="No optional mods" mods={optional} onRemove={remove} onRequirementChange={setRequirement} />
        </div>
      )}
    </section>
  );
}

function RequirementButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${active ? 'bg-accent-primary text-white' : 'text-white/45 hover:text-white'}`}>
      {children}
    </button>
  );
}

function ConfiguredGroup({ title, empty, mods, onRemove, onRequirementChange }: {
  title: string;
  empty: string;
  mods: ServerMod[];
  onRemove: (mod: ServerMod) => void;
  onRequirementChange: (mod: ServerMod, requirement: ServerModRequirement) => void;
}) {
  return (
    <div>
      <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">{title} <span className="ml-1 text-white/25">{mods.length}</span></h5>
      {mods.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs text-white/30">{empty}</div>
      ) : (
        <div className="space-y-2">
          {mods.map((mod) => (
            <div key={modKey(mod)} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.035] p-2.5">
              <ModIcon mod={mod} small />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{mod.displayName}</p>
                <p className="truncate text-[11px] text-white/35">{mod.namespace} · v{mod.versionNumber}</p>
              </div>
              <select
                value={mod.requirement}
                onChange={(event) => onRequirementChange(mod, event.target.value as ServerModRequirement)}
                className="rounded-lg border border-white/10 bg-bg-sidebar px-2 py-1.5 text-xs text-white/65 outline-none focus:border-accent-primary"
                aria-label={`Requirement for ${mod.displayName}`}
              >
                <option value="required">Required</option>
                <option value="optional">Optional</option>
              </select>
              <button type="button" onClick={() => onRemove(mod)} className="rounded-lg p-1.5 text-red-300/70 hover:bg-red-500/15 hover:text-red-300" aria-label={`Remove ${mod.displayName}`}>
                <IconTrash size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModIcon({ mod, small = false }: { mod: Pick<ServerMod, 'iconUrl' | 'displayName'>; small?: boolean }) {
  const size = small ? 'h-9 w-9 rounded-lg' : 'h-12 w-12 rounded-xl';
  return mod.iconUrl ? (
    <img src={mod.iconUrl} alt="" className={`${size} shrink-0 object-cover`} />
  ) : (
    <div className={`${size} flex shrink-0 items-center justify-center bg-white/5 text-white/30`}><IconPackage size={small ? 18 : 22} /></div>
  );
}

function modKey(mod: Pick<ServerMod, 'provider' | 'namespace' | 'packageName'>) {
  return `${mod.provider}:${mod.namespace.toLowerCase()}/${mod.packageName.toLowerCase()}`;
}

function formatDownloads(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
