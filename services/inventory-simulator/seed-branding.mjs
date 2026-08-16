import { spawnSync } from "node:child_process";

const defaultAppName = "Xóm Nghiện Inventory";

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function originFrom(value) {
  if (!value) {
    return "";
  }
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function publicUrl() {
  return trimTrailingSlash(
    process.env.XN_INV_PUBLIC_URL || originFrom(process.env.STEAM_CALLBACK_URL)
  );
}

function assetUrl(path, explicitValue, { absolute = false } = {}) {
  if (explicitValue) {
    return explicitValue;
  }
  if (!absolute) {
    return path;
  }
  const baseUrl = publicUrl();
  return baseUrl ? `${baseUrl}${path}` : path;
}

const appName = process.env.XN_INV_APP_NAME || defaultAppName;
const footerName = process.env.XN_INV_APP_FOOTER_NAME || appName;
const seoTitle =
  process.env.XN_INV_SEO_TITLE || `${appName} - CS2 Inventory Simulator`;
const seoDescription =
  process.env.XN_INV_SEO_DESCRIPTION ||
  "Craft, open cases, and manage a Counter-Strike 2 inventory with Xóm Nghiện.";

const rules = [
  ["appName", appName],
  ["appFooterName", footerName],
  ["appLogoUrl", assetUrl("/xn/logo.svg", process.env.XN_INV_LOGO_URL)],
  ["appFaviconUrl", assetUrl("/xn/favicon.png", process.env.XN_INV_FAVICON_URL)],
  ["appFaviconMimeType", "image/png"],
  ["appSeoTitle", seoTitle],
  ["appSeoDescription", seoDescription],
  [
    "appSeoImageUrl",
    assetUrl("/xn/seo-image.png", process.env.XN_INV_SEO_IMAGE_URL, {
      absolute: true
    })
  ]
];

const statements = rules.map(
  ([name, value]) => `
INSERT INTO "Rule" ("name", "type", "value")
VALUES (${sqlString(name)}, 'string', ${sqlString(value)})
ON CONFLICT ("name") DO UPDATE
SET "type" = EXCLUDED."type",
    "value" = EXCLUDED."value";`
);

if (process.env.XN_INV_API_AUTH_KEY) {
  statements.push(`
INSERT INTO "ApiCredential" ("apiKey", "scope", "comment", "updatedAt")
VALUES (${sqlString(process.env.XN_INV_API_AUTH_KEY)}, 'api_auth', 'XN Inventory sign-in', CURRENT_TIMESTAMP)
ON CONFLICT ("apiKey") DO UPDATE
SET "scope" = EXCLUDED."scope",
    "comment" = EXCLUDED."comment",
    "updatedAt" = CURRENT_TIMESTAMP;`);
}

const sql = statements.join("\n");

const result = spawnSync(
  "npx",
  ["prisma", "db", "execute", "--stdin"],
  {
    input: sql,
    stdio: ["pipe", "inherit", "inherit"]
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
