import { useEffect, useMemo, useState } from 'react';
import { open, save as saveDialog } from '@tauri-apps/plugin-dialog';
import {
  IconAdjustments, IconAlertTriangle, IconChevronDown, IconChevronLeft, IconChevronRight, IconCopy, IconDeviceGamepad2,
  IconBrandDiscord, IconCheck, IconDeviceFloppy, IconDots, IconDownload, IconExternalLink, IconFileSettings, IconFolder, IconLanguage, IconPackage, IconPlayerPlay,
  IconPlus, IconRefresh, IconSearch, IconServer, IconSettings, IconTrash, IconUpload,
  IconTrophy, IconUser, IconWorld, IconX,
} from '@tabler/icons-react';
import { translator } from './i18n';
import { invoke, listenForServerDeepLinks } from './desktop';
import { coordinateIdentity, personalProfiles, requestIsSynced } from './profile-ui';
import type {
  BootstrapData, CatalogPackage, LauncherConnection, LauncherPackageRef, LauncherServer,
  LauncherSettings, ModConfigDocument, ModConfigFile, ModUpdateInfo, Page, ProfileDetails, ProfileImportPreview, ProfileSummary,
  ProfileUpdateCheck, RequestedPackage,
} from './types';

type TaskState = { message: string; state: 'running' | 'done' | 'error' } | null;
type TaskOutcome<T> = { ok: true; value: T } | { ok: false };
type TaskRunner = <T>(label: string, key: string, action: () => Promise<T>) => Promise<TaskOutcome<T>>;
type ConnectionState = { status: 'loading' } | { status: 'ready'; data: LauncherConnection } | { status: 'error' };

