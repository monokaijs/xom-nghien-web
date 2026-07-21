interface PlayFabErrorBody {
  error?: string;
  errorMessage?: string;
}

interface PlayFabResponse<T> extends PlayFabErrorBody {
  data?: T;
}

interface LoginData {
  EntityToken?: {
    EntityToken?: string;
    TokenExpiration?: string;
  };
}

export interface ValheimLobby {
  CurrentPlayers: number;
  MaxPlayers: number;
  SearchData: Record<string, string>;
}

interface FindLobbiesData {
  Lobbies?: ValheimLobby[];
}

type FetchLike = typeof fetch;

const DEFAULT_TITLE_ID = '6E223';
const DEFAULT_CUSTOM_ID = 'xomnghien-heartbeat-v1';
const TOKEN_REFRESH_MARGIN_MS = 60_000;

function safeCount(value: unknown) {
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

function activeLobbyIsNewer(left: ValheimLobby, right: ValheimLobby) {
  const leftCreated = left.SearchData.string_key9 || '0';
  const rightCreated = right.SearchData.string_key9 || '0';
  try {
    return BigInt(leftCreated) > BigInt(rightCreated);
  } catch {
    return leftCreated > rightCreated;
  }
}

export class ValheimPlayFabClient {
  private token: { value: string; expiresAt: number } | null = null;
  private loginPromise: Promise<string> | null = null;

  constructor(
    private readonly titleId = process.env.VALHEIM_PLAYFAB_TITLE_ID || DEFAULT_TITLE_ID,
    private readonly customId = process.env.VALHEIM_PLAYFAB_CUSTOM_ID || DEFAULT_CUSTOM_ID,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  private async request<T>(path: string, body: unknown, entityToken?: string) {
    const response = await this.fetchImpl(`https://${this.titleId}.playfabapi.com${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PlayFabSDK': 'XomNghienHeartbeat/1.0',
        ...(entityToken ? { 'X-EntityToken': entityToken } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
    const text = await response.text();
    let payload: PlayFabResponse<T> = {};
    if (text) {
      try {
        payload = JSON.parse(text) as PlayFabResponse<T>;
      } catch {
        throw new Error(`PlayFab returned invalid JSON (${response.status})`);
      }
    }
    if (!response.ok) {
      throw new Error(payload.errorMessage || payload.error || `PlayFab request failed (${response.status})`);
    }
    if (!payload.data) throw new Error('PlayFab response did not contain data');
    return payload.data;
  }

  private async login() {
    const cached = this.token;
    if (cached && cached.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) return cached.value;
    if (this.loginPromise) return this.loginPromise;

    this.loginPromise = this.request<LoginData>('/Client/LoginWithCustomID', {
      TitleId: this.titleId,
      CustomId: this.customId,
      CreateAccount: true,
    }).then((data) => {
      const value = data.EntityToken?.EntityToken;
      if (!value) throw new Error('PlayFab login did not return an entity token');
      const parsedExpiration = Date.parse(data.EntityToken?.TokenExpiration || '');
      this.token = {
        value,
        expiresAt: Number.isFinite(parsedExpiration) ? parsedExpiration : Date.now() + 60 * 60_000,
      };
      return value;
    }).finally(() => {
      this.loginPromise = null;
    });

    return this.loginPromise;
  }

  async findActiveLobby(address: string) {
    const entityToken = await this.login();
    const escapedAddress = address.replaceAll("'", "''");
    const data = await this.request<FindLobbiesData>('/Lobby/FindLobbies', {
      Filter: `string_key10 eq '${escapedAddress}' and string_key2 eq 'True'`,
      Pagination: { PageSizeRequested: 10 },
    }, entityToken);
    const lobbies = data.Lobbies || [];
    if (!lobbies.length) return null;
    return lobbies.reduce((newest, lobby) => activeLobbyIsNewer(lobby, newest) ? lobby : newest);
  }

  static playerCounts(lobby: ValheimLobby) {
    const dedicatedOwner = lobby.SearchData.string_key7 === 'True' ? 1 : 0;
    return {
      online: Math.max(0, safeCount(lobby.CurrentPlayers) - dedicatedOwner),
      total: Math.max(0, safeCount(lobby.MaxPlayers) - dedicatedOwner),
    };
  }
}

export const valheimPlayFab = new ValheimPlayFabClient();
