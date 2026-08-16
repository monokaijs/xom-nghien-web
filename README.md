By @monokaijs

## Local development

Requirements: Node.js 22.13+, pnpm 11.0.9+, and Docker with Compose.

```bash
cp .env.example .env
pnpm dev:services
pnpm dev
```

The web app runs at <http://localhost:3000>. MySQL data is kept in a named Docker
volume. Add a Steam Web API key to `.env` when testing Steam sign-in or Steam API
features.

To stop the local infrastructure:

```bash
pnpm dev:services:down
```

## Valheim managed mods

Apply `packages/db/migrations/025_add_server_managed_configs.sql` and
`packages/db/migrations/026_link_managed_configs_to_mods.sql` to an existing
database before enabling managed mod configs. Migration 026 preserves older
unassigned config rows; an admin must assign each one to a selected mod in the
server editor before saving.

Admins manage config files from each mod's **Configure** action. Import the
`.cfg` produced after launching the mod once for a structured BepInEx editor, or
use the raw editor for other supported text formats. The server/client target is
deployment scope, not access control, so managed config files must never contain
passwords, tokens, or other secrets.

## Server heartbeats

`server-heartbeats` probes game servers outside the web request path. It replaces
its in-memory status snapshot every 15 seconds and keeps serving the previous
snapshot immediately while a slow or failed refresh is running. The web app reads
that internal snapshot through `SERVER_HEARTBEATS_URL`; it never contacts a game
server directly.

The service starts with `pnpm dev:services`. To run it directly instead, keep
MySQL running and use `pnpm dev:heartbeats`.

## Match demo analysis and XN Rating

Apply `packages/db/migrations/024_add_match_analysis_and_ratings.sql` to an
existing database, then configure `MATCH_DEMO_STORAGE_DIR` and the comma-separated
`XN_RATED_SERVER_ADDRESSES` allowlist. Only completed 5v5 matches from those
servers are eligible for XN Rating.

Run the parser directly beside the web app:

```bash
pnpm dev:parser
```

Or run the container profile, which shares uploaded demos with the worker:

```bash
docker compose -f compose.dev.yml --profile parser up -d --build demo-parser
```

Uploads are queued automatically. The worker parses rounds and useful game
events, retries transient failures, and applies each eligible rating change once
through the immutable rating ledger.

## Discord activity bot

Create a Discord application, install it in the community guild with the `bot`
and `applications.commands` scopes, then fill in `DISCORD_BOT_TOKEN`,
`DISCORD_APPLICATION_ID`, and `DISCORD_GUILD_ID` in `.env`. The bot only requests
guild, guild-message, and voice-state intents; message content is never read.

Run the bot beside the local web app with:

```bash
pnpm dev:bot
```

Alternatively, build it as a separate container with:

```bash
docker compose -f compose.dev.yml --profile discord up -d --build
```

The bot registers `/link` and `/support` in the configured guild. The private
link from `/link` sends the member to the website to confirm account ownership
and credit previously stored activity. `/support` provides direct links to the
public support, privacy, and terms pages.

Before submitting the Discord application for verification, set
`NEXT_PUBLIC_SUPPORT_EMAIL`, deploy the public legal pages, and complete the
portal checklist in [`docs/discord-verification.md`](docs/discord-verification.md).

## P2P voice rooms

The `/voice` page uses PeerJS Cloud for signaling. Audio and current-session chat
travel directly between browsers; the web app stores room metadata and short-lived
presence leases only. Apply `packages/db/migrations/020_add_voice_rooms.sql` before
enabling the feature in an existing database.

Set `VOICE_ENABLED=true` and replace the guest-cookie and room-code secrets in
production. Public HTTPS is required for microphone access. PeerJS uses the STUN
servers in `STUN_URLS`; no PeerJS or Socket.IO service is hosted by this project.

TURN is optional but recommended for networks where direct P2P traversal fails.
To run the included coturn profile locally or on a single public Docker host:

```bash
docker compose -f compose.dev.yml --profile voice up -d coturn
```

Set `TURN_EXTERNAL_IP` to the host's public IP, expose TCP/UDP 3478 and the UDP
relay range, set `TURN_URLS` to the public `turn:`/`turns:` URLs, and use the same
`TURN_SHARED_SECRET` in the web and coturn containers. Static TURN credentials are
never sent to browsers; the session endpoint derives one-hour credentials.
