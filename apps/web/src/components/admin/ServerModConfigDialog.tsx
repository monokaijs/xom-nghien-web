"use client";

import React, { useMemo, useRef, useState } from 'react';
import {
  IconAlertTriangle,
  IconCheck,
  IconFileCode,
  IconFileUpload,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { parseBepInExConfig, updateBepInExConfigValue, type BepInExConfigEntry } from '@/lib/bepinex-config';
import type { ServerManagedConfig, ServerMod } from '@/types/server';

interface Props {
  mod: ServerMod;
  configs: ServerManagedConfig[];
  onSave: (configs: ServerManagedConfig[]) => string | null;
  onClose: () => void;
}

const fieldClass = 'w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none placeholder:text-white/25 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20';
const editableExtensions = new Set(['cfg', 'ini', 'json', 'toml', 'txt', 'xml', 'yaml', 'yml']);

export default function ServerModConfigDialog({ mod, configs, onSave, onClose }: Props) {
  const [drafts, setDrafts] = useState(() => configs.map((config) => ({ ...config })));
  const [selectedIndex, setSelectedIndex] = useState(configs.length > 0 ? 0 : -1);
  const [rawMode, setRawMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const selected = drafts[selectedIndex] || null;
  const sections = useMemo(
    () => selected?.path.toLowerCase().endsWith('.cfg') ? parseBepInExConfig(selected.contents) : [],
    [selected],
  );
  const hasStructuredFields = sections.some((section) => section.entries.length > 0);

  const updateSelected = (patch: Partial<ServerManagedConfig>) => {
    setDrafts((current) => current.map((config, index) => index === selectedIndex
      ? { ...config, ...patch, sha256: undefined }
      : config));
  };

  const addBlank = () => {
    const base = `${mod.namespace}.${mod.packageName}`;
    let path = `${base}.cfg`;
    let suffix = 2;
    while (drafts.some((config) => config.path.toLowerCase() === path.toLowerCase())) {
      path = `${base}.${suffix++}.cfg`;
    }
    setDrafts((current) => [...current, ownedConfig(mod, path, '')]);
    setSelectedIndex(drafts.length);
    setRawMode(true);
  };

  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const imported: ServerManagedConfig[] = [];
    for (const file of Array.from(files)) {
      const extension = file.name.split('.').at(-1)?.toLowerCase() || '';
      if (!editableExtensions.has(extension)) {
        setError(`${file.name} is not a supported text config file`);
        continue;
      }
      if (file.size > 60 * 1024) {
        setError(`${file.name} exceeds the 60 KiB config limit`);
        continue;
      }
      imported.push(ownedConfig(mod, file.name, await file.text()));
    }
    if (imported.length === 0) return;
    setDrafts((current) => {
      const next = [...current];
      for (const config of imported) {
        const existing = next.findIndex((item) => item.path.toLowerCase() === config.path.toLowerCase());
        if (existing >= 0) next[existing] = { ...config, target: next[existing].target };
        else next.push(config);
      }
      setSelectedIndex(next.findIndex((item) => item.path.toLowerCase() === imported[0].path.toLowerCase()));
      return next;
    });
    setRawMode(false);
    setError(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const removeSelected = () => {
    setDrafts((current) => current.filter((_config, index) => index !== selectedIndex));
    setSelectedIndex((current) => Math.min(current, drafts.length - 2));
    setRawMode(false);
  };

  const apply = () => {
    const validationError = validateDrafts(drafts);
    if (validationError) return setError(validationError);
    const parentError = onSave(drafts);
    if (parentError) return setError(parentError);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="mod-config-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-sidebar shadow-2xl">
        <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          {mod.iconUrl && <img src={mod.iconUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />}
          <div className="min-w-0 flex-1">
            <h3 id="mod-config-title" className="truncate font-semibold">Configure {mod.displayName}</h3>
            <p className="mt-0.5 text-xs text-white/40">{mod.namespace}/{mod.packageName} · v{mod.versionNumber}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-white/45 hover:bg-white/10 hover:text-white" aria-label="Close config editor"><IconX size={20} /></button>
        </header>

        <div className="grid min-h-0 flex-1 md:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="flex min-h-44 flex-col border-b border-white/10 bg-black/10 p-3 md:border-b-0 md:border-r">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent-primary px-3 py-2 text-xs font-medium hover:bg-accent-primary/80"><IconFileUpload size={15} /> Import</button>
              <button type="button" onClick={addBlank} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15"><IconPlus size={15} /> New</button>
              <input ref={fileInput} type="file" multiple accept=".cfg,.ini,.json,.toml,.txt,.xml,.yaml,.yml" className="hidden" onChange={(event) => void importFiles(event.target.files)} />
            </div>
            <div className="mt-3 min-h-0 space-y-1 overflow-y-auto">
              {drafts.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs leading-5 text-white/35">No config files for this mod.</p>
              ) : drafts.map((config, index) => (
                <button key={`${config.path}:${index}`} type="button" onClick={() => { setSelectedIndex(index); setRawMode(false); setError(null); }} className={`w-full rounded-xl border px-3 py-2.5 text-left ${selectedIndex === index ? 'border-accent-primary/50 bg-accent-primary/10' : 'border-transparent hover:bg-white/5'}`}>
                  <span className="flex items-center gap-2"><IconFileCode size={15} className="shrink-0 text-accent-primary" /><span className="truncate text-xs font-medium">{config.path || 'Untitled config'}</span></span>
                  <span className="mt-1 block pl-6 text-[10px] uppercase tracking-wide text-white/30">{config.target}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-4 sm:p-5">
            {selected ? (
              <>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                  <label className="text-xs text-white/45">Path under BepInEx/config
                    <input value={selected.path} maxLength={512} onChange={(event) => updateSelected({ path: event.target.value })} className={`${fieldClass} mt-1.5 font-mono text-xs`} />
                  </label>
                  <label className="text-xs text-white/45">Apply on
                    <select value={selected.target} onChange={(event) => updateSelected({ target: event.target.value as ServerManagedConfig['target'] })} className={`${fieldClass} mt-1.5 text-xs`}>
                      <option value="server">Server only</option>
                      <option value="client">Clients only</option>
                      <option value="both">Server and clients</option>
                    </select>
                  </label>
                  <button type="button" onClick={removeSelected} className="mt-auto inline-flex h-[38px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs text-red-300 hover:bg-red-500/10"><IconTrash size={15} /> Remove</button>
                </div>

                <div className="mt-4 flex items-center justify-between border-b border-white/10">
                  <div className="flex">
                    {hasStructuredFields && <EditorTab active={!rawMode} onClick={() => setRawMode(false)}>Fields</EditorTab>}
                    <EditorTab active={rawMode || !hasStructuredFields} onClick={() => setRawMode(true)}>Raw file</EditorTab>
                  </div>
                  <span className="pb-2 text-[10px] text-white/25">{new TextEncoder().encode(selected.contents).length.toLocaleString()} / 61,440 bytes</span>
                </div>

                {!rawMode && hasStructuredFields ? (
                  <div className="mt-4 space-y-5">
                    {sections.map((section) => (
                      <section key={section.name}>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">{section.name}</h4>
                        <div className="space-y-2">
                          {section.entries.map((entry) => <StructuredField key={entry.id} entry={entry} onChange={(value) => updateSelected({ contents: updateBepInExConfigValue(selected.contents, entry.lineIndex, value) })} />)}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <textarea rows={20} value={selected.contents} onChange={(event) => updateSelected({ contents: event.target.value })} spellCheck={false} className={`${fieldClass} mt-4 min-h-80 resize-y font-mono text-xs leading-5`} aria-label={`${selected.path} contents`} />
                )}
              </>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center text-center text-white/35"><IconFileUpload size={34} className="mb-3 opacity-50" /><p className="text-sm">Import a generated config or create a new one.</p><p className="mt-2 max-w-md text-xs leading-5 text-white/25">Like r2modman, this editor works best with the file generated after launching the mod once. Its comments describe field types and valid values.</p></div>
            )}
          </main>
        </div>

        {error && <div className="mx-5 mb-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-200"><IconAlertTriangle size={16} className="mt-0.5 shrink-0" />{error}</div>}
        <footer className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/35">Changes are staged here. Use “Save changes” on the server page to publish them. Never store passwords or API keys in managed configs.</p>
          <div className="flex shrink-0 gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm text-white/55 hover:bg-white/10 hover:text-white">Cancel</button><button type="button" onClick={apply} className="inline-flex items-center gap-2 rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-medium hover:bg-accent-primary/80"><IconCheck size={17} /> Apply changes</button></div>
        </footer>
      </div>
    </div>
  );
}

function StructuredField({ entry, onChange }: { entry: BepInExConfigEntry; onChange: (value: string) => void }) {
  return (
    <label className="block rounded-xl border border-white/5 bg-black/15 p-3">
      <span className="flex flex-wrap items-baseline justify-between gap-2"><span className="text-sm font-medium">{entry.key}</span>{entry.settingType && <span className="font-mono text-[10px] text-white/25">{entry.settingType}</span>}</span>
      {entry.description && <span className="mt-1 block text-xs leading-5 text-white/40">{entry.description}</span>}
      <span className="mt-2 block">
        {entry.control === 'boolean' ? (
          <select value={entry.value.toLowerCase() === 'true' ? 'true' : 'false'} onChange={(event) => onChange(event.target.value)} className={fieldClass}><option value="true">Enabled</option><option value="false">Disabled</option></select>
        ) : entry.control === 'select' ? (
          <select value={entry.value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>{entry.acceptableValues.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        ) : entry.control === 'multi-select' ? (
          <span className="flex flex-wrap gap-2">{entry.acceptableValues.map((value) => {
            const selected = entry.value.split(',').map((item) => item.trim()).includes(value);
            return <button key={value} type="button" onClick={() => {
              const current = entry.value.split(',').map((item) => item.trim()).filter(Boolean);
              onChange((selected ? current.filter((item) => item !== value) : [...current, value]).join(', '));
            }} className={`rounded-lg border px-2.5 py-1.5 text-xs ${selected ? 'border-accent-primary/50 bg-accent-primary/15 text-white' : 'border-white/10 text-white/45 hover:text-white'}`}>{value}</button>;
          })}</span>
        ) : <input value={entry.value} onChange={(event) => onChange(event.target.value)} className={fieldClass} />}
      </span>
    </label>
  );
}

function EditorTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`border-b-2 px-3 py-2 text-xs font-medium ${active ? 'border-accent-primary text-white' : 'border-transparent text-white/35 hover:text-white'}`}>{children}</button>;
}

function ownedConfig(mod: ServerMod, path: string, contents: string): ServerManagedConfig {
  return {
    modProvider: mod.provider,
    modNamespace: mod.namespace,
    modPackageName: mod.packageName,
    sourceVersion: mod.versionNumber,
    path,
    contents,
    target: 'server',
  };
}

function validateDrafts(configs: ServerManagedConfig[]) {
  const seen = new Set<string>();
  for (const config of configs) {
    const path = config.path.trim().replaceAll('\\', '/').replace(/^\/+/, '').replace(/^BepInEx\/config\//i, '');
    const parts = path.split('/');
    const extension = parts.at(-1)?.split('.').at(-1)?.toLowerCase() || '';
    if (!path || parts.some((part) => !part || part === '.' || part === '..') || /[<>:"|?*\u0000-\u001f]/.test(path) || !editableExtensions.has(extension)) return 'Use a safe text-file path relative to BepInEx/config.';
    if (new TextEncoder().encode(config.contents).length > 60 * 1024) return `${path} exceeds the 60 KiB config limit.`;
    if (seen.has(path.toLowerCase())) return `${path} is listed more than once.`;
    seen.add(path.toLowerCase());
  }
  return null;
}
