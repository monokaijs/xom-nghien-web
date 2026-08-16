import { describe, expect, it } from 'vitest';
import { parseServerDeepLink } from './deep-link';

describe('parseServerDeepLink', () => {
  it('extracts a canonical server ID', () => {
    expect(parseServerDeepLink('xomnghien://servers/10')).toBe('10');
    expect(parseServerDeepLink('xomnghien://servers/10/')).toBe('10');
  });

  it('rejects links outside the server route', () => {
    expect(parseServerDeepLink('xomnghien://profiles/10')).toBeNull();
    expect(parseServerDeepLink('https://xomnghien.com/servers/10')).toBeNull();
  });

  it('rejects ambiguous or unsafe server IDs', () => {
    expect(parseServerDeepLink('xomnghien://servers/0')).toBeNull();
    expect(parseServerDeepLink('xomnghien://servers/01')).toBeNull();
    expect(parseServerDeepLink('xomnghien://servers/10?launch=false')).toBeNull();
    expect(parseServerDeepLink('xomnghien://servers/9007199254740992')).toBeNull();
  });
});
