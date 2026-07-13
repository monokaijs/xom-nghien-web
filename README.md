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
