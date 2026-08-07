import type { Page, ProfileSummary, RequestedPackage } from './types';

export const launcherPages: Page[] = ['servers', 'profiles', 'settings'];

export function personalProfiles(profiles: ProfileSummary[]) {
  return profiles.filter((profile) => profile.kind === 'personal');
}

export function coordinateIdentity(coordinate: string) {
  return coordinate.replace(/-\d+\.\d+\.\d+$/, '').toLocaleLowerCase();
}

export function requestIsSynced(request: RequestedPackage, synced: RequestedPackage[]) {
  return synced.some((item) => item.origin !== 'runtime'
    && item.coordinate.toLocaleLowerCase() === request.coordinate.toLocaleLowerCase()
    && item.enabled === request.enabled);
}
