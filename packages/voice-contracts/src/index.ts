import { z } from 'zod';

export const VOICE_ROOM_CAPACITY = 8;
export const voiceErrorCodeSchema = z.enum([
  'INVALID_CODE',
  'FORBIDDEN',
  'ROOM_FULL',
  'ROOM_NOT_FOUND',
  'ROOM_EXPIRED',
  'RATE_LIMITED',
  'INVALID_INPUT',
  'MICROPHONE_DENIED',
  'SIGNALING_FAILED',
  'RECONNECT_FAILED',
  'SERVICE_UNAVAILABLE',
]);

export const voiceIdentitySchema = z.object({
  subject: z.string().min(1).max(160),
  kind: z.enum(['user', 'guest']),
  displayName: z.string().trim().min(2).max(32),
  avatarUrl: z.string().url().nullable(),
  role: z.enum(['admin', 'moderator', 'user', 'guest']),
});

export const voiceRoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(3).max(80),
  visibility: z.enum(['public', 'private']),
  persistent: z.boolean(),
  ownerSubject: z.string().min(1).max(160),
  ownerName: z.string().min(1).max(32),
  participantCount: z.number().int().min(0).max(VOICE_ROOM_CAPACITY),
  maxParticipants: z.number().int().min(2).max(VOICE_ROOM_CAPACITY),
  full: z.boolean(),
  createdAt: z.string().datetime(),
});

export const voiceParticipantSchema = z.object({
  id: z.string().uuid(),
  subject: z.string().min(1).max(160),
  displayName: z.string().min(1).max(32),
  avatarUrl: z.string().url().nullable(),
  peerId: z.string().min(1).max(128),
  muted: z.boolean(),
  deafened: z.boolean(),
  forceMuted: z.boolean(),
  owner: z.boolean(),
  admin: z.boolean(),
  joinedAt: z.string().datetime(),
});

export const voiceMessageSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  authorSubject: z.string().min(1).max(160),
  authorName: z.string().min(1).max(32),
  authorAvatarUrl: z.string().url().nullable(),
  body: z.string().min(1).max(1000),
  createdAt: z.string().datetime(),
});

export const voiceErrorSchema = z.object({
  code: voiceErrorCodeSchema,
  message: z.string(),
  retryAfterMs: z.number().int().positive().optional(),
});

export const createRoomSchema = z.object({
  name: z.string().trim().min(3).max(80),
  visibility: z.enum(['public', 'private']),
  persistent: z.boolean().optional().default(false),
});

export const joinRoomSchema = z.object({
  roomId: z.string().uuid().optional(),
  accessCode: z.string().trim().length(8).optional(),
  peerId: z.string().min(1).max(128),
}).refine((value) => value.roomId || value.accessCode, {
  message: 'A room ID or access code is required',
});

export const updateRoomSchema = z.object({
  roomId: z.string().uuid(),
  name: z.string().trim().min(3).max(80).optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

export const participantStateSchema = z.object({
  muted: z.boolean(),
  deafened: z.boolean(),
});

export const participantActionSchema = z.object({
  roomId: z.string().uuid(),
  participantId: z.string().uuid(),
  forceMuted: z.boolean().optional(),
});

export const roomTargetSchema = z.object({ roomId: z.string().uuid() });
export const chatSendSchema = z.object({
  roomId: z.string().uuid(),
  body: z.string().trim().min(1).max(1000),
});
export const chatDeleteSchema = z.object({
  roomId: z.string().uuid(),
  messageId: z.number().int().positive(),
});

export type VoiceErrorCode = z.infer<typeof voiceErrorCodeSchema>;
export type VoiceIdentity = z.infer<typeof voiceIdentitySchema>;
export type VoiceRoom = z.infer<typeof voiceRoomSchema>;
export type VoiceParticipant = z.infer<typeof voiceParticipantSchema>;
export type VoiceMessage = z.infer<typeof voiceMessageSchema>;
export type VoiceError = z.infer<typeof voiceErrorSchema>;
export type CreateRoomInput = z.input<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

export interface VoiceCapabilities {
  owner: boolean;
  admin: boolean;
  canManageRoom: boolean;
}

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface VoiceRoomSnapshot {
  room: VoiceRoom;
  participants: VoiceParticipant[];
  capabilities: VoiceCapabilities;
  iceServers: IceServerConfig[];
  accessCode?: string;
}

export const p2pEnvelopeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('chat'), message: voiceMessageSchema }),
  z.object({
    type: z.literal('chat-delete'),
    messageId: z.string().uuid(),
    actorPeerId: z.string().min(1).max(128),
  }),
  z.object({ type: z.literal('participant-state'), participant: voiceParticipantSchema }),
  z.object({
    type: z.literal('moderation'),
    action: z.enum(['force-mute', 'unmute', 'kick']),
    targetParticipantId: z.string().uuid(),
    actorPeerId: z.string().min(1).max(128),
  }),
  z.object({
    type: z.literal('room-closed'),
    roomId: z.string().uuid(),
    actorPeerId: z.string().min(1).max(128),
  }),
]);

export type P2PEnvelope = z.infer<typeof p2pEnvelopeSchema>;

export interface VoiceSessionResponse {
  identity: VoiceIdentity;
  iceServers: IceServerConfig[];
  peer: { provider: 'peerjs-cloud' };
}
