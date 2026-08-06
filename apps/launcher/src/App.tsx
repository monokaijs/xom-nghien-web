import { useEffect, useMemo, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import {
  IconAdjustments, IconCloudDownload, IconDeviceGamepad2, IconFolder, IconLanguage,
  IconChevronDown, IconPlayerPlay, IconPlus, IconRefresh, IconSearch, IconServer, IconSettings, IconTrash,
  IconPackage, IconX,
} from '@tabler/icons-react';
import { translator } from './i18n';
import { invoke } from './desktop';
import type {
  BootstrapData, CatalogPackage, LauncherPackageRef, LauncherServer, LauncherSettings, Page, ProfileDetails, ProfileSummary,
} from './types';

type Activity = { id: number; message: string; state: 'running' | 'done' | 'error' };

export default function App() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [page, setPage] = useState<Page>('servers');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [optional, setOptional] = useState<Record<string, string[]>>({});
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [activity, setActivity] = useState<Activity[]>([]);
  const locale = data?.settings.language || 'en';
  const t = useMemo(() => translator(locale), [locale]);

  const refresh = async () => {
    try {
      setError(null);
      const next = await invoke<BootstrapData>('bootstrap');
      setData(next);
      setSelectedProfile((current) => current || next.profiles[0]?.id || '');
    } catch (reason) {
      setError(String(reason));
    }
  };

  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!data) return;
    setOptional(Object.fromEntries(data.servers.map((server) => [server.id, server.selectedOptionalPackages])));
  }, [data]);
  useEffect(() => {
    if (!data?.settings.checkForUpdates) return;
    invoke<string | null>('available_update').then((version) => {
      if (version && confirm(`Launcher ${version} is available. Install it now?`)) void invoke('install_update');
    }).catch(() => undefined);
  }, [data?.settings.checkForUpdates]);

  const runTask = async (label: string, key: string, action: () => Promise<unknown>) => {
    const id = Date.now();
    setActivity((items) => [{ id, message: label, state: 'running' }, ...items]);
    setBusy(key);
    setError(null);
    try {
      await action();
      setActivity((items) => items.map((item) => item.id === id ? { ...item, state: 'done' } : item));
      await refresh();
    } catch (reason) {
      setActivity((items) => items.map((item) => item.id === id ? { ...item, state: 'error' } : item));
      setError(String(reason));
    } finally {
      setBusy(null);
    }
  };

  if (!data) {
    return <main className="splash"><div className="brand-mark">XN</div><p>{error || 'Loading launcher…'}</p></main>;
  }

  const nav: Array<[Page, string, React.ReactNode]> = [
    ['servers', t('servers'), <IconServer />],
    ['profiles', t('profiles'), <IconAdjustments />],
    ['browse', t('browse'), <IconSearch />],
    ['downloads', t('downloads'), <IconCloudDownload />],
    ['settings', t('settings'), <IconSettings />],
  ];

  return (
    <div className="shell">
      <aside>
        <div className="brand"><div className="brand-mark">XN</div><div><strong>Xóm Nghiện</strong><span>Launcher beta</span></div></div>
        <div className="game-pill"><IconDeviceGamepad2 size={20} /><div><strong>{t('valheim')}</strong><span>Steam</span></div></div>
        <nav>{nav.map(([id, label, icon]) => (
          <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>{icon}{label}</button>
        ))}</nav>
        <div className="aside-footer"><span>v{data.appVersion}</span></div>
      </aside>

      <main className="content">
        <header><div><span className="eyebrow">VALHEIM</span><h1>{nav.find(([id]) => id === page)?.[1]}</h1></div><button className="icon-button" onClick={() => void refresh()} title="Refresh"><IconRefresh size={19} /></button></header>
        {error && <div className="alert">{error}<button onClick={() => setError(null)}>×</button></div>}
        {!data.detectedGamePath && page !== 'settings' && <div className="notice">{t('gameMissing')}</div>}

        {page === 'servers' && <ServersPage servers={data.servers} optional={optional} setOptional={setOptional} busy={busy} runTask={runTask} t={t} />}
        {page === 'profiles' && <ProfilesPage profiles={data.profiles} busy={busy} runTask={runTask} t={t} />}
        {page === 'browse' && <BrowsePage profiles={data.profiles} selectedProfile={selectedProfile} setSelectedProfile={setSelectedProfile} busy={busy} runTask={runTask} t={t} />}
        {page === 'downloads' && <ActivityPage activity={activity} />}
        {page === 'settings' && <SettingsPage settings={data.settings} detectedPath={data.detectedGamePath} onSaved={refresh} runTask={runTask} t={t} />}
      </main>
    </div>
  );
}

