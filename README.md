# Xom Nghien Web

By @monokaijs

## Valheim manifests

Administrators can create a server with game `Valheim`, then open its settings from **Admin → Servers**. The Valheim page manages exact Thunderstore package JSON and text config drafts. Configs can target the dedicated server, connecting clients, or both. Nothing is deployed until **Publish** is selected.

Before using the feature, apply [`migrations/004_add_valheim_mod_manifests.sql`](migrations/004_add_valheim_mod_manifests.sql). After the first publish, copy the tokenized manifest URL shown by the admin page into:

```ini
# BepInEx/config/ServerModBootstrap/bootstrap.cfg
ManifestUrl = https://your-site.example/api/valheim/manifests/MANIFEST_ID?token=TOKEN
```

The URL can read server-only configuration contents and must be treated as a secret. Config files are limited to 512 KiB each; the generated bootstrap manifest retains its 8 MiB total limit.
