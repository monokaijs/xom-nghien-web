"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataConnection, MediaConnection, Peer } from 'peerjs';
import {
  IconCopy,
  IconDeaf,
  IconEdit,
  IconHeadphones,
  IconLock,
  IconLockOpen,
  IconMessageCircle,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhone,
  IconPlus,
  IconRefresh,
  IconSend,
  IconSettings,
  IconShield,
  IconTrash,
  IconUsers,
  IconVolume,
  IconX,
} from '@tabler/icons-react';
import {
  p2pEnvelopeSchema,
  type P2PEnvelope,
  type VoiceMessage,
  type VoiceParticipant,
  type VoiceRoom,
  type VoiceRoomSnapshot,
  type VoiceSessionResponse,
} from '@xom/voice-contracts';

interface ApiErrorShape {
  error?: { code?: string; message?: string };
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const data = await response.json().catch(() => ({})) as T & ApiErrorShape;
  if (!response.ok) throw new Error(data.error?.message || 'Voice request failed');
  return data;
}

function useSpeaking(stream: MediaStream | null, enabled: boolean) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!stream || !enabled) {
      setSpeaking(false);
      return;
    }
    let frame = 0;
    let context: AudioContext | null = null;
    try {
      context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.frequencyBinCount);
      const inspect = () => {
        analyser.getByteFrequencyData(samples);
        const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
        setSpeaking(average > 16);
        frame = requestAnimationFrame(inspect);
      };
      inspect();
    } catch {
      setSpeaking(false);
    }
    return () => {
      cancelAnimationFrame(frame);
      void context?.close();
    };
  }, [stream, enabled]);
  return speaking;
}

