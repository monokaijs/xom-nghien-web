#!/bin/sh
set -eu

npx prisma migrate deploy
node ./seed-branding.mjs
npm run start
