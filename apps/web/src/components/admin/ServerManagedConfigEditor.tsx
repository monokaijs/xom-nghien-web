"use client";

import React from 'react';
import { IconFileCode, IconPlus, IconTrash } from '@tabler/icons-react';
import type { ServerManagedConfig } from '@/types/server';

interface Props {
  game: string;
  configs: ServerManagedConfig[];
  onChange: (configs: ServerManagedConfig[]) => void;
}

const fieldClass = 'w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none placeholder:text-white/25 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20';

export default function ServerManagedConfigEditor({ game, configs, onChange }: Props) {
  if (game !== 'valheim') return null;

  const add = () => onChange([...configs, { path: '', contents: '' }]);
  const update = (index: number, patch: Partial<ServerManagedConfig>) => {
    onChange(configs.map((config, candidate) => candidate === index ? { ...config, ...patch, sha256: undefined } : config));
  };
  const remove = (index: number) => onChange(configs.filter((_config, candidate) => candidate !== index));

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-medium">Managed mod configs</h4>
          <p className="mt-1 text-xs leading-5 text-white/40">
            These files are written under <span className="font-mono">BepInEx/config</span> before mods initialize. Removing a file here stops managing it; the bootstrap removes its previous managed copy.
            Config contents are delivered to every player, so never put server passwords, API keys, or other secrets here.
          </p>
        </div>
        <button type="button" onClick={add} className="inline-flex items-center gap-1.5 rounded-lg bg-accent-primary px-3 py-2 text-xs font-medium hover:bg-accent-primary/80">
          <IconPlus size={15} /> Add config
        </button>
      </div>

      {configs.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-7 text-center text-xs text-white/35">
          No centrally managed config files.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {configs.map((config, index) => (
            <div key={index} className="rounded-xl border border-white/8 bg-black/15 p-3">
              <div className="flex items-center gap-2">
                <IconFileCode size={17} className="shrink-0 text-accent-primary" />
                <input
                  required
                  maxLength={512}
                  value={config.path}
                  onChange={(event) => update(index, { path: event.target.value })}
                  placeholder="Author.ModName.cfg"
                  className={`${fieldClass} font-mono text-xs`}
                  aria-label={`Managed config ${index + 1} path`}
                />
                <button type="button" onClick={() => remove(index)} className="rounded-lg p-2 text-red-300/70 hover:bg-red-500/15 hover:text-red-300" aria-label={`Remove ${config.path || `config ${index + 1}`}`}>
                  <IconTrash size={16} />
                </button>
              </div>
              <textarea
                rows={10}
                value={config.contents}
                onChange={(event) => update(index, { contents: event.target.value })}
                placeholder="# Paste the complete server-managed configuration here"
                className={`${fieldClass} mt-3 resize-y font-mono text-xs leading-5`}
                aria-label={`Managed config ${index + 1} contents`}
              />
              <p className="mt-2 text-right text-[10px] text-white/25">{new TextEncoder().encode(config.contents).length.toLocaleString()} / 61,440 bytes</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