export default function App() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [page, setPage] = useState<Page>('servers');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [task, setTask] = useState<TaskState>(null);
  const [linkedServerId, setLinkedServerId] = useState<string | null>(null);
  const [optional, setOptional] = useState<Record<string, string[]>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.localStorage.getItem('xom-launcher-sidebar-collapsed') === 'true');
  const locale = data?.settings.language || 'vi';
  const t = useMemo(() => translator(locale), [locale]);

  const refresh = async () => {
    try {
      setError(null);
      const next = await invoke<BootstrapData>('bootstrap');
      setData(next);
      const personal = next.profiles.filter((profile) => profile.kind === 'personal');
      setSelectedProfile((current) => personal.some((profile) => profile.id === current) ? current : personal[0]?.id || '');
    } catch (reason) {
      setError(String(reason));
    }
  };

  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    let disposed = false;
    let unlisten = () => {};
    listenForServerDeepLinks((serverId) => {
      setPage('servers');
      setLinkedServerId(serverId);
    }).then((stop) => {
      if (disposed) stop();
      else unlisten = stop;
    }).catch((reason) => setError(String(reason)));
    return () => {
      disposed = true;
      unlisten();
    };
  }, []);
  useEffect(() => { window.localStorage.setItem('xom-launcher-sidebar-collapsed', String(sidebarCollapsed)); }, [sidebarCollapsed]);
  useEffect(() => {
    if (!data) return;
    setOptional(Object.fromEntries(data.servers.map((server) => [server.id, server.selectedOptionalPackages])));
  }, [data]);
  useEffect(() => {
    if (!data?.settings.checkForUpdates || data.firstRun) return;
    invoke<string | null>('available_update').then((version) => {
      if (!version) return;
      void runTask(`Installing launcher ${version}…`, 'launcher-update', () => invoke('install_update'));
    }).catch((reason) => setError(String(reason)));
  }, [data?.settings.checkForUpdates]);

  const runTask: TaskRunner = async (label, key, action) => {
    setBusy(key);
    setError(null);
    setTask({ message: label, state: 'running' });
    try {
      const result = await action();
      setTask({ message: label, state: 'done' });
      window.setTimeout(() => setTask((current) => current?.state === 'done' ? null : current), 2600);
      return { ok: true, value: result };
    } catch (reason) {
      const message = String(reason);
      setError(message);
      setTask({ message, state: 'error' });
      return { ok: false };
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (!data || data.firstRun || !linkedServerId || busy !== null) return;
    const server = data.servers.find((candidate) => candidate.id === linkedServerId);
    setLinkedServerId(null);
    if (!server) {
      setError(t('noServersDescription'));
      return;
    }
    const selectedOptionalPackages = optional[server.id] ?? server.selectedOptionalPackages;
    void runTask(t('syncing'), `server:${server.id}`, () => invoke('launch_server', {
      serverId: server.id,
      optionalPackages: selectedOptionalPackages,
    }));
  }, [data, linkedServerId, busy]);

  if (!data) return <main className="splash"><div className="brand-mark">XN</div><p>{error || t('loadingLauncher')}</p></main>;

  const nav: Array<[Page, string, React.ReactNode]> = [
    ['servers', t('servers'), <IconServer key="server" />],
    ['profiles', t('myProfiles'), <IconAdjustments key="profiles" />],
    ['settings', t('settings'), <IconSettings key="settings" />],
  ];
  const completeFirstRun = async (language: LauncherSettings['language']) => {
    const settings = { ...data.settings, language };
    const copy = translator(language);
    const result = await runTask(copy('savingLanguage'), 'first-run-language', () => invoke('save_settings', { settings }));
    if (result.ok) setData({ ...data, settings, firstRun: false });
  };

  return <div className={`shell launcher-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className="launcher-sidebar">
      <div className="brand"><div className="brand-mark">XN</div><div><strong>Xóm Nghiện</strong><span>v{data.appVersion}</span></div></div>
      <div className="game-pill"><IconDeviceGamepad2 size={20} /><div><strong>{t('valheim')}</strong><span>Steam</span></div></div>
      <nav>{nav.filter(([id]) => id !== 'settings').map(([id, label, icon]) => <button key={id} className={page === id ? 'active' : ''} aria-label={label} title={sidebarCollapsed ? label : undefined} onClick={() => setPage(id)}>{icon}<span>{label}</span></button>)}</nav>
      <button className="sidebar-toggle" aria-label={sidebarCollapsed ? t('expandSidebar') : t('collapseSidebar')} title={sidebarCollapsed ? t('expandSidebar') : t('collapseSidebar')} onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}>{sidebarCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}</button>
      <div className="sidebar-bottom">
        <button className={`sidebar-settings ${page === 'settings' ? 'active' : ''}`} aria-label={t('settings')} title={sidebarCollapsed ? t('settings') : undefined} onClick={() => setPage('settings')}><IconSettings size={20} /><span>{t('settings')}</span></button>
        <div className="sidebar-avatar"><span className="sidebar-avatar-media"><IconUser size={20} /></span><span className="sidebar-avatar-copy"><strong>{t('guest')}</strong></span></div>
      </div>
    </aside>
    <main className="content">
      <header className="page-header"><div><span className="eyebrow">VALHEIM</span><h1>{nav.find(([id]) => id === page)?.[1]}</h1></div>{page !== 'profiles' && <button className="icon-button" onClick={() => void refresh()} title={t('refresh')}><IconRefresh size={19} /></button>}</header>
      {error && <div className="alert" role="alert">{error}<button onClick={() => setError(null)} aria-label={t('close')}>×</button></div>}
      {!data.detectedGamePath && page !== 'settings' && <div className="notice">{t('gameMissing')}</div>}
      {page === 'servers' && <ServersPage servers={data.servers} profiles={personalProfiles(data.profiles)} serverProfiles={data.profiles.filter((profile) => profile.kind === 'server')} optional={optional} setOptional={setOptional} busy={busy} runTask={runTask} onProfilesChanged={refresh} onTranslationInstalled={async (profileId) => { await refresh(); setSelectedProfile(profileId); setPage('profiles'); }} t={t} />}
      {page === 'profiles' && <ProfilesPage profiles={personalProfiles(data.profiles)} selectedProfile={selectedProfile} setSelectedProfile={setSelectedProfile} busy={busy} runTask={runTask} refresh={refresh} t={t} />}
      {page === 'settings' && <SettingsPage settings={data.settings} detectedPath={data.detectedGamePath} onSaved={refresh} runTask={runTask} t={t} />}
    </main>
    {task && <div className={`task-toast ${task.state}`} role="status">
      {task.state === 'running' ? <span className="task-spinner" /> : task.state === 'done' ? <span>✓</span> : <IconAlertTriangle size={18} />}
      <span>{task.message}</span>{task.state !== 'running' && <button onClick={() => setTask(null)} aria-label={t('close')}><IconX size={15} /></button>}
    </div>}
    {data.firstRun && <FirstRunLanguageDialog initialLanguage={data.settings.language} busy={busy !== null} onComplete={completeFirstRun} />}
  </div>;
}

function FirstRunLanguageDialog({ initialLanguage, busy, onComplete }: {
  initialLanguage: LauncherSettings['language'];
  busy: boolean;
  onComplete: (language: LauncherSettings['language']) => Promise<void>;
}) {
  const [language, setLanguage] = useState(initialLanguage);
  const copy = useMemo(() => translator(language), [language]);
  return <Modal label={copy('chooseLauncherLanguage')} onClose={() => {}} dismissible={false}>
    <form className="dialog-form first-run-dialog" onSubmit={(event) => { event.preventDefault(); void onComplete(language); }}>
      <div className="first-run-icon"><IconLanguage size={24} /></div>
      <span className="eyebrow">XÓM NGHIỆN LAUNCHER</span>
      <h2>{copy('chooseLauncherLanguage')}</h2>
      <p>{copy('chooseLauncherLanguageDescription')}</p>
      <div className="language-options" role="group" aria-label={copy('chooseLauncherLanguage')}>
        <button type="button" className={language === 'en' ? 'selected' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}><span className="language-flag" aria-hidden="true">🇬🇧</span><strong>English</strong></button>
        <button type="button" className={language === 'vi' ? 'selected' : ''} aria-pressed={language === 'vi'} onClick={() => setLanguage('vi')}><span className="language-flag" aria-hidden="true">🇻🇳</span><strong>Tiếng Việt</strong></button>
      </div>
      <button className="primary first-run-continue" disabled={busy}>{copy('continue')}</button>
    </form>
  </Modal>;
}

function ServersPage({ servers, profiles, serverProfiles, optional, setOptional, busy, runTask, onProfilesChanged, onTranslationInstalled, t }: {
  servers: LauncherServer[];
  profiles: ProfileSummary[];
  serverProfiles: ProfileSummary[];
  optional: Record<string, string[]>;
  setOptional: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  busy: string | null;
  runTask: TaskRunner;
  onProfilesChanged: () => Promise<void>;
  onTranslationInstalled: (profileId: string) => Promise<void>;
  t: ReturnType<typeof translator>;
}) {
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, ConnectionState>>({});
  const [copied, setCopied] = useState(false);
  const [configTarget, setConfigTarget] = useState<{ profileId: string; coordinate: string; name: string } | null>(null);
  const selected = servers.find((server) => server.id === selectedServerId) || null;
  const selectedConnection = selected ? connections[selected.id] : undefined;
  const selectedProfile = selected ? serverProfiles.find((profile) => profile.serverId === selected.id) : undefined;

  const runServer = async (launch: boolean) => {
    if (!selected) return;
    const command = launch ? 'launch_server' : 'sync_server_profile';
    const outcome = await runTask(launch ? t('syncAndPlay') : t('syncNow'), `${command}:${selected.id}`, () => invoke(command, { serverId: selected.id, optionalPackages: optional[selected.id] || [] }));
    if (outcome.ok) await onProfilesChanged();
  };

  useEffect(() => {
    if (!selectedServerId || connections[selectedServerId]) return;
    setConnections((all) => ({ ...all, [selectedServerId]: { status: 'loading' } }));
    invoke<LauncherConnection>('server_connection', { serverId: selectedServerId })
      .then((value) => setConnections((all) => ({ ...all, [selectedServerId]: { status: 'ready', data: value } })))
      .catch(() => setConnections((all) => ({ ...all, [selectedServerId]: { status: 'error' } })));
  }, [selectedServerId]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setSelectedServerId(null);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return <>
    <div className="home-hero-row"><LauncherHero t={t} /><TranslationCard profiles={profiles} busy={busy} runTask={runTask} onInstalled={onTranslationInstalled} t={t} /></div>
    <div className="home-dashboard-grid">
      <section className="server-section" aria-labelledby="server-list-title"><div className="section-heading-row"><h2 id="server-list-title">{t('servers')}</h2>{servers.length > 0 && <span>{servers.length}</span>}</div>
        {!servers.length ? <Empty title={t('noServers')} description={t('noServersDescription')} /> : <div className="server-grid focused-server-grid">{servers.map((server) => {
          const modCount = server.requiredMods.length + server.optionalMods.length;
          return <button className="server-card" key={server.id} onClick={() => setSelectedServerId(server.id)}>
            <span className="server-card-shade" /><span className="server-card-top"><strong>{server.name}</strong><StatusPill status={server.status} label={t(server.status)} /></span>
            <span className="server-card-bottom"><span className="server-card-meta"><small>{server.host}:{server.port}</small><span><IconPackage size={14} />{modCount} {t('mods')}</span></span><span className="server-play"><IconPlayerPlay size={20} fill="currentColor" /></span></span>
          </button>;
        })}</div>}
        <RelatedResources t={t} />
      </section>
      <aside className="leaderboard-column" aria-labelledby="leaderboard-column-title"><div className="leaderboard-column-heading"><div><h2 id="leaderboard-column-title">{t('leaderboard')}</h2></div></div><LeaderboardComingSoon t={t} /></aside>
    </div>
    {selected && <Modal onClose={() => setSelectedServerId(null)} label={selected.name} wide>
      <div className="server-detail">
        <section className="server-detail-main"><StatusPill status={selected.status} label={t(selected.status)} /><h2>{selected.name}</h2><p>{selected.description || t('serverDescriptionFallback')}</p>
          <ModGroup title={t('required')} mods={selected.requiredMods} onConfigure={(mod) => setConfigTarget({ profileId: `server-${selected.id}`, coordinate: packageKey(mod), name: mod.displayName })} configureLabel={t('editConfig')} />
          {selected.optionalMods.length > 0 && <div className="mod-group"><h3>{t('optional')}</h3>{selected.optionalMods.map((mod) => {
            const key = packageKey(mod); const enabled = optional[selected.id] || [];
            return <div className="mod-row server-mod-row" key={key}><label className="selectable"><input type="checkbox" checked={enabled.includes(key)} onChange={() => setOptional((all) => ({ ...all, [selected.id]: enabled.includes(key) ? enabled.filter((item) => item !== key) : [...enabled, key] }))} /><ModIdentity mod={mod} /></label><button className="config-button" disabled={!enabled.includes(key)} onClick={() => setConfigTarget({ profileId: `server-${selected.id}`, coordinate: key, name: mod.displayName })} title={t('editConfig')}><IconFileSettings size={16} /></button></div>;
          })}</div>}
        </section>
        <aside className="server-connect"><div className="server-profile-panel"><span className="eyebrow">{t('serverProfile')}</span><div><strong>{t('managedServerProfile')}</strong><span className={`sync-badge ${selectedProfile?.syncState || 'notInstalled'}`}>{syncLabel(selectedProfile?.syncState || 'notInstalled', t)}</span></div><p>{t('serverProfileDescription')}</p><div className="server-profile-actions"><button disabled={busy !== null} onClick={() => void runServer(false)}><IconRefresh size={16} />{t('syncNow')}</button><button onClick={() => void invoke('open_profile_folder', { profileId: `server-${selected.id}` })}><IconFolder size={16} />{t('openFolder')}</button></div></div><div className="connect-icon"><IconPlayerPlay size={24} fill="currentColor" /></div><span className="eyebrow">{t('automaticConnect')}</span><h3>{t('readyToPlay')}</h3><p>{t('connectDescription')}</p>
          <button className="primary wide-button" disabled={busy !== null} onClick={() => void runServer(true)}><IconPlayerPlay size={19} fill="currentColor" />{t('syncAndPlay')}</button>
          <div className="manual-connect"><h4>{t('manualConnect')}</h4><div className="connection-address"><div><span>{t('serverAddress')}</span><strong>{selected.host}:{selected.port}</strong></div><button onClick={() => { void navigator.clipboard.writeText(`${selected.host}:${selected.port}`); setCopied(true); }}><IconCopy size={17} /></button></div>
            <div className="connection-password"><div><span>{t('password')}</span><strong>{selectedConnection?.status === 'ready' ? selectedConnection.data.password : selectedConnection?.status === 'error' ? t('passwordUnavailable') : t('loading')}</strong></div>{selectedConnection?.status === 'ready' && <button onClick={() => { void navigator.clipboard.writeText(selectedConnection.data.password); setCopied(true); }}><IconCopy size={17} /></button>}</div>
            {copied && <small className="copy-feedback">{t('copied')}</small>}
          </div>
        </aside>
      </div>
    </Modal>}
    {configTarget && <ConfigEditor target={configTarget} busy={busy} runTask={runTask} onClose={() => setConfigTarget(null)} t={t} />}
  </>;
}

function RelatedResources({ t }: { t: ReturnType<typeof translator> }) {
  const resources = [
    { title: t('xomNghienWebsite'), description: t('xomNghienWebsiteDescription'), url: 'https://xomnghien.com', icon: <IconWorld size={18} /> },
    { title: t('valheimThunderstore'), description: t('valheimThunderstoreDescription'), url: 'https://thunderstore.io/c/valheim/', icon: <IconPackage size={18} /> },
    { title: t('communityDiscord'), description: t('communityDiscordDescription'), url: 'https://discord.gg/WYaqghEaMe', icon: <IconBrandDiscord size={18} /> },
  ];
  return <section className="related-resources" aria-labelledby="related-resources-title">
    <div className="related-resources-heading"><h3 id="related-resources-title">{t('relatedResources')}</h3></div>
    <div className="resource-grid">{resources.map((resource) => <button type="button" className="resource-card" key={resource.url} onClick={() => void invoke('open_external_url', { url: resource.url })}><span className="resource-icon">{resource.icon}</span><span className="resource-copy"><strong>{resource.title}</strong><small>{resource.description}</small></span><IconExternalLink className="resource-arrow" size={15} /></button>)}</div>
  </section>;
}

function TranslationCard({ profiles, busy, runTask, onInstalled, t }: {
  profiles: ProfileSummary[];
  busy: string | null;
  runTask: TaskRunner;
  onInstalled: (profileId: string) => Promise<void>;
  t: ReturnType<typeof translator>;
}) {
  const [target, setTarget] = useState(profiles[0]?.id || 'new');
  const [dialogOpen, setDialogOpen] = useState(false);
  useEffect(() => {
    if (target === 'new' || profiles.some((profile) => profile.id === target)) return;
    setTarget(profiles[0]?.id || 'new');
  }, [profiles, target]);

  const install = async () => {
    const result = await runTask(t('installingVietnamese'), 'vietnamese-translation', () => invoke<ProfileSummary>('install_vietnamese_translation', { profileId: target === 'new' ? null : target }));
    if (result.ok) {
      setDialogOpen(false);
      await onInstalled(result.value.id);
    }
  };

  return <>
    <section className="translation-card home-translation-card" aria-labelledby="translation-card-title">
      <div className="translation-card-copy"><span>{t('vietnameseTranslation')}</span><h2 id="translation-card-title">{t('playInVietnamese')}</h2><p>{t('translationDescription')}</p><small>{t('translationAttribution')}</small></div>
      <div className="translation-card-action"><button className="primary" disabled={busy !== null} onClick={() => setDialogOpen(true)}><IconDownload size={17} />{t('installVietnamese')}</button></div>
    </section>
    {dialogOpen && <Modal label={t('chooseTranslationProfile')} onClose={() => setDialogOpen(false)}>
      <form className="dialog-form translation-install-dialog" onSubmit={(event) => { event.preventDefault(); void install(); }}>
        <h2>{t('chooseTranslationProfile')}</h2>
        <p>{t('chooseTranslationProfileDescription')}</p>
        <label>{t('installToProfile')}<select autoFocus value={target} onChange={(event) => setTarget(event.target.value)}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}<option value="new">{t('newDefaultProfile')}</option></select></label>
        <div className="dialog-actions"><button type="button" onClick={() => setDialogOpen(false)}>{t('cancel')}</button><button className="primary" disabled={busy !== null}><IconDownload size={16} />{t('installVietnamese')}</button></div>
      </form>
    </Modal>}
  </>;
}

function LauncherHero({ t }: { t: ReturnType<typeof translator> }) {
  return <section className="launcher-hero"><div className="launcher-hero-shade" /><div className="launcher-hero-copy"><span>{t('community')}</span><h2>{t('heroTitle')}</h2><p>{t('heroDescription')}</p><button type="button" onClick={() => void invoke('open_external_url', { url: 'https://discord.gg/WYaqghEaMe' })}><IconBrandDiscord size={17} />{t('joinDiscord')}</button></div><span className="hero-figure" aria-hidden="true" /></section>;
}

function LeaderboardComingSoon({ t }: { t: ReturnType<typeof translator> }) {
  return <section className="leaderboard-soon"><div className="leaderboard-glow" /><div className="leaderboard-podium" aria-hidden="true"><span className="podium second"><b>2</b></span><span className="podium first"><IconTrophy size={28} /><b>1</b></span><span className="podium third"><b>3</b></span></div><h2>{t('leaderboardComingTitle')}</h2><p>{t('leaderboardComingDescription')}</p></section>;
}

function ProfilesPage({ profiles, selectedProfile, setSelectedProfile, busy, runTask, refresh, t }: {
  profiles: ProfileSummary[];
  selectedProfile: string;
  setSelectedProfile: (id: string) => void;
  busy: string | null;
  runTask: TaskRunner;
  refresh: () => Promise<void>;
  t: ReturnType<typeof translator>;
}) {
  const [details, setDetails] = useState<ProfileDetails | null>(null);
  const [tab, setTab] = useState<'installed' | 'discover'>('installed');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogPackage[]>([]);
  const [searching, setSearching] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updates, setUpdates] = useState<Record<string, ModUpdateInfo>>({});
  const [updatesCheckedAt, setUpdatesCheckedAt] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [renameName, setRenameName] = useState('');
  const [modal, setModal] = useState<'create' | 'rename' | 'delete' | null>(null);
  const [importing, setImporting] = useState<{ path: string; preview: ProfileImportPreview; name: string } | null>(null);
  const [configTarget, setConfigTarget] = useState<{ profileId: string; coordinate: string; name: string } | null>(null);
  const selectedSummary = profiles.find((profile) => profile.id === selectedProfile) || null;
  const availableUpdateCount = Object.values(updates).filter((update) => update.updateAvailable).length;

  const loadDetails = async (profileId = selectedProfile) => {
    if (!profileId) { setDetails(null); return; }
    try { setDetails(await invoke<ProfileDetails>('profile_details', { profileId })); } catch { setDetails(null); }
  };

  const storeUpdateCheck = (check: ProfileUpdateCheck) => {
    setUpdates(Object.fromEntries(check.updates.map((update) => [coordinateIdentity(update.coordinate), update])));
    setUpdatesCheckedAt(check.checkedAt);
  };
  const fetchUpdates = async (profileId = selectedProfile) => {
    if (!profileId) { setUpdates({}); setUpdatesCheckedAt(null); return; }
    setCheckingUpdates(true);
    try { storeUpdateCheck(await invoke<ProfileUpdateCheck>('check_profile_mod_updates', { profileId })); }
    finally { setCheckingUpdates(false); }
  };
  useEffect(() => {
    let active = true;
    setUpdates({});
    setUpdatesCheckedAt(null);
    setTab('installed');
    if (!selectedProfile) {
      setDetails(null);
      return () => { active = false; };
    }
    setCheckingUpdates(true);
    void invoke<ProfileDetails>('profile_details', { profileId: selectedProfile })
      .then((next) => { if (active) setDetails(next); })
      .catch(() => { if (active) setDetails(null); });
    void invoke<ProfileUpdateCheck>('check_profile_mod_updates', { profileId: selectedProfile })
      .then((check) => { if (active) storeUpdateCheck(check); })
      .catch(() => undefined)
      .finally(() => { if (active) setCheckingUpdates(false); });
    return () => { active = false; };
  }, [selectedProfile]);
  useEffect(() => {
    if (tab !== 'discover') return;
    const timer = window.setTimeout(() => {
      setSearching(true);
      invoke<CatalogPackage[]>('search_mods', { query }).then(setResults).finally(() => setSearching(false));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [tab, query]);

  const mutate = async (label: string, key: string, action: () => Promise<ProfileDetails>) => {
    const outcome = await runTask(label, key, action);
    if (!outcome.ok) return;
    setDetails(outcome.value);
    await refresh();
  };
  const checkAllUpdates = async () => {
    if (!selectedProfile) return;
    const outcome = await runTask(t('checkingModUpdates'), `updates:${selectedProfile}`, () => invoke<ProfileUpdateCheck>('check_profile_mod_updates', { profileId: selectedProfile }));
    if (outcome.ok) storeUpdateCheck(outcome.value);
  };
  const checkOneUpdate = async (mod: RequestedPackage) => {
    const outcome = await runTask(`${t('checkingUpdate')} ${coordinateDisplayName(mod.coordinate)}`, `update-check:${mod.coordinate}`, () => invoke<ModUpdateInfo>('check_mod_update', { profileId: selectedProfile, coordinate: mod.coordinate }));
    if (outcome.ok) setUpdates((current) => ({ ...current, [coordinateIdentity(mod.coordinate)]: outcome.value }));
  };
  const applyUpdates = async (mod?: RequestedPackage) => {
    const command = mod ? 'update_profile_mod' : 'update_profile_mods';
    const key = mod ? `mod-update:${mod.coordinate}` : `mod-updates:${selectedProfile}`;
    const outcome = await runTask(mod ? `${t('updating')} ${coordinateDisplayName(mod.coordinate)}` : t('updatingMods'), key, () => invoke<ProfileDetails>(command, mod ? { profileId: selectedProfile, coordinate: mod.coordinate } : { profileId: selectedProfile }));
    if (!outcome.ok) return;
    setDetails(outcome.value);
    await refresh();
    await fetchUpdates(selectedProfile);
  };
  const sync = async (launch: boolean) => {
    if (!selectedProfile) return;
    const command = launch ? 'launch_profile' : 'sync_profile';
    const result = await runTask(launch ? t('syncAndPlay') : t('syncNow'), `${command}:${selectedProfile}`, () => invoke(command, { profileId: selectedProfile }));
    if (!result.ok) return;
    await refresh();
    await loadDetails(selectedProfile);
  };
  const chooseImport = async () => {
    const path = await open({ multiple: false, directory: false, title: t('importProfile'), filters: [{ name: 'r2modman profile', extensions: ['r2z', 'r2x'] }] });
    if (!path || Array.isArray(path)) return;
    const preview = await runTask(t('readingProfile'), 'inspect-import', () => invoke<ProfileImportPreview>('inspect_profile_import', { path }));
    if (preview.ok) setImporting({ path, preview: preview.value, name: preview.value.suggestedName });
  };

  return <div className="profiles-page">
    <section className="profiles-toolbar"><div><button onClick={() => void chooseImport()}><IconUpload size={17} />{t('importProfile')}</button><button className="primary" onClick={() => { setCreateName(''); setModal('create'); }}><IconPlus size={17} />{t('createProfile')}</button></div></section>
    {!profiles.length ? <Empty title={t('noPersonalProfiles')} description={t('noPersonalProfilesDescription')} /> : <div className="profile-layout">
      <aside className="profile-rail">{profiles.map((profile) => <button key={profile.id} className={`profile-select ${selectedProfile === profile.id ? 'active' : ''}`} onClick={() => setSelectedProfile(profile.id)}><span className="profile-select-icon"><IconPackage size={19} /></span><span><strong>{profile.name}</strong><small>{profile.directModCount} {t('mods')} · {syncLabel(profile.syncState, t)}</small></span></button>)}</aside>
      <section className="profile-workspace">{!details || !selectedSummary ? <div className="workspace-loading">{t('loading')}</div> : <>
        <div className="profile-workspace-scroll">
        <div className="profile-workspace-header"><div><div className="profile-title-line"><h2>{selectedSummary.name}</h2><span className={`sync-badge ${details.syncState}`}>{syncLabel(details.syncState, t)}</span></div><p>{details.directModCount} {t('mods')} · {details.dependencyCount} {t('dependencies')} · {details.lock ? `${t('lastSynced')} ${formatDate(details.lock.generatedAt, localeOf(t))}` : t('neverSynced')}</p></div><div className="profile-primary-actions"><button className="primary" disabled={busy !== null} onClick={() => void sync(true)}><IconPlayerPlay size={18} fill="currentColor" />{t('syncAndPlay')}</button><details className="action-menu"><summary aria-label={t('moreActions')}><IconDots size={20} /></summary><div>
          <button onClick={() => { setRenameName(selectedSummary.name); setModal('rename'); }}>{t('rename')}</button>
          <button onClick={async () => { const path = await saveDialog({ title: t('exportProfile'), defaultPath: `${safeFileName(selectedSummary.name)}.r2z`, filters: [{ name: 'r2modman profile', extensions: ['r2z'] }] }); if (path) await runTask(t('exportingProfile'), 'export', () => invoke('export_profile', { profileId: selectedProfile, path })); }}><IconDownload size={15} />{t('exportProfile')}</button>
          <button onClick={() => void invoke('open_profile_folder', { profileId: selectedProfile })}><IconFolder size={15} />{t('openFolder')}</button>
          <button disabled={busy !== null} onClick={async () => { const result = await runTask(t('repairingProfile'), 'repair', () => invoke('repair_profile', { profileId: selectedProfile })); if (result.ok) { await refresh(); await loadDetails(selectedProfile); } }}><IconRefresh size={15} />{t('repair')}</button>
          <button className="danger" onClick={() => setModal('delete')}><IconTrash size={15} />{t('deleteProfile')}</button>
        </div></details></div></div>
        <div className="profile-tabs"><button className={tab === 'installed' ? 'active' : ''} onClick={() => setTab('installed')}>{t('installed')}<span>{details.directModCount}</span></button><button className={tab === 'discover' ? 'active' : ''} onClick={() => setTab('discover')}>{t('discoverMods')}</button></div>
        {tab === 'installed' && <div className="mod-update-toolbar"><label className="auto-update-control"><span><strong>{t('autoUpdateMods')}</strong><small>{t('autoUpdateModsDescription')}</small></span><span className="switch"><input type="checkbox" checked={details.metadata.autoUpdate} disabled={busy !== null} onChange={(event) => void mutate(t('savingAutoUpdate'), `auto-update:${selectedProfile}`, () => invoke('set_profile_auto_update', { profileId: selectedProfile, enabled: event.target.checked }))} /><span /></span></label><div><span className="update-check-time">{checkingUpdates ? t('checking') : updatesCheckedAt ? `${t('checked')} ${formatDate(updatesCheckedAt, localeOf(t))}` : t('notChecked')}</span><button disabled={busy !== null || checkingUpdates} onClick={() => void checkAllUpdates()}><IconRefresh size={16} />{t('checkAll')}</button>{availableUpdateCount > 0 && <button className="primary" disabled={busy !== null} onClick={() => void applyUpdates()}><IconDownload size={16} />{t('updateAll')} ({availableUpdateCount})</button>}</div></div>}
        {tab === 'installed' ? <InstalledMods details={details} busy={busy} updates={updates} onCheckUpdate={(mod) => void checkOneUpdate(mod)} onUpdate={(mod) => void applyUpdates(mod)} onConfigure={(mod) => setConfigTarget({ profileId: selectedProfile, coordinate: mod.coordinate, name: coordinateDisplayName(mod.coordinate) })} onToggle={(mod, enabled) => void mutate(`${enabled ? t('enabling') : t('disabling')} ${mod.coordinate}`, `toggle:${mod.coordinate}`, () => invoke('set_package_enabled', { profileId: selectedProfile, coordinate: mod.coordinate, enabled }))} onRemove={(mod) => void mutate(`${t('removing')} ${mod.coordinate}`, `remove:${mod.coordinate}`, () => invoke('remove_package', { profileId: selectedProfile, coordinate: mod.coordinate }))} t={t} /> : <DiscoverMods query={query} setQuery={setQuery} results={results} searching={searching} details={details} busy={busy} onAdd={(mod) => void mutate(`${t('adding')} ${mod.name}`, `add:${mod.fullName}`, () => invoke('add_profile_mod', { profileId: selectedProfile, packageRef: `${mod.namespace}-${mod.name}-${mod.versionNumber}` }))} t={t} />}
        </div>
        {details.syncState !== 'ready' && <div className="pending-bar"><div><strong>{details.syncState === 'notInstalled' ? t('profileNotInstalled') : t('changesPending')}</strong><span>{details.syncState === 'notInstalled' ? t('profileNotInstalledDescription') : t('changesPendingDescription')}</span></div><div><button disabled={busy !== null} onClick={() => void sync(false)}><IconRefresh size={17} />{t('syncNow')}</button><button className="primary" disabled={busy !== null} onClick={() => void sync(true)}><IconPlayerPlay size={17} fill="currentColor" />{t('syncAndPlay')}</button></div></div>}
      </>}</section>
    </div>}

    {modal === 'create' && <Modal label={t('createProfile')} onClose={() => setModal(null)}><form className="dialog-form" onSubmit={async (event) => { event.preventDefault(); const created = await runTask(t('creatingProfile'), 'create', () => invoke<ProfileSummary>('create_profile', { name: createName.trim() })); if (created.ok) { await refresh(); setSelectedProfile(created.value.id); setModal(null); } }}><h2>{t('createProfile')}</h2><p>{t('createProfileDescription')}</p><label>{t('profileName')}<input autoFocus value={createName} onChange={(event) => setCreateName(event.target.value)} maxLength={80} /></label><div className="dialog-actions"><button type="button" onClick={() => setModal(null)}>{t('cancel')}</button><button className="primary" disabled={!createName.trim() || busy !== null}>{t('create')}</button></div></form></Modal>}
    {modal === 'rename' && <Modal label={t('renameProfile')} onClose={() => setModal(null)}><form className="dialog-form" onSubmit={async (event) => { event.preventDefault(); const renamed = await runTask(t('renamingProfile'), 'rename', () => invoke('rename_profile', { profileId: selectedProfile, name: renameName.trim() })); if (renamed.ok) { await refresh(); await loadDetails(selectedProfile); setModal(null); } }}><h2>{t('renameProfile')}</h2><label>{t('profileName')}<input autoFocus value={renameName} onChange={(event) => setRenameName(event.target.value)} maxLength={80} /></label><div className="dialog-actions"><button type="button" onClick={() => setModal(null)}>{t('cancel')}</button><button className="primary" disabled={!renameName.trim() || busy !== null}>{t('save')}</button></div></form></Modal>}
    {modal === 'delete' && selectedSummary && <Modal label={t('deleteProfile')} onClose={() => setModal(null)}><div className="dialog-form danger-dialog"><IconAlertTriangle size={34} /><h2>{t('deleteProfile')}</h2><p>{t('deleteProfileDescription')} <strong>{selectedSummary.name}</strong>.</p><div className="dialog-actions"><button onClick={() => setModal(null)}>{t('cancel')}</button><button className="danger-button" disabled={busy !== null} onClick={async () => { const result = await runTask(t('deletingProfile'), 'delete', () => invoke('delete_profile', { profileId: selectedProfile })); if (result.ok) { setModal(null); setSelectedProfile(''); await refresh(); } }}>{t('delete')}</button></div></div></Modal>}
    {importing && <Modal label={t('importProfile')} onClose={() => setImporting(null)}><div className="dialog-form import-dialog"><h2>{t('importProfile')}</h2><p>{t('importPrivacyNotice')}</p><label>{t('profileName')}<input value={importing.name} onChange={(event) => setImporting({ ...importing, name: event.target.value })} maxLength={80} /></label><div className="import-summary"><span>{importing.preview.mods.length} {t('mods')}</span><span>{importing.preview.mods.filter((mod) => mod.enabled).length} {t('enabled')}</span><span>{importing.preview.mods.filter((mod) => mod.deprecated).length} {t('deprecated')}</span></div><div className="import-mods">{importing.preview.mods.map((mod) => <div key={mod.coordinate} className={!mod.available ? 'unavailable' : ''}><span>{mod.coordinate}</span><small>{!mod.available ? t('unavailable') : mod.enabled ? t('enabled') : t('disabled')}</small></div>)}</div>{importing.preview.blockingError && <div className="inline-error">{importing.preview.blockingError}</div>}<div className="dialog-actions"><button onClick={() => setImporting(null)}>{t('cancel')}</button><button className="primary" disabled={!importing.name.trim() || Boolean(importing.preview.blockingError) || busy !== null} onClick={async () => { const created = await runTask(t('importingProfile'), 'import', () => invoke<ProfileSummary>('import_profile', { path: importing.path, name: importing.name.trim() })); if (created.ok) { setImporting(null); await refresh(); setSelectedProfile(created.value.id); } }}>{t('import')}</button></div></div></Modal>}
    {configTarget && <ConfigEditor target={configTarget} busy={busy} runTask={runTask} onClose={() => setConfigTarget(null)} t={t} />}
  </div>;
}

function InstalledMods({ details, busy, updates, onCheckUpdate, onUpdate, onConfigure, onToggle, onRemove, t }: { details: ProfileDetails; busy: string | null; updates: Record<string, ModUpdateInfo>; onCheckUpdate: (mod: RequestedPackage) => void; onUpdate: (mod: RequestedPackage) => void; onConfigure: (mod: RequestedPackage) => void; onToggle: (mod: RequestedPackage, enabled: boolean) => void; onRemove: (mod: RequestedPackage) => void; t: ReturnType<typeof translator> }) {
  const direct = details.metadata.requestedPackages.filter((mod) => mod.origin !== 'runtime');
  const directIdentities = new Set(direct.map((mod) => coordinateIdentity(mod.coordinate)));
  const dependencies = Object.entries(details.lock?.packages || {}).filter(([identity]) => identity !== 'denikson-bepinexpack_valheim' && !directIdentities.has(identity));
  if (!direct.length) return <Empty compact title={t('noModsInstalled')} description={t('noModsInstalledDescription')} />;
  return <div className="installed-mods"><div className="installed-list">{direct.map((mod) => {
    const synced = requestIsSynced(mod, details.lock?.requestedPackages || []);
    const update = updates[coordinateIdentity(mod.coordinate)];
    return <div className="installed-row" key={mod.coordinate}><div className="mod-placeholder">M</div><div className="installed-identity"><strong>{coordinateDisplayName(mod.coordinate)}</strong><span>{mod.coordinate} · <b>{mod.origin}</b>{!synced && <em>{t('pending')}</em>}{update?.updateAvailable && <em className="update-available">{t('updateAvailable')} {update.latestVersion}</em>}</span></div><div className="installed-actions"><button className="row-config" disabled={busy !== null || !mod.enabled || !synced} onClick={() => onConfigure(mod)} title={t('editConfig')}><IconFileSettings size={16} /></button>{update?.updateAvailable ? <button className="row-update" disabled={busy !== null} onClick={() => onUpdate(mod)} title={`${t('update')} ${update.latestVersion}`}><IconDownload size={16} /><span>{t('update')}</span></button> : <button className="row-update-check" disabled={busy !== null} onClick={() => onCheckUpdate(mod)} title={t('checkForModUpdate')}><IconRefresh size={16} /></button>}<label className="switch" title={mod.enabled ? t('enabled') : t('disabled')}><input type="checkbox" checked={mod.enabled} disabled={busy !== null} onChange={(event) => onToggle(mod, event.target.checked)} /><span /></label><button className="row-trash" disabled={busy !== null} onClick={() => onRemove(mod)} title={t('remove')}><IconTrash size={17} /></button></div></div>;
  })}</div>{dependencies.length > 0 && <details className="dependency-list"><summary><IconChevronDown size={16} />{dependencies.length} {t('dependencies')}</summary>{dependencies.map(([identity, mod]) => <div key={identity}><span>{mod.namespace}-{mod.name}</span><small>{mod.version}</small></div>)}</details>}</div>;
}

function ConfigEditor({ target, busy, runTask, onClose, t }: {
  target: { profileId: string; coordinate: string; name: string };
  busy: string | null;
  runTask: TaskRunner;
  onClose: () => void;
  t: ReturnType<typeof translator>;
}) {
  const [files, setFiles] = useState<ModConfigFile[] | null>(null);
  const [document, setDocument] = useState<ModConfigDocument | null>(null);
  const [savedContents, setSavedContents] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadFile = async (path: string) => {
    setError(null);
    try {
      const next = await invoke<ModConfigDocument>('read_mod_config', { profileId: target.profileId, coordinate: target.coordinate, path });
      setDocument(next);
      setSavedContents(next.contents);
    } catch (reason) {
      setError(String(reason));
    }
  };

  useEffect(() => {
    let active = true;
    setFiles(null);
    setDocument(null);
    setError(null);
    void invoke<ModConfigFile[]>('list_mod_configs', { profileId: target.profileId, coordinate: target.coordinate })
      .then((next) => {
        if (!active) return;
        setFiles(next);
        if (next[0]) void loadFile(next[0].path);
      })
      .catch((reason) => { if (active) { setFiles([]); setError(String(reason)); } });
    return () => { active = false; };
  }, [target.profileId, target.coordinate]);

  const dirty = Boolean(document && document.contents !== savedContents);
  const close = () => {
    if (!dirty || window.confirm(t('discardConfigChanges'))) onClose();
  };
  const save = async () => {
    if (!document) return;
    const result = await runTask(t('savingConfig'), `config:${target.profileId}:${document.path}`, () => invoke('save_mod_config', { profileId: target.profileId, coordinate: target.coordinate, path: document.path, contents: document.contents }));
    if (result.ok) setSavedContents(document.contents);
  };

  return <Modal label={`${t('editConfig')}: ${target.name}`} onClose={close} wide>
    <div className="config-editor">
      <header><div><span className="eyebrow">{t('modConfiguration')}</span><h2>{target.name}</h2><p>{t('configDescription')}</p></div></header>
      {error && <div className="inline-error">{error}</div>}
      {files === null ? <div className="config-loading">{t('loading')}</div> : files.length === 0 ? <div className="config-empty"><IconFileSettings size={32} /><strong>{t('noConfigFiles')}</strong><p>{t('noConfigFilesDescription')}</p><button onClick={() => void invoke('open_profile_folder', { profileId: target.profileId })}><IconFolder size={16} />{t('openFolder')}</button></div> : <div className="config-layout">
        <aside>{files.map((file) => <button key={file.path} className={document?.path === file.path ? 'active' : ''} onClick={() => { if (!dirty || window.confirm(t('discardConfigChanges'))) void loadFile(file.path); }}><IconFileSettings size={16} /><span><strong>{file.name}</strong><small>{file.path}</small></span></button>)}</aside>
        <section>{document ? <><div className="config-file-header"><span>{document.path}</span><small>{formatBytes(document.contents.length)}</small></div><textarea spellCheck={false} value={document.contents} onChange={(event) => setDocument({ ...document, contents: event.target.value })} /><footer><span>{dirty ? t('unsavedChanges') : t('allChangesSaved')}</span><button className="primary" disabled={!dirty || busy !== null} onClick={() => void save()}><IconDeviceFloppy size={17} />{t('saveConfig')}</button></footer></> : <div className="config-loading">{t('loading')}</div>}</section>
      </div>}
    </div>
  </Modal>;
}

function DiscoverMods({ query, setQuery, results, searching, details, busy, onAdd, t }: { query: string; setQuery: (query: string) => void; results: CatalogPackage[]; searching: boolean; details: ProfileDetails; busy: string | null; onAdd: (mod: CatalogPackage) => void; t: ReturnType<typeof translator> }) {
  const installed = new Map(details.metadata.requestedPackages.map((mod) => [coordinateIdentity(mod.coordinate), mod.coordinate]));
  return <div className="discover-panel"><div className="discover-search"><IconSearch size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search')} />{searching && <span className="task-spinner" />}</div><div className="discover-grid">{results.map((mod) => {
    const coordinate = `${mod.namespace}-${mod.name}-${mod.versionNumber}`;
    const current = installed.get(`${mod.namespace}-${mod.name}`.toLocaleLowerCase());
    const exact = current === coordinate;
    return <article key={mod.fullName}><ModIdentity mod={{ displayName: mod.name, namespace: mod.namespace, versionNumber: mod.versionNumber, iconUrl: mod.iconUrl }} /><p>{mod.description}</p><footer><span>{mod.downloadCount.toLocaleString()} {t('downloadsLabel')}</span><button disabled={busy !== null || exact || mod.isDeprecated} onClick={() => onAdd(mod)}>{mod.isDeprecated ? t('deprecated') : exact ? t('added') : current ? t('update') : t('add')}</button></footer></article>;
  })}</div>{!searching && !results.length && <Empty compact title={t('noModsFound')} description={t('tryAnotherSearch')} />}</div>;
}

function SettingsPage({ settings, detectedPath, onSaved, runTask, t }: { settings: LauncherSettings; detectedPath: string | null; onSaved: () => Promise<void>; runTask: TaskRunner; t: ReturnType<typeof translator> }) {
  const [form, setForm] = useState(settings);
  const pickGame = async () => { const path = await open({ multiple: false, directory: false, title: t('chooseValheimExecutable') }); if (path && !Array.isArray(path)) setForm({ ...form, gamePath: path }); };
  return <div className="settings-form"><label>{t('websiteApiUrl')}<input value={form.apiBaseUrl} onChange={(event) => setForm({ ...form, apiBaseUrl: event.target.value })} /></label><label>{t('valheimExecutable')}<div className="path-input"><input value={form.gamePath || detectedPath || ''} onChange={(event) => setForm({ ...form, gamePath: event.target.value || null })} /><button onClick={() => void pickGame()}>…</button></div></label><div className="settings-grid"><label><span className="setting-label"><IconLanguage size={16} />{t('language')}</span><select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value as LauncherSettings['language'] })}><option value="en">English</option><option value="vi">Tiếng Việt</option></select></label><label>{t('concurrentDownloads')}<input type="number" min={1} max={8} value={form.downloadConcurrency} onChange={(event) => setForm({ ...form, downloadConcurrency: Number(event.target.value) })} /></label></div><label>{t('launchArguments')}<input value={form.launchArguments} onChange={(event) => setForm({ ...form, launchArguments: event.target.value })} /></label><label className="check"><input type="checkbox" checked={form.minimizeOnLaunch} onChange={(event) => setForm({ ...form, minimizeOnLaunch: event.target.checked })} /><span className="checkbox-control" aria-hidden="true"><IconCheck size={13} stroke={3} /></span><span>{t('minimizeOnLaunch')}</span></label><label className="check"><input type="checkbox" checked={form.checkForUpdates} onChange={(event) => setForm({ ...form, checkForUpdates: event.target.checked })} /><span className="checkbox-control" aria-hidden="true"><IconCheck size={13} stroke={3} /></span><span>{t('checkForUpdates')}</span></label><div className="settings-actions"><button className="primary" onClick={async () => { const result = await runTask(t('savingSettings'), 'settings', () => invoke('save_settings', { settings: form })); if (result.ok) await onSaved(); }}>{t('save')}</button><button onClick={() => void runTask(t('clearingCache'), 'cache', () => invoke('clear_cache'))}>{t('clearCache')}</button><button onClick={() => void invoke('open_logs_folder')}>{t('openLogs')}</button></div></div>;
}

function Modal({ children, onClose, label, wide = false, dismissible = true }: { children: React.ReactNode; onClose: () => void; label: string; wide?: boolean; dismissible?: boolean }) {
  useEffect(() => {
    if (!dismissible) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [dismissible, onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => dismissible && event.target === event.currentTarget && onClose()}><section className={`modal-card ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={label}>{dismissible && <button className="dialog-close" onClick={onClose} aria-label={label}><IconX size={19} /></button>}{children}</section></div>;
}