function ServersPage({ servers, optional, setOptional, busy, runTask, t }: {
  servers: LauncherServer[];
  optional: Record<string, string[]>;
  setOptional: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  busy: string | null;
  runTask: (label: string, key: string, action: () => Promise<unknown>) => Promise<void>;
  t: ReturnType<typeof translator>;
}) {
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const selectedServer = servers.find((server) => server.id === selectedServerId) || null;

  useEffect(() => {
    if (!selectedServer) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedServerId(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedServer]);

  if (!servers.length) return <Empty text={t('noServers')} />;
  return <>
    <div className="server-grid">{servers.map((server) => {
      const modCount = server.requiredMods.length + server.optionalMods.length;
      return <button
        type="button"
        className="server-card"
        key={server.id}
        onClick={() => setSelectedServerId(server.id)}
      >
        <span className="server-card-shade" />
        <span className="server-card-top">
          <strong>{server.name}</strong>
          <span className={`status-pill ${server.status}`}><span className="status-dot" />{t(server.status)}</span>
        </span>
        <span className="server-card-bottom">
          <span className="server-card-meta">
            <small>{server.host}:{server.port}</small>
            <span><IconPackage size={14} />{modCount} {modCount === 1 ? 'mod' : 'mods'}</span>
          </span>
          <span className="server-play" aria-hidden="true"><IconPlayerPlay size={20} fill="currentColor" /></span>
        </span>
      </button>;
    })}</div>

    {selectedServer && <div className="server-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedServerId(null)}>
      <section className="server-dialog" role="dialog" aria-modal="true" aria-labelledby="server-dialog-title">
        <header className="server-dialog-header">
          <div><span className={`status-pill ${selectedServer.status}`}><span className="status-dot" />{t(selectedServer.status)}</span><h2 id="server-dialog-title">{selectedServer.name}</h2><p>{selectedServer.description || `${selectedServer.host}:${selectedServer.port}`}</p></div>
          <button type="button" className="dialog-close" onClick={() => setSelectedServerId(null)} aria-label="Close"><IconX size={19} /></button>
        </header>
        <div className="server-dialog-content">
          <ModGroup title={t('required')} mods={selectedServer.requiredMods} />
          {selectedServer.optionalMods.length > 0 && <OptionalModGroup
            server={selectedServer}
            enabled={optional[selectedServer.id] || []}
            setOptional={setOptional}
            title={t('optional')}
          />}
          {selectedServer.requiredMods.length === 0 && selectedServer.optionalMods.length === 0 && <p className="no-mods">No mods required. You can launch immediately.</p>}
        </div>
        <footer className="server-dialog-footer">
          <span>{selectedServer.host}:{selectedServer.port}</span>
          <button className="primary" disabled={busy !== null} onClick={() => {
            const enabled = optional[selectedServer.id] || [];
            void runTask(t('syncing'), `server:${selectedServer.id}`, () => invoke('launch_server', { serverId: selectedServer.id, optionalPackages: enabled }));
          }}>
            <IconPlayerPlay size={20} />{busy === `server:${selectedServer.id}` ? t('syncing') : t('play')}
          </button>
        </footer>
      </section>
    </div>}
  </>;
}

function OptionalModGroup({ server, enabled, setOptional, title }: {
  server: LauncherServer;
  enabled: string[];
  setOptional: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  title: string;
}) {
  return <div className="mod-group"><h3>{title}</h3>{server.optionalMods.map((mod) => {
    const key = packageKey(mod);
    return <label className="mod-row selectable" key={key}><input type="checkbox" checked={enabled.includes(key)} onChange={() => setOptional((all) => ({
      ...all, [server.id]: enabled.includes(key) ? enabled.filter((item) => item !== key) : [...enabled, key],
    }))} /><ModIdentity mod={mod} /></label>;
  })}</div>;
}

function ModGroup({ title, mods }: { title: string; mods: LauncherPackageRef[] }) {
  if (!mods.length) return null;
  return <div className="mod-group"><h3>{title}</h3>{mods.map((mod) => <div className="mod-row" key={packageKey(mod)}><ModIdentity mod={mod} /></div>)}</div>;
}

function ModIdentity({ mod }: { mod: Pick<LauncherPackageRef, 'displayName' | 'namespace' | 'versionNumber' | 'iconUrl'> }) {
  return <div className="mod-identity">{mod.iconUrl ? <img src={mod.iconUrl} alt="" /> : <div className="mod-placeholder">M</div>}<div><strong>{mod.displayName}</strong><span>{mod.namespace} · {mod.versionNumber}</span></div></div>;
}

function ProfilesPage({ profiles, busy, runTask, t }: {
  profiles: ProfileSummary[]; busy: string | null;
  runTask: (label: string, key: string, action: () => Promise<unknown>) => Promise<void>;
  t: ReturnType<typeof translator>;
}) {
  const [name, setName] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, ProfileDetails>>({});
  const loadDetails = async (profileId: string) => {
    const value = await invoke<ProfileDetails>('profile_details', { profileId });
    setDetails((all) => ({ ...all, [profileId]: value }));
  };
  const toggleDetails = async (profileId: string) => {
    if (expanded === profileId) { setExpanded(null); return; }
    setExpanded(profileId);
    await loadDetails(profileId);
  };
  return <>
    <form className="create-row" onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; void runTask(t('createProfile'), 'create', () => invoke('create_profile', { name: name.trim() })).then(() => setName('')); }}>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t('profileName')} maxLength={80} /><button className="primary" disabled={!name.trim() || busy !== null}><IconPlus size={18} />{t('createProfile')}</button>
    </form>
    {!profiles.length ? <Empty text={t('noProfiles')} /> : <div className="profile-list">{profiles.map((profile) => <article key={profile.id} className="profile-card">
      <div className="profile-summary"><div><span className="profile-kind">{profile.kind}</span><h2>{profile.name}</h2><p>{profile.packageCount} mods · {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'Not synchronized'}</p></div>
      <div className="actions"><button onClick={() => void toggleDetails(profile.id)}><IconChevronDown size={17} />Manage</button><button onClick={() => invoke('open_profile_folder', { profileId: profile.id })}><IconFolder size={17} />{t('openFolder')}</button><button disabled={busy !== null} onClick={() => void runTask(t('repair'), `repair:${profile.id}`, () => invoke('repair_profile', { profileId: profile.id }))}><IconRefresh size={17} />{t('repair')}</button><button disabled={busy !== null} onClick={() => confirm(`Reset and reinstall ${profile.name}?`) && void runTask(t('reset'), `reset:${profile.id}`, () => invoke('reset_profile', { profileId: profile.id }))}>{t('reset')}</button>{profile.kind === 'personal' && <button className="danger" disabled={busy !== null} onClick={() => confirm(`Delete ${profile.name}?`) && void runTask(t('reset'), `delete:${profile.id}`, () => invoke('delete_profile', { profileId: profile.id }))}><IconTrash size={17} /></button>}</div></div>
      {expanded === profile.id && <div className="package-manager">{!details[profile.id] ? <p>Loading…</p> : details[profile.id].metadata.requestedPackages.length === 0 ? <p>No direct mods in this profile.</p> : details[profile.id].metadata.requestedPackages.map((mod) => <div className="package-row" key={`${mod.origin}:${mod.coordinate}`}><label><input type="checkbox" checked={mod.enabled} disabled={mod.origin === 'required' || mod.origin === 'runtime' || busy !== null} onChange={(event) => void runTask(`${event.target.checked ? 'Enable' : 'Disable'} ${mod.coordinate}`, `toggle:${mod.coordinate}`, () => invoke('set_package_enabled', { profileId: profile.id, coordinate: mod.coordinate, enabled: event.target.checked })).then(() => loadDetails(profile.id))} /><span><strong>{mod.coordinate}</strong><small>{mod.origin}</small></span></label>{mod.origin === 'extra' && <button className="danger" disabled={busy !== null} onClick={() => void runTask(`Remove ${mod.coordinate}`, `remove:${mod.coordinate}`, () => invoke('remove_package', { profileId: profile.id, coordinate: mod.coordinate })).then(() => loadDetails(profile.id))}><IconTrash size={15} /></button>}</div>)}</div>}
    </article>)}</div>}
  </>;
}

