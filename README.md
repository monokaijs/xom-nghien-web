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

The bot registers `/link` in the configured guild. Its private link sends the
member to the website to confirm account ownership and credit previously stored
activity.