function Empty({ title, description, action, compact = false }: { title: string; description: string; action?: React.ReactNode; compact?: boolean }) { return <div className={`empty ${compact ? 'compact' : ''}`}><IconDeviceGamepad2 size={compact ? 32 : 44} /><strong>{title}</strong><p>{description}</p>{action}</div>; }
function StatusPill({ status, label }: { status: LauncherServer['status']; label: string }) { return <span className={`status-pill ${status}`}><span className="status-dot" />{label}</span>; }
function ModGroup({ title, mods, onConfigure, configureLabel }: { title: string; mods: LauncherPackageRef[]; onConfigure?: (mod: LauncherPackageRef) => void; configureLabel?: string }) { if (!mods.length) return null; return <div className="mod-group"><h3>{title}</h3>{mods.map((mod) => <div className="mod-row server-mod-row" key={packageKey(mod)}><ModIdentity mod={mod} />{onConfigure && <button className="config-button" onClick={() => onConfigure(mod)} title={configureLabel}><IconFileSettings size={16} /></button>}</div>)}</div>; }
function ModIdentity({ mod }: { mod: Pick<LauncherPackageRef, 'displayName' | 'namespace' | 'versionNumber' | 'iconUrl'> }) { return <div className="mod-identity">{mod.iconUrl ? <img src={mod.iconUrl} alt="" /> : <div className="mod-placeholder">M</div>}<div><strong>{mod.displayName}</strong><span>{mod.namespace} · {mod.versionNumber}</span></div></div>; }
function packageKey(mod: LauncherPackageRef) { return `${mod.namespace}-${mod.packageName}-${mod.versionNumber}`; }
function coordinateDisplayName(coordinate: string) { const withoutVersion = coordinate.replace(/-\d+\.\d+\.\d+$/, ''); return withoutVersion.includes('-') ? withoutVersion.slice(withoutVersion.indexOf('-') + 1) : withoutVersion; }
function syncLabel(state: ProfileSummary['syncState'], t: ReturnType<typeof translator>) { return state === 'ready' ? t('ready') : state === 'pending' ? t('changesPending') : t('notInstalled'); }
function safeFileName(name: string) { return name.replace(/[\\/:*?"<>|]/g, '-').trim() || 'profile'; }
function formatBytes(bytes: number) { return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`; }
function localeOf(t: ReturnType<typeof translator>) { return t('localeCode'); }
function formatDate(value: string, locale: string) { try { return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); } catch { return value; } }