function BrowsePage({ profiles, selectedProfile, setSelectedProfile, busy, runTask, t }: {
  profiles: ProfileSummary[]; selectedProfile: string; setSelectedProfile: (id: string) => void; busy: string | null;
  runTask: (label: string, key: string, action: () => Promise<unknown>) => Promise<void>;
  t: ReturnType<typeof translator>;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogPackage[]>([]);
  const [searching, setSearching] = useState(false);
  const personalProfiles = profiles.filter((profile) => profile.kind === 'personal');
  const hasSelectedProfile = personalProfiles.some((profile) => profile.id === selectedProfile);
  const search = async () => { setSearching(true); try { setResults(await invoke('search_mods', { query })); } finally { setSearching(false); } };
  return <>
    <div className="browse-tools"><select value={hasSelectedProfile ? selectedProfile : ''} onChange={(event) => setSelectedProfile(event.target.value)}><option value="">{t('profiles')}</option>{personalProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select><div className="search-box"><IconSearch size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void search()} placeholder={t('search')} /><button onClick={() => void search()} disabled={searching}>{searching ? '…' : t('browse')}</button></div></div>
    <div className="catalog-grid">{results.map((mod) => <article key={mod.fullName}><ModIdentity mod={{ displayName: mod.name, namespace: mod.namespace, versionNumber: mod.versionNumber, iconUrl: mod.iconUrl }} /><p>{mod.description}</p><footer><span>{mod.downloadCount.toLocaleString()} downloads</span><button disabled={!hasSelectedProfile || busy !== null || mod.isDeprecated} onClick={() => void runTask(`${t('install')} ${mod.name}`, `install:${mod.fullName}`, () => invoke('install_mod', { profileId: selectedProfile, packageRef: `${mod.namespace}-${mod.name}-${mod.versionNumber}` }))}>{t('install')}</button></footer></article>)}</div>
  </>;
}

function ActivityPage({ activity }: { activity: Activity[] }) {
  if (!activity.length) return <Empty text="No download or synchronization activity yet." />;
  return <div className="activity-list">{activity.map((item) => <div key={item.id} className={item.state}><span>{item.state === 'running' ? '◌' : item.state === 'done' ? '✓' : '!'}</span>{item.message}</div>)}</div>;
}

function SettingsPage({ settings, detectedPath, onSaved, runTask, t }: {
  settings: LauncherSettings; detectedPath: string | null; onSaved: () => Promise<void>;
  runTask: (label: string, key: string, action: () => Promise<unknown>) => Promise<void>;
  t: ReturnType<typeof translator>;
}) {
  const [form, setForm] = useState(settings);
  const pickGame = async () => { const path = await open({ multiple: false, directory: false, title: 'Choose Valheim executable' }); if (path) setForm({ ...form, gamePath: path }); };
  return <div className="settings-form">
    <label>Website API URL<input value={form.apiBaseUrl} onChange={(e) => setForm({ ...form, apiBaseUrl: e.target.value })} /></label>
    <label>Valheim executable<div className="path-input"><input value={form.gamePath || detectedPath || ''} onChange={(e) => setForm({ ...form, gamePath: e.target.value || null })} /><button onClick={() => void pickGame()}>…</button></div></label>
    <div className="settings-grid"><label><IconLanguage size={16} /> Language<select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as LauncherSettings['language'] })}><option value="en">English</option><option value="vi">Tiếng Việt</option></select></label><label>Concurrent downloads<input type="number" min={1} max={8} value={form.downloadConcurrency} onChange={(e) => setForm({ ...form, downloadConcurrency: Number(e.target.value) })} /></label></div>
    <label>Additional launch arguments<input value={form.launchArguments} onChange={(e) => setForm({ ...form, launchArguments: e.target.value })} /></label>
    <label className="check"><input type="checkbox" checked={form.minimizeOnLaunch} onChange={(e) => setForm({ ...form, minimizeOnLaunch: e.target.checked })} /> Minimize launcher when Valheim starts</label>
    <label className="check"><input type="checkbox" checked={form.checkForUpdates} onChange={(e) => setForm({ ...form, checkForUpdates: e.target.checked })} /> Check for launcher updates</label>
    <div className="settings-actions"><button className="primary" onClick={() => void invoke('save_settings', { settings: form }).then(onSaved)}>{t('save')}</button><button onClick={() => void runTask(t('clearCache'), 'cache', () => invoke('clear_cache'))}>{t('clearCache')}</button><button onClick={() => void invoke('open_logs_folder')}>Open logs</button></div>
  </div>;
}

function Empty({ text }: { text: string }) { return <div className="empty"><IconDeviceGamepad2 size={44} /><p>{text}</p></div>; }
function packageKey(mod: LauncherPackageRef) { return `${mod.namespace}-${mod.packageName}-${mod.versionNumber}`; }
