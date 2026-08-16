"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  IconExternalLink,
  IconAdjustments,
  IconLoader2,
  IconPackage,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { getModCatalog } from '@/config/games';
import ServerModConfigDialog from '@/components/admin/ServerModConfigDialog';
import type { ServerManagedConfig, ServerMod, ServerModRequirement } from '@/types/server';

interface ModSearchResult extends Omit<ServerMod, 'requirement'> {
  downloads: number;
  rating: number;
}

interface ServerModPickerProps {
  game: string;
  mods: ServerMod[];
  configs: ServerManagedConfig[];
  onChange: (mods: ServerMod[]) => void;
  onConfigsChange: (configs: ServerManagedConfig[]) => void;
}

const searchInputClass = 'w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20';

export default function ServerModPicker({ game, mods, configs, onChange, onConfigsChange }: ServerModPickerProps) {
  const catalog = getModCatalog(game);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ModSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRequirement, setNewRequirement] = useState<ServerModRequirement>('required');
  const [configuringMod, setConfiguringMod] = useState<ServerMod | null>(null);

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
    const ownedConfigs = configs.filter((config) => configOwnerKey(config) === modKey(target));
    if (ownedConfigs.length > 0 && !window.confirm(`Remove ${target.displayName} and its ${ownedConfigs.length} managed config file${ownedConfigs.length === 1 ? '' : 's'}?`)) return;
    onChange(mods.filter((mod) => modKey(mod) !== modKey(target)));
    onConfigsChange(configs.filter((config) => configOwnerKey(config) !== modKey(target)));
  };

  const setRequirement = (target: ServerMod, requirement: ServerModRequirement) => {
    onChange(mods.map((mod) => modKey(mod) === modKey(target) ? { ...mod, requirement } : mod));
  };

  const required = mods.filter((mod) => mod.requirement === 'required');
  const optional = mods.filter((mod) => mod.requirement === 'optional');
  const unassignedConfigs = configs.filter((config) => configOwnerKey(config) === null);

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

      {unassignedConfigs.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
          <p className="text-sm font-medium text-amber-100">Assign existing configs to a mod</p>
          <p className="mt-1 text-xs leading-5 text-amber-100/60">These files predate per-mod management. Choose their owner before saving the server.</p>
          <div className="mt-3 space-y-2">
            {unassignedConfigs.map((config) => (
              <div key={config.path} className="flex flex-col gap-2 rounded-lg bg-black/15 p-2.5 sm:flex-row sm:items-center">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/65">{config.path}</span>
                <select
                  value=""
                  onChange={(event) => {
                    const owner = mods.find((mod) => modKey(mod) === event.target.value);
                    if (!owner) return;
                    onConfigsChange(configs.map((candidate) => candidate === config ? {
                      ...candidate,
                      modProvider: owner.provider,
                      modNamespace: owner.namespace,
                      modPackageName: owner.packageName,
                      sourceVersion: owner.versionNumber,
                    } : candidate));
                  }}
                  className="rounded-lg border border-white/10 bg-bg-sidebar px-2.5 py-2 text-xs text-white/65 outline-none focus:border-accent-primary"
                  aria-label={`Owning mod for ${config.path}`}
                >
                  <option value="">Select owner…</option>
                  {mods.map((mod) => <option key={modKey(mod)} value={modKey(mod)}>{mod.displayName}</option>)}
                </select>
                <button type="button" onClick={() => onConfigsChange(configs.filter((candidate) => candidate !== config))} className="rounded-lg p-2 text-red-300/70 hover:bg-red-500/15 hover:text-red-300" aria-label={`Remove ${config.path}`}><IconTrash size={15} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <div className="mt-4 text-center text-sm text-white/40">
              <p>No matching mods found.</p>
              <p className="mt-1 text-xs text-white/30">Newly uploaded package? Paste its <span className="font-mono">author-package</span> dependency string.</p>
            </div>
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
          <ConfiguredGroup title="Required to connect" empty="No required mods" mods={required} configs={configs} onConfigure={setConfiguringMod} onRemove={remove} onRequirementChange={setRequirement} />
          <ConfiguredGroup title="Optional" empty="No optional mods" mods={optional} configs={configs} onConfigure={setConfiguringMod} onRemove={remove} onRequirementChange={setRequirement} />
        </div>
      )}

      {configuringMod && (
        <ServerModConfigDialog
          mod={configuringMod}
          configs={configs.filter((config) => configOwnerKey(config) === modKey(configuringMod))}
          onClose={() => setConfiguringMod(null)}
          onSave={(ownedConfigs) => {
            const otherConfigs = configs.filter((config) => configOwnerKey(config) !== modKey(configuringMod));
            const otherPaths = new Set(otherConfigs.map((config) => config.path.trim().toLowerCase()));
            const duplicate = ownedConfigs.find((config) => otherPaths.has(config.path.trim().toLowerCase()));
            if (duplicate) return `${duplicate.path} is already managed by another mod.`;
            onConfigsChange([...otherConfigs, ...ownedConfigs]);
            return null;
          }}
        />
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

function ConfiguredGroup({ title, empty, mods, configs, onConfigure, onRemove, onRequirementChange }: {
  title: string;
  empty: string;
  mods: ServerMod[];
  configs: ServerManagedConfig[];
  onConfigure: (mod: ServerMod) => void;
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
              <button type="button" onClick={() => onConfigure(mod)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/8 px-2.5 py-1.5 text-xs text-white/60 hover:bg-white/15 hover:text-white" aria-label={`Configure ${mod.displayName}`}>
                <IconAdjustments size={15} /> Config{configCount(configs, mod) > 0 ? ` (${configCount(configs, mod)})` : ''}
              </button>
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

function configOwnerKey(config: Pick<ServerManagedConfig, 'modProvider' | 'modNamespace' | 'modPackageName'>) {
  if (!config.modProvider || !config.modNamespace || !config.modPackageName) return null;
  return `${config.modProvider}:${config.modNamespace.toLowerCase()}/${config.modPackageName.toLowerCase()}`;
}

function configCount(configs: ServerManagedConfig[], mod: ServerMod) {
  const key = modKey(mod);
  return configs.filter((config) => configOwnerKey(config) === key).length;
}

function formatDownloads(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
