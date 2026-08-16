import { describe, expect, it } from 'vitest';
import { launcherPages, personalProfiles, requestIsSynced } from './profile-ui';
import type { ProfileSummary, RequestedPackage } from './types';

describe('launcher profile navigation', () => {
  it('shows only the three task-focused pages', () => {
    expect(launcherPages).toEqual(['servers', 'profiles', 'settings']);
  });

  it('keeps managed server profiles out of My Profiles', () => {
    const base = { directModCount: 0, dependencyCount: 0, syncState: 'ready', updatedAt: null } as const;
    const profiles: ProfileSummary[] = [
      { ...base, id: 'server-1', name: 'Community', kind: 'server', serverId: '1' },
      { ...base, id: 'personal-1', name: 'Solo', kind: 'personal', serverId: null },
    ];

    expect(personalProfiles(profiles).map((profile) => profile.id)).toEqual(['personal-1']);
  });
});

describe('pending mod state', () => {
  const selected: RequestedPackage = { coordinate: 'Author-Mod-1.2.3', origin: 'extra', enabled: true };

  it('recognizes an applied requested mod', () => {
    expect(requestIsSynced(selected, [selected, { coordinate: 'Runtime-Mod-1.0.0', origin: 'runtime', enabled: true }])).toBe(true);
  });

  it('marks enable-state changes as pending', () => {
    expect(requestIsSynced({ ...selected, enabled: false }, [selected])).toBe(false);
  });
});
