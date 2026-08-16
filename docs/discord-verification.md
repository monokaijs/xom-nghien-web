# Discord application verification runbook

This runbook describes the current Xóm Nghiện Discord application. Keep the
portal answers consistent with the deployed code and update this document if the
bot's behavior changes.

## Current application behavior

- The bot is server-installed and intentionally supports one community server,
  selected by `DISCORD_GUILD_ID`.
- `/link` creates an ephemeral, one-time account-link URL that expires after 10
  minutes. Only a SHA-256 hash of the secret is stored.
- `/support` provides links to support, privacy, and terms pages.
- A human, non-webhook message earns one point. The bot stores message metadata
  but does not request Message Content and does not read or store message bodies,
  attachments, embeds, or reactions.
- Eligible voice time earns one point per completed minute when at least two
  non-bot, non-self-deafened members are present outside the AFK channel. Audio
  is never received or recorded.
- The bot uses only the standard `Guilds`, `GuildMessages`, and
  `GuildVoiceStates` gateway intents. It uses no privileged intents.

The current implementation is **not a public multi-server bot**: command
registration, activity attribution, and configuration are tied to one guild.
Do not enable public installation or describe it as supporting arbitrary servers
until the data model and configuration have been redesigned for that purpose.

## Deploy before opening the portal

1. Set `WEB_PUBLIC_URL` and `NEXTAUTH_URL` to the canonical HTTPS origin.
2. Set `NEXT_PUBLIC_SUPPORT_EMAIL` to a monitored address and redeploy the web
   image. Confirm the address appears on `/support`.
3. If the service is operated by a registered person or company, have the
   privacy policy and terms reviewed and identify that legal operator wherever
   required by the laws that apply to the service.
4. Use production-grade random values for `NEXTAUTH_SECRET`, `SESSION_SECRET`,
   and all other secrets. Keep the bot token and OAuth client secret outside
   source control.
5. Apply all database migrations, use encrypted storage/backups, restrict
   database access to the application, and document who has production access.
6. Confirm these URLs return HTTP 200 without signing in:

   - `https://<public-origin>/privacy`
   - `https://<public-origin>/terms`
   - `https://<public-origin>/support`

7. Start the bot and confirm `/healthz` is healthy internally. Run `/link` and
   `/support` from a non-admin test account.

## Developer Portal values

Use the deployed public origin in every URL below.

### General Information

- **Name:** `Xóm Nghiện` (or the exact existing public bot name)
- **Description:**

  > Xóm Nghiện rewards eligible community message and voice participation with
  > leaderboard points. Members can securely connect their account with /link.
  > The bot never reads message content or voice audio.

- **Tags:** `community`, `utility`, `social` (choose only tags actually offered
  by the portal)
- **Terms of Service URL:** `https://<public-origin>/terms`
- **Privacy Policy URL:** `https://<public-origin>/privacy`

Upload a unique, legible application icon that matches the identity used by the
website and support server. Do not use Discord branding as the app's identity.

### Installation

- Support **Guild Install** only.
- Default install scopes: `bot` and `applications.commands`.
- Request only **View Channels** (`1024`) unless testing proves another bot
  permission is essential. Channel permission overrides determine which message
  activity the bot can observe.
- Leave **User Install** disabled; the current commands and guild checks do not
  support it.
- Leave the bot non-public while it remains single-guild.

### Bot and gateway

- Disable `Presence Intent`, `Server Members Intent`, and `Message Content
  Intent`.
- The code sends only `Guilds`, `GuildMessages`, and `GuildVoiceStates` in the
  gateway identify payload.
- An Interactions Endpoint URL is not needed because discord.js receives
  interactions over the gateway. Do not enter a web URL that does not implement
  Discord signature verification and PING responses.

### OAuth2

If Discord login is enabled on the website, register this exact redirect URI:

`https://<public-origin>/api/auth/callback/discord`

The login provider should request only the default identity scopes required by
NextAuth. The bot install flow is separate and uses `bot` plus
`applications.commands`.

## Team and verification checklist

The live Developer Portal is the source of truth for the final qualification
criteria. Before submitting:

- Transfer the application to a Discord developer team if it is still owned by
  an individual.
- Ensure the team owner and required team members have verified email addresses
  and two-factor authentication enabled.
- The team owner must complete the identity check offered by Discord's current
  verification flow.
- Make the app name, icon, description, support server, website, privacy URL,
  and terms URL consistent and publicly reachable.
- Review Discord's current Developer Terms, Developer Policy, Community
  Guidelines, and any checklist displayed under **App Verification**.
- Do not request privileged intents. If the portal says one is required, stop
  and reconcile that claim with the deployed gateway intents before submitting.

## Reviewer walkthrough

Record a short, unedited walkthrough if the portal asks for one:

1. Show the bot profile and its `/link` and `/support` commands.
2. Run `/support`; show that the response is ephemeral and open all three public
   URLs.
3. Run `/link`; show that the response is ephemeral and says the URL expires in
   10 minutes.
4. Open the link, sign in, confirm linking, and show the linked state in account
   settings.
5. Send a normal message and show only the score changing; explicitly show that
   Message Content is disabled in the portal.
6. Join voice with two eligible test users, then show voice points changing.
   State that the app receives voice-state metadata only and never audio.
7. Show how a user can unlink Discord and how to submit a data-deletion request
   from `/support`.

## Suggested review answers

**What does the app do?**

> Xóm Nghiện is a community activity and account-linking bot for the Xóm Nghiện
> gaming community. It awards leaderboard points for eligible message events and
> voice participation and lets a member securely connect their Discord identity
> to their website profile using /link.

**What Discord data is stored?**

> Guild, user, channel and message IDs; event timestamps; eligible voice-session
> timing; awarded points; and the user's Discord display name/avatar during the
> short account-link flow. We do not request Message Content and never store
> message bodies, attachments, embeds, reactions, or voice audio.

**Why are these intents needed?**

> Guilds registers guild commands and identifies the configured community;
> GuildMessages receives message-created events so one point can be recorded
> without reading content; GuildVoiceStates measures eligible time in voice
> channels without receiving audio. All three are standard, non-privileged
> intents.

**How can users delete data or get support?**

> Users can unlink Discord in website settings and submit access, correction, or
> deletion requests through the public support page linked by /support and the
> app profile. Verified requests are handled by the community operations team.

## Release evidence

Save the following with the verification submission date:

- commit SHA and deployed image tag;
- screenshots of portal intents and install settings;
- HTTP checks for the three public policy/support URLs;
- successful bot health check and command smoke test;
- the reviewer walkthrough video, if requested;
- the name of the person responsible for support and deletion requests.
