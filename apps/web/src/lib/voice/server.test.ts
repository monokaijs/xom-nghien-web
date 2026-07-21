import { afterEach, describe, expect, it } from 'vitest';
import { createIceServers, generateAccessCode, hashAccessCode } from './server';

const originalTurnUrls = process.env.TURN_URLS;
const originalTurnSecret = process.env.TURN_SHARED_SECRET;

afterEach(() => {
  if (originalTurnUrls === undefined) delete process.env.TURN_URLS;
  else process.env.TURN_URLS = originalTurnUrls;
  if (originalTurnSecret === undefined) delete process.env.TURN_SHARED_SECRET;
  else process.env.TURN_SHARED_SECRET = originalTurnSecret;
});

describe('voice coordination security', () => {
  it('creates shareable codes and hashes them case-insensitively', () => {
    const code = generateAccessCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(hashAccessCode(code.toLowerCase())).toBe(hashAccessCode(code));
  });

  it('only emits TURN credentials when a server and shared secret are configured', () => {
    const identity = {
      subject: 'guest:test',
      kind: 'guest' as const,
      displayName: 'Guest',
      avatarUrl: null,
      role: 'guest' as const,
    };
    process.env.TURN_URLS = '';
    process.env.TURN_SHARED_SECRET = '';
    expect(createIceServers(identity)).toHaveLength(1);

    process.env.TURN_URLS = 'turn:voice.example.com:3478';
    process.env.TURN_SHARED_SECRET = 'test-secret';
    const servers = createIceServers(identity);
    expect(servers[1]).toMatchObject({ urls: ['turn:voice.example.com:3478'] });
    expect(servers[1].username).toContain(':guest:test');
    expect(servers[1].credential).toBeTruthy();
  });
});
