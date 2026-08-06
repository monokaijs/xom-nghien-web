import { describe, expect, it } from 'vitest';
import { translator } from './i18n';

describe('launcher translations', () => {
  it('provides the core navigation in both locales', () => {
    expect(translator('en')('servers')).toBe('Servers');
    expect(translator('vi')('servers')).toBe('Máy chủ');
    expect(translator('en')('play')).toBeTruthy();
    expect(translator('vi')('play')).toBeTruthy();
  });
});