function ParticipantRow({
  participant,
  stream,
  local,
  canManage,
  outputDeviceId,
  deafened,
  onModerate,
}: {
  participant: VoiceParticipant;
  stream: MediaStream | null;
  local: boolean;
  canManage: boolean;
  outputDeviceId: string;
  deafened: boolean;
  onModerate: (participant: VoiceParticipant, action: 'force-mute' | 'unmute' | 'kick') => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const speaking = useSpeaking(stream, !participant.muted && !participant.forceMuted);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !stream || local) return;
    audio.srcObject = stream;
    audio.muted = deafened;
    void audio.play().catch(() => undefined);
    if (outputDeviceId && 'setSinkId' in audio) {
      void (audio as HTMLAudioElement & { setSinkId(id: string): Promise<void> }).setSinkId(outputDeviceId).catch(() => undefined);
    }
  }, [stream, local, outputDeviceId, deafened]);

  return (
    <article className={`group relative rounded-lg px-2 py-1.5 transition-colors ${speaking ? 'bg-emerald-400/10' : 'hover:bg-white/5'}`}>
      {!local && <audio ref={audioRef} autoPlay playsInline />}
      <div className="flex items-center gap-2">
        <div className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 ${speaking ? 'border-emerald-400' : 'border-transparent'} bg-accent-primary/15`}>
          {participant.avatarUrl ? (
            <img src={participant.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-accent-primary">{participant.displayName.slice(0, 1).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium">{participant.displayName}{local ? ' (Bạn)' : ''}</p>
            {participant.owner && <IconShield size={12} className="shrink-0 text-amber-300" title="Chủ phòng" />}
          </div>
          <p className="truncate text-[10px] text-white/40">
            {participant.forceMuted ? 'Bị tắt mic bởi chủ phòng' : participant.deafened ? 'Đã tắt âm thanh' : participant.muted ? 'Đã tắt mic' : speaking ? 'Đang nói' : 'Đã kết nối'}
          </p>
        </div>
        {(participant.muted || participant.forceMuted) && <IconMicrophoneOff size={15} className="shrink-0 text-red-300" />}
      </div>
      {canManage && !local && (
        <div className="mt-1.5 flex gap-1 pl-10 opacity-70 transition-opacity group-hover:opacity-100">
          <button onClick={() => onModerate(participant, participant.forceMuted ? 'unmute' : 'force-mute')} className="rounded-md bg-white/7 px-2 py-1 text-[10px] hover:bg-white/12">
            {participant.forceMuted ? 'Cho phép mic' : 'Tắt mic'}
          </button>
          <button onClick={() => onModerate(participant, 'kick')} className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/20">
            Mời ra
          </button>
        </div>
      )}
    </article>
  );
}

export default function VoicePage() {
  const [session, setSession] = useState<VoiceSessionResponse | null>(null);
  const [guestName, setGuestName] = useState('');
  const [needsGuestName, setNeedsGuestName] = useState(false);
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [snapshot, setSnapshot] = useState<VoiceRoomSnapshot | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [message, setMessage] = useState('');
  const [privateCode, setPrivateCode] = useState('');
  const [lastAccessCode, setLastAccessCode] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createVisibility, setCreateVisibility] = useState<'public' | 'private'>('public');
  const [manageOpen, setManageOpen] = useState(false);
  const [manageName, setManageName] = useState('');
  const [manageVisibility, setManageVisibility] = useState<'public' | 'private'>('public');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [inputDeviceId, setInputDeviceId] = useState('');
  const [outputDeviceId, setOutputDeviceId] = useState('');
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'reconnecting'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'rooms' | 'chat'>('rooms');

  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const snapshotRef = useRef<VoiceRoomSnapshot | null>(null);
  const dataConnectionsRef = useRef(new Map<string, DataConnection>());
  const mediaConnectionsRef = useRef(new Map<string, MediaConnection>());
  const leavingRef = useRef(false);

  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);

  const initializeSession = useCallback(async (displayName?: string) => {
    try {
      setError(null);
      const result = await api<VoiceSessionResponse>('/api/voice/session', {
        method: 'POST',
        body: JSON.stringify(displayName ? { displayName } : {}),
      });
      setSession(result);
      setNeedsGuestName(false);
      return result;
    } catch (requestError) {
      const text = requestError instanceof Error ? requestError.message : 'Không thể bắt đầu voice';
      if (text.includes('2–32')) setNeedsGuestName(true);
      else setError(text);
      return null;
    }
  }, []);

  const loadRooms = useCallback(async () => {
    if (!session) return;
    try {
      const result = await api<{ rooms: VoiceRoom[] }>('/api/voice/rooms');
      setRooms(result.rooms);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải danh sách phòng');
    }
  }, [session]);

  useEffect(() => { void initializeSession(); }, [initializeSession]);
  useEffect(() => {
    if (!session) return;
    void loadRooms();
    const timer = window.setInterval(() => void loadRooms(), 10_000);
    return () => window.clearInterval(timer);
  }, [session, loadRooms]);

  const refreshDevices = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setInputDevices(devices.filter((device) => device.kind === 'audioinput'));
    setOutputDevices(devices.filter((device) => device.kind === 'audiooutput'));
  }, []);

  const sendEnvelope = useCallback((envelope: P2PEnvelope) => {
    for (const connection of dataConnectionsRef.current.values()) {
      if (connection.open) connection.send(envelope);
    }
  }, []);

  const applySnapshot = useCallback((next: VoiceRoomSnapshot) => {
    setSnapshot(next);
    snapshotRef.current = next;
    setRooms((current) => current.map((room) => room.id === next.room.id ? next.room : room));
    const self = next.participants.find((participant) => participant.subject === session?.identity.subject);
    if (self?.forceMuted) {
      setMuted(true);
      for (const track of localStreamRef.current?.getAudioTracks() || []) track.enabled = false;
    }
  }, [session?.identity.subject]);

  const refreshActiveRoom = useCallback(async () => {
    const active = snapshotRef.current;
    if (!active) return null;
    const result = await api<{ snapshot: VoiceRoomSnapshot }>(`/api/voice/rooms/${active.room.id}`);
    applySnapshot(result.snapshot);
    return result.snapshot;
  }, [applySnapshot]);

  const validatePeer = useCallback(async (peerId: string) => {
    const active = await refreshActiveRoom().catch(() => snapshotRef.current);
    return active?.participants.find((participant) => participant.peerId === peerId) || null;
  }, [refreshActiveRoom]);

  const receiveEnvelope = useCallback(async (raw: unknown, fromPeerId: string) => {
    const parsed = p2pEnvelopeSchema.safeParse(raw);
    if (!parsed.success) return;
    const envelope = parsed.data;
    const active = snapshotRef.current;
    const actor = active?.participants.find((participant) => participant.peerId === fromPeerId);
    if (!active || !actor) return;
    if (envelope.type === 'chat') {
      if (envelope.message.authorSubject !== actor.subject || envelope.message.roomId !== active.room.id) return;
      setMessages((current) => current.some((entry) => entry.id === envelope.message.id) ? current : [...current, envelope.message].slice(-200));
      return;
    }
    if (envelope.type === 'chat-delete') {
      if ((!actor.owner && !actor.admin) || envelope.actorPeerId !== fromPeerId) return;
      setMessages((current) => current.filter((entry) => entry.id !== envelope.messageId));
      return;
    }
    if (envelope.type === 'participant-state') {
      if (envelope.participant.peerId !== fromPeerId) return;
      setSnapshot((current) => current ? {
        ...current,
        participants: current.participants.map((item) => item.peerId === fromPeerId ? envelope.participant : item),
      } : current);
      return;
    }
    if (envelope.type === 'moderation') {
      if ((!actor.owner && !actor.admin) || envelope.actorPeerId !== fromPeerId) return;
      const self = active.participants.find((participant) => participant.subject === session?.identity.subject);
      if (self?.id !== envelope.targetParticipantId) return;
      if (envelope.action === 'kick') {
        setError('Bạn đã được mời ra khỏi phòng');
        await leaveRoom(false);
      } else {
        const forceMuted = envelope.action === 'force-mute';
        setMuted(forceMuted || muted);
        for (const track of localStreamRef.current?.getAudioTracks() || []) track.enabled = !forceMuted && !muted;
      }
      return;
    }
    if (envelope.type === 'room-closed' && (actor.owner || actor.admin) && envelope.actorPeerId === fromPeerId) {
      setError('Phòng đã được đóng');
      await leaveRoom(false);
    }
  // leaveRoom is stable through refs at runtime; including it here would create a circular callback dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted, session?.identity.subject]);

  const registerDataConnection = useCallback((connection: DataConnection) => {
    const existing = dataConnectionsRef.current.get(connection.peer);
    if (existing && existing !== connection) existing.close();
    dataConnectionsRef.current.set(connection.peer, connection);
    connection.on('data', (data) => void receiveEnvelope(data, connection.peer));
    connection.on('close', () => {
      if (dataConnectionsRef.current.get(connection.peer) === connection) dataConnectionsRef.current.delete(connection.peer);
    });
    connection.on('error', () => undefined);
  }, [receiveEnvelope]);

  const attachMediaConnection = useCallback((connection: MediaConnection) => {
    const existing = mediaConnectionsRef.current.get(connection.peer);
    if (existing && existing !== connection) existing.close();
    mediaConnectionsRef.current.set(connection.peer, connection);
    connection.on('stream', (stream) => setRemoteStreams((current) => ({ ...current, [connection.peer]: stream })));
    connection.on('close', () => {
      mediaConnectionsRef.current.delete(connection.peer);
      setRemoteStreams((current) => {
        const next = { ...current };
        delete next[connection.peer];
        return next;
      });
    });
    connection.on('error', () => undefined);
  }, []);

  const connectToParticipant = useCallback((participant: VoiceParticipant) => {
    const peer = peerRef.current;
    const stream = localStreamRef.current;
    if (!peer || !stream || participant.peerId === peer.id) return;
    if (!dataConnectionsRef.current.has(participant.peerId)) {
      const data = peer.connect(participant.peerId, { reliable: true, metadata: { roomId: snapshotRef.current?.room.id } });
      registerDataConnection(data);
    }
    if (!mediaConnectionsRef.current.has(participant.peerId)) {
      const call = peer.call(participant.peerId, stream, { metadata: { roomId: snapshotRef.current?.room.id } });
      if (call) attachMediaConnection(call);
    }
  }, [attachMediaConnection, registerDataConnection]);

  const leaveRoom = useCallback(async (notifyServer = true) => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    const roomId = snapshotRef.current?.room.id;
    if (notifyServer && roomId) {
      await fetch(`/api/voice/rooms/${roomId}/presence`, { method: 'DELETE', keepalive: true }).catch(() => undefined);
    }
    for (const connection of dataConnectionsRef.current.values()) connection.close();
    for (const connection of mediaConnectionsRef.current.values()) connection.close();
    dataConnectionsRef.current.clear();
    mediaConnectionsRef.current.clear();
    peerRef.current?.destroy();
    peerRef.current = null;
    for (const track of localStreamRef.current?.getTracks() || []) track.stop();
    localStreamRef.current = null;
    snapshotRef.current = null;
    setSnapshot(null);
    setMessages([]);
    setRemoteStreams({});
    setStatus('idle');
    setMuted(false);
    setDeafened(false);
    setMobilePanel('rooms');
    leavingRef.current = false;
    void loadRooms();
  }, [loadRooms]);

  const joinRoom = useCallback(async ({ roomId, accessCode }: { roomId?: string; accessCode?: string }) => {
    if (!session || status === 'connecting') return;
    try {
      setStatus('connecting');
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: inputDeviceId ? { deviceId: { exact: inputDeviceId }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      localStreamRef.current = stream;
      await refreshDevices();
      const { Peer: PeerConstructor } = await import('peerjs');
      const peer = new PeerConstructor({ config: { iceServers: session.iceServers } });
      peerRef.current = peer;

      peer.on('connection', async (connection) => {
        if (await validatePeer(connection.peer)) registerDataConnection(connection);
        else connection.close();
      });
      peer.on('call', async (call) => {
        if (await validatePeer(call.peer)) {
          call.answer(localStreamRef.current || undefined);
          attachMediaConnection(call);
        } else call.close();
      });
      peer.on('disconnected', () => setStatus('reconnecting'));
      peer.on('error', (peerError) => setError(`PeerJS: ${peerError.message}`));
      const peerId = await new Promise<string>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('PeerJS Cloud không phản hồi')), 12_000);
        peer.once('open', (id) => { window.clearTimeout(timeout); resolve(id); });
        peer.once('error', (peerError) => { window.clearTimeout(timeout); reject(peerError); });
      });
      const result = await api<{ snapshot: VoiceRoomSnapshot }>('/api/voice/rooms/join', {
        method: 'POST',
        body: JSON.stringify({ roomId, accessCode, peerId }),
      });
      applySnapshot(result.snapshot);
      for (const participant of result.snapshot.participants) connectToParticipant(participant);
      setStatus('connected');
      setMobilePanel('rooms');
    } catch (joinError) {
      await leaveRoom(false);
      setError(joinError instanceof Error ? joinError.message : 'Không thể vào phòng');
    }
  }, [applySnapshot, attachMediaConnection, connectToParticipant, inputDeviceId, leaveRoom, refreshDevices, registerDataConnection, session, status, validatePeer]);

  useEffect(() => {
    if (!snapshot || status === 'idle') return;
    const heartbeat = async () => {
      try {
        const result = await api<{ snapshot: VoiceRoomSnapshot }>(`/api/voice/rooms/${snapshot.room.id}/presence`, {
          method: 'PUT',
          body: JSON.stringify({ muted, deafened }),
        });
        applySnapshot(result.snapshot);
        const self = result.snapshot.participants.find((participant) => participant.subject === session?.identity.subject);
        for (const participant of result.snapshot.participants) {
          if (self && participant.joinedAt < self.joinedAt) connectToParticipant(participant);
        }
        if (status === 'reconnecting') setStatus('connected');
      } catch (heartbeatError) {
        setError(heartbeatError instanceof Error ? heartbeatError.message : 'Mất kết nối phòng');
        await leaveRoom(false);
      }
    };
    const timer = window.setInterval(() => void heartbeat(), 10_000);
    return () => window.clearInterval(timer);
  }, [applySnapshot, connectToParticipant, deafened, leaveRoom, muted, session?.identity.subject, snapshot?.room.id, status]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      const roomId = snapshotRef.current?.room.id;
      if (roomId) {
        event.preventDefault();
        event.returnValue = '';
        void fetch(`/api/voice/rooms/${roomId}/presence`, { method: 'DELETE', keepalive: true });
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      void leaveRoom();
    };
  }, [leaveRoom]);

  const toggleMute = () => {
    const self = snapshot?.participants.find((participant) => participant.subject === session?.identity.subject);
    if (self?.forceMuted) return;
    const next = !muted;
    setMuted(next);
    for (const track of localStreamRef.current?.getAudioTracks() || []) track.enabled = !next && !deafened;
    if (self) sendEnvelope({ type: 'participant-state', participant: { ...self, muted: next || deafened, deafened } });
  };

  const toggleDeafen = () => {
    const next = !deafened;
    setDeafened(next);
    if (next) setMuted(true);
    for (const track of localStreamRef.current?.getAudioTracks() || []) track.enabled = !next && !muted;
    const self = snapshot?.participants.find((participant) => participant.subject === session?.identity.subject);
    if (self) sendEnvelope({ type: 'participant-state', participant: { ...self, muted: next || muted, deafened: next } });
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const body = message.trim();
    if (!snapshot || !session || !body) return;
    const item: VoiceMessage = {
      id: crypto.randomUUID(),
      roomId: snapshot.room.id,
      authorSubject: session.identity.subject,
      authorName: session.identity.displayName,
      authorAvatarUrl: session.identity.avatarUrl,
      body: body.slice(0, 1000),
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, item].slice(-200));
    sendEnvelope({ type: 'chat', message: item });
    setMessage('');
  };

  const createRoom = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await api<{ snapshot: VoiceRoomSnapshot; accessCode?: string }>('/api/voice/rooms', {
        method: 'POST',
        body: JSON.stringify({ name: createName, visibility: createVisibility }),
      });
      setCreateOpen(false);
      setCreateName('');
      setLastAccessCode(result.accessCode || null);
      await loadRooms();
      await joinRoom({ roomId: result.snapshot.room.id, accessCode: result.accessCode });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Không thể tạo phòng');
    }
  };

  const moderate = async (participant: VoiceParticipant, action: 'force-mute' | 'unmute' | 'kick') => {
    if (!snapshot || !peerRef.current) return;
    try {
      const result = await api<{ snapshot: VoiceRoomSnapshot }>(`/api/voice/rooms/${snapshot.room.id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ participantId: participant.id, action }),
      });
      applySnapshot(result.snapshot);
      sendEnvelope({ type: 'moderation', action, targetParticipantId: participant.id, actorPeerId: peerRef.current.id });
      if (action === 'kick') {
        dataConnectionsRef.current.get(participant.peerId)?.close();
        mediaConnectionsRef.current.get(participant.peerId)?.close();
      }
    } catch (moderationError) {
      setError(moderationError instanceof Error ? moderationError.message : 'Không thể quản lý người dùng');
    }
  };

  const deleteRoom = async () => {
    if (!snapshot || !peerRef.current || !window.confirm(`Xóa phòng “${snapshot.room.name}”?`)) return;
    try {
      sendEnvelope({ type: 'room-closed', roomId: snapshot.room.id, actorPeerId: peerRef.current.id });
      await api(`/api/voice/rooms/${snapshot.room.id}`, { method: 'DELETE' });
      await leaveRoom(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Không thể xóa phòng');
    }
  };

  const rotateCode = async () => {
    if (!snapshot) return;
    try {
      const result = await api<{ accessCode: string }>(`/api/voice/rooms/${snapshot.room.id}/code`, { method: 'POST' });
      setLastAccessCode(result.accessCode);
    } catch (rotateError) {
      setError(rotateError instanceof Error ? rotateError.message : 'Không thể đổi mã phòng');
    }
  };

  const saveRoomSettings = async (event: FormEvent) => {
    event.preventDefault();
    if (!snapshot) return;
    try {
      const result = await api<{ snapshot: VoiceRoomSnapshot; accessCode?: string }>(`/api/voice/rooms/${snapshot.room.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: manageName, visibility: manageVisibility }),
      });
      applySnapshot(result.snapshot);
      if (result.accessCode) setLastAccessCode(result.accessCode);
      setManageOpen(false);
      void loadRooms();
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : 'Không thể cập nhật phòng');
    }
  };

  const deleteChatMessage = (messageId: string) => {
    if (!peerRef.current || !canManage) return;
    setMessages((current) => current.filter((entry) => entry.id !== messageId));
    sendEnvelope({ type: 'chat-delete', messageId, actorPeerId: peerRef.current.id });
  };

  const changeInput = async (deviceId: string) => {
    setInputDeviceId(deviceId);
    if (!localStreamRef.current) return;
    const next = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true } });
    const track = next.getAudioTracks()[0];
    track.enabled = !muted && !deafened;
    for (const call of mediaConnectionsRef.current.values()) {
      const sender = call.peerConnection?.getSenders().find((item) => item.track?.kind === 'audio');
      await sender?.replaceTrack(track);
    }
    for (const oldTrack of localStreamRef.current.getTracks()) oldTrack.stop();
    localStreamRef.current = next;
  };

  const selfParticipant = snapshot?.participants.find((participant) => participant.subject === session?.identity.subject);
  const canManage = snapshot?.capabilities.canManageRoom || false;
  const orderedParticipants = useMemo(() => snapshot?.participants || [], [snapshot?.participants]);

  if (needsGuestName) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <form onSubmit={(event) => { event.preventDefault(); void initializeSession(guestName); }} className="w-full max-w-md rounded-3xl border border-white/10 bg-bg-sidebar/70 p-7 shadow-xl">
          <IconHeadphones size={38} className="mb-4 text-accent-primary" />
          <h1 className="text-2xl font-bold">Tham gia Voice</h1>
          <p className="mt-2 text-sm text-white/50">Chọn tên hiển thị. Tên này được lưu trên trình duyệt của bạn.</p>
          <input value={guestName} onChange={(event) => setGuestName(event.target.value)} minLength={2} maxLength={32} autoFocus placeholder="Tên của bạn" className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent-primary" />
          <button className="mt-4 w-full rounded-xl bg-accent-primary px-4 py-3 font-semibold hover:bg-accent-primary/80">Tiếp tục</button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {error && <div className="flex items-center justify-between rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"><span>{error}</span><button onClick={() => setError(null)}><IconX size={17} /></button></div>}
      {lastAccessCode && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm"><span>Mã phòng riêng: <strong className="ml-2 tracking-[0.25em] text-amber-200">{lastAccessCode}</strong> — mã chỉ hiển thị lần này.</span><button onClick={() => void navigator.clipboard.writeText(lastAccessCode)} className="flex items-center gap-1.5 text-amber-200"><IconCopy size={16} /> Sao chép</button></div>}

      <div className="grid min-h-[560px] flex-1 grid-cols-[280px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-white/8 bg-bg-sidebar/40 max-lg:grid-cols-1">
        <aside className={`${mobilePanel === 'rooms' ? 'flex' : 'hidden'} min-h-0 flex-col border-r border-white/8 bg-bg-sidebar/70 lg:flex`}>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
            <div className="flex items-center justify-between px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-white/40"><span>Kênh thoại</span><span>{rooms.length}</span></div>
            {rooms.length === 0 ? <div className="px-2 py-5 text-center text-xs text-white/35">Chưa có phòng.</div> : rooms.map((room) => (
              <button key={room.id} disabled={room.full || status === 'connecting'} onClick={() => void joinRoom({ roomId: room.id })} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${snapshot?.room.id === room.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white/85'} disabled:opacity-40`}>
                <IconVolume size={16} className="shrink-0 text-white/45" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{room.name}</span>
                {room.persistent && <IconShield size={12} className="shrink-0 text-amber-300" />}
                <span className="shrink-0 text-[10px] text-white/35">{room.participantCount}/{room.maxParticipants}</span>
              </button>
            ))}

            {snapshot && (
              <section className="mt-3 border-t border-white/8 pt-2">
                <div className="flex items-center justify-between gap-2 px-2 pb-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5"><h2 className="truncate text-xs font-semibold text-white/70">{snapshot.room.name}</h2>{snapshot.room.visibility === 'private' ? <IconLock size={12} className="shrink-0 text-amber-300" /> : <IconLockOpen size={12} className="shrink-0 text-emerald-300" />}</div>
                    <p className="text-[10px] text-white/35">{status === 'reconnecting' ? 'Đang kết nối lại…' : `${snapshot.room.participantCount} người kết nối`}</p>
                  </div>
                  {canManage && <div className="flex shrink-0"><button onClick={() => { setManageName(snapshot.room.name); setManageVisibility(snapshot.room.visibility); setManageOpen(true); }} className="rounded p-1 text-white/45 hover:bg-white/8 hover:text-white" title="Sửa phòng"><IconEdit size={13} /></button>{snapshot.room.visibility === 'private' && <button onClick={() => void rotateCode()} className="rounded p-1 text-white/45 hover:bg-white/8 hover:text-white" title="Đổi mã"><IconRefresh size={13} /></button>}<button onClick={() => void deleteRoom()} className="rounded p-1 text-red-300/70 hover:bg-red-500/10 hover:text-red-300" title="Xóa phòng"><IconTrash size={13} /></button></div>}
                </div>
                <div className="space-y-0.5">
                  {orderedParticipants.map((participant) => <ParticipantRow key={participant.id} participant={participant} stream={participant.subject === session?.identity.subject ? localStreamRef.current : remoteStreams[participant.peerId] || null} local={participant.subject === session?.identity.subject} canManage={canManage} outputDeviceId={outputDeviceId} deafened={deafened} onModerate={(target, action) => void moderate(target, action)} />)}
                </div>
              </section>
            )}
          </div>

          {snapshot && <div className="flex items-center justify-between border-t border-white/8 bg-black/10 px-2 py-1.5"><div className="flex items-center gap-1"><button onClick={toggleMute} disabled={selfParticipant?.forceMuted} className={`rounded-md p-2 ${muted ? 'bg-red-500 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white'} disabled:opacity-40`} title={muted ? 'Bật mic' : 'Tắt mic'}>{muted ? <IconMicrophoneOff size={17} /> : <IconMicrophone size={17} />}</button><button onClick={toggleDeafen} className={`rounded-md p-2 ${deafened ? 'bg-red-500 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white'}`} title="Tắt/bật âm thanh">{deafened ? <IconDeaf size={17} /> : <IconVolume size={17} />}</button><button onClick={() => setSettingsOpen(true)} className="rounded-md p-2 text-white/60 hover:bg-white/8 hover:text-white" title="Thiết bị"><IconSettings size={17} /></button></div><button onClick={() => void leaveRoom()} className="rounded-md bg-red-500/15 p-2 text-red-300 hover:bg-red-500 hover:text-white" title="Rời phòng"><IconPhone size={17} className="rotate-[135deg]" /></button></div>}

          <div className="border-t border-white/8 p-2">
            <form onSubmit={(event) => { event.preventDefault(); if (privateCode.trim()) void joinRoom({ accessCode: privateCode.trim() }); }} className="flex gap-1.5">
              <input value={privateCode} onChange={(event) => setPrivateCode(event.target.value.toUpperCase().slice(0, 8))} placeholder="Mã phòng riêng" className="min-w-0 flex-1 rounded-lg border border-white/8 bg-white/5 px-2.5 py-2 text-xs uppercase tracking-wider outline-none focus:border-accent-primary" />
              <button disabled={privateCode.length !== 8 || status === 'connecting'} className="rounded-lg bg-white/8 px-3 text-xs font-medium hover:bg-white/12 disabled:opacity-40">Vào</button>
            </form>
            <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-1.5">
              <button onClick={() => setCreateOpen(true)} disabled={!session} className="flex items-center justify-center gap-1.5 rounded-lg bg-accent-primary px-3 py-2 text-xs font-semibold hover:bg-accent-primary/80 disabled:opacity-50"><IconPlus size={15} /> Tạo phòng</button>
              <button onClick={() => void loadRooms()} className="rounded-lg bg-white/8 p-2 text-white/60 hover:bg-white/12 hover:text-white" title="Làm mới"><IconRefresh size={16} /></button>
            </div>
          </div>
        </aside>

        <main className={`${mobilePanel === 'chat' ? 'flex' : 'hidden'} min-h-0 flex-col bg-white/[0.02] lg:flex`}>
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/8 px-4"><IconMessageCircle size={17} className="text-white/45" /><h2 className="truncate text-sm font-semibold">{snapshot ? snapshot.room.name : 'Chat trực tiếp'}</h2></div>
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
            {!snapshot ? <div className="m-auto text-center text-sm text-white/35"><IconHeadphones size={40} className="mx-auto mb-3 opacity-30" /><p>Chọn một kênh thoại để bắt đầu.</p></div> : messages.length === 0 ? <div className="m-auto max-w-sm text-center text-sm text-white/35">Tin nhắn chỉ tồn tại trong phiên hiện tại và không được lưu trên máy chủ.</div> : messages.map((item) => <div key={item.id} className="group rounded-lg px-2 py-2 hover:bg-white/[0.03]"><div className="flex items-center gap-2"><strong className="truncate text-sm text-accent-primary">{item.authorName}</strong><time className="text-[10px] text-white/30">{new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time>{canManage && <button onClick={() => deleteChatMessage(item.id)} className="ml-auto text-white/0 transition-colors group-hover:text-red-300" title="Xóa tin nhắn"><IconTrash size={13} /></button>}</div><p className="mt-0.5 break-words text-sm text-white/80">{item.body}</p></div>)}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 p-3 pt-1"><input value={message} onChange={(event) => setMessage(event.target.value.slice(0, 1000))} disabled={!snapshot} placeholder="Nhắn cho mọi người…" className="min-w-0 flex-1 rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-accent-primary disabled:opacity-40" /><button disabled={!snapshot || !message.trim()} className="rounded-lg bg-accent-primary p-2.5 disabled:opacity-40"><IconSend size={18} /></button></form>
        </main>
      </div>

      <nav className="grid grid-cols-2 gap-2 rounded-xl border border-white/8 bg-bg-sidebar p-1.5 lg:hidden"><button onClick={() => setMobilePanel('rooms')} className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm ${mobilePanel === 'rooms' ? 'bg-accent-primary' : 'text-white/55'}`}><IconUsers size={17} /> Kênh thoại</button><button onClick={() => setMobilePanel('chat')} className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm ${mobilePanel === 'chat' ? 'bg-accent-primary' : 'text-white/55'}`}><IconMessageCircle size={17} /> Chat</button></nav>

      {createOpen && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}><form onSubmit={createRoom} className="w-full max-w-md rounded-3xl border border-white/10 bg-bg-sidebar p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Tạo Voice Room</h2><button type="button" onClick={() => setCreateOpen(false)}><IconX /></button></div><label className="mt-6 block text-sm text-white/60">Tên phòng</label><input value={createName} onChange={(event) => setCreateName(event.target.value)} minLength={3} maxLength={80} autoFocus className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent-primary" placeholder="Ví dụ: Tám chuyện tối nay" /><div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={() => setCreateVisibility('public')} className={`rounded-xl border p-4 text-left ${createVisibility === 'public' ? 'border-accent-primary bg-accent-primary/10' : 'border-white/10'}`}><IconLockOpen className="mb-2" /><strong className="block">Công khai</strong><span className="text-xs text-white/40">Hiện trong danh sách</span></button><button type="button" onClick={() => setCreateVisibility('private')} className={`rounded-xl border p-4 text-left ${createVisibility === 'private' ? 'border-accent-primary bg-accent-primary/10' : 'border-white/10'}`}><IconLock className="mb-2" /><strong className="block">Riêng tư</strong><span className="text-xs text-white/40">Vào bằng mã 8 ký tự</span></button></div><button className="mt-6 w-full rounded-xl bg-accent-primary px-4 py-3 font-semibold">Tạo và tham gia</button></form></div>}

      {manageOpen && snapshot && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setManageOpen(false); }}><form onSubmit={saveRoomSettings} className="w-full max-w-md rounded-3xl border border-white/10 bg-bg-sidebar p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Cài đặt phòng</h2><button type="button" onClick={() => setManageOpen(false)}><IconX /></button></div><label className="mt-6 block text-sm text-white/60">Tên phòng</label><input value={manageName} onChange={(event) => setManageName(event.target.value)} minLength={3} maxLength={80} autoFocus className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent-primary" /><label className="mt-5 block text-sm text-white/60">Quyền truy cập</label><div className="mt-2 grid grid-cols-2 gap-3"><button type="button" onClick={() => setManageVisibility('public')} className={`rounded-xl border p-3 ${manageVisibility === 'public' ? 'border-accent-primary bg-accent-primary/10' : 'border-white/10'}`}>Công khai</button><button type="button" onClick={() => setManageVisibility('private')} className={`rounded-xl border p-3 ${manageVisibility === 'private' ? 'border-accent-primary bg-accent-primary/10' : 'border-white/10'}`}>Riêng tư</button></div><button className="mt-6 w-full rounded-xl bg-accent-primary px-4 py-3 font-semibold">Lưu thay đổi</button></form></div>}

      {settingsOpen && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}><div className="w-full max-w-md rounded-3xl border border-white/10 bg-bg-sidebar p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Thiết bị âm thanh</h2><button onClick={() => setSettingsOpen(false)}><IconX /></button></div><label className="mt-6 block text-sm text-white/60">Microphone</label><select value={inputDeviceId} onChange={(event) => void changeInput(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-bg-dark px-4 py-3">{inputDevices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${device.deviceId.slice(0, 5)}`}</option>)}</select><label className="mt-5 block text-sm text-white/60">Loa / tai nghe</label><select value={outputDeviceId} onChange={(event) => setOutputDeviceId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-bg-dark px-4 py-3"><option value="">Mặc định hệ thống</option>{outputDevices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Thiết bị ${device.deviceId.slice(0, 5)}`}</option>)}</select><p className="mt-4 text-xs text-white/35">Một số trình duyệt không hỗ trợ chọn thiết bị đầu ra.</p></div></div>}
    </div>
  );
}
