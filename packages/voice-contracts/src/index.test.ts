import { describe, expect, it } from 'vitest';
import { createRoomSchema, joinRoomSchema, p2pEnvelopeSchema, voiceMessageSchema } from './index';

describe('voice contracts', () => {
  it('enforces room names and the eight-person design', () => {
    expect(createRoomSchema.safeParse({ name: 'GG', visibility: 'public' }).success).toBe(false);
    expect(createRoomSchema.parse({ name: 'Tám chuyện', visibility: 'private' }).persistent).toBe(false);
  });

  it('requires either a room id or private code when joining', () => {
    expect(joinRoomSchema.safeParse({ peerId: 'peer-a' }).success).toBe(false);
    expect(joinRoomSchema.safeParse({ peerId: 'peer-a', accessCode: 'ABCD2345' }).success).toBe(true);
  });

  it('accepts live P2P chat envelopes without server history fields', () => {
    const message = voiceMessageSchema.parse({
      id: 'ec7f33aa-6181-46a0-a789-f3e341bf23f0',
      roomId: '7928d182-80ac-4f0b-b84e-519f25b09ec8',
      authorSubject: 'guest:123',
      authorName: 'Guest',
      authorAvatarUrl: null,
      body: 'Xin chào',
      createdAt: new Date().toISOString(),
    });
    expect(p2pEnvelopeSchema.parse({ type: 'chat', message })).toEqual({ type: 'chat', message });
  });
});
