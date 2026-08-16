import { describe, expect, it } from 'vitest';
import { translator } from './i18n';

describe('launcher translations', () => {
  it('provides the core navigation and profile actions in both locales', () => {
    expect(translator('en')('servers')).toBe('Servers');
    expect(translator('vi')('servers')).toBe('Máy chủ');
    expect(translator('en')('syncAndPlay')).toBeTruthy();
    expect(translator('vi')('syncAndPlay')).toBeTruthy();
    expect(translator('en')('importProfile')).toBeTruthy();
    expect(translator('vi')('importProfile')).toBeTruthy();
  });
});
