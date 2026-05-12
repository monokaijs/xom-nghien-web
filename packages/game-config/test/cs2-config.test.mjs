import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CS2_BOOT_CONFIG_PATH,
  CS2_BOOT_EXEC_FILE,
  CS2_CSSHARP_ADMINS_PATH,
  CS2_MATCHZY_ADMINS_PATH,
  renderCs2CustomFiles,
  validateCs2Config,
} from '../dist/index.js';

test('migrates legacy CS2 configs to a full bundle shape', () => {
  const config = validateCs2Config({
    mode: 'competitive',
    map: 'de_mirage',
    maxPlayers: 10,
    tickRate: 128,
    admins: ['76561198000000000'],
  });

  assert.equal(config.modeLabel, 'Competitive');
  assert.equal(config.modeExec, 'comp.cfg');
  assert.deepEqual(config.startupCommands, []);
  assert.deepEqual(config.env, {});
  assert.deepEqual(config.customFiles, []);
});

test('supports custom modes and renders managed custom files', () => {
  const config = validateCs2Config({
    mode: 'surf-weekend',
    modeLabel: 'Surf Weekend',
    modeExec: 'custom/surf_weekend.cfg',
    map: 'surf_utopia',
    maxPlayers: 24,
    tickRate: 128,
    admins: ['76561198000000000'],
    startupCommands: ['say "ready"'],
    env: { LAN: true },
    customFiles: [{ path: 'cfg/custom/surf_weekend.cfg', content: 'sv_airaccelerate 150\n' }],
  });

  const files = renderCs2CustomFiles(config);
  const boot = files.find((file) => file.path === CS2_BOOT_CONFIG_PATH);
  assert.ok(boot);
  assert.match(boot.content, /changelevel surf_utopia/);
  assert.match(boot.content, /exec custom\/surf_weekend\.cfg/);
  assert.match(boot.content, /say "ready"/);
  assert.ok(files.some((file) => file.path === CS2_MATCHZY_ADMINS_PATH));
  assert.ok(files.some((file) => file.path === CS2_CSSHARP_ADMINS_PATH));
  assert.ok(files.some((file) => file.path === 'cfg/custom/surf_weekend.cfg'));
  assert.equal(CS2_BOOT_EXEC_FILE, 'xom_boot.cfg');
});

test('allows explicit custom files to override managed files', () => {
  const config = validateCs2Config({
    mode: 'competitive',
    map: 'de_dust2',
    maxPlayers: 10,
    tickRate: 128,
    admins: ['76561198000000000'],
    customFiles: [
      { path: CS2_BOOT_CONFIG_PATH, content: 'echo custom boot\n' },
      { path: CS2_MATCHZY_ADMINS_PATH, content: '{}\n' },
    ],
  });

  const files = renderCs2CustomFiles(config);
  assert.equal(files.filter((file) => file.path === CS2_BOOT_CONFIG_PATH).length, 1);
  assert.equal(files.find((file) => file.path === CS2_BOOT_CONFIG_PATH).content, 'echo custom boot\n');
  assert.equal(files.filter((file) => file.path === CS2_MATCHZY_ADMINS_PATH).length, 1);
});

test('rejects unsafe paths, invalid JSON, duplicate files, and reserved env keys', () => {
  assert.throws(() => validateCs2Config({
    mode: 'competitive',
    map: 'de_dust2',
    maxPlayers: 10,
    tickRate: 128,
    customFiles: [{ path: '../cfg/bad.cfg', content: '' }],
  }), /safe relative path|unsafe|parent/);

  assert.throws(() => validateCs2Config({
    mode: 'competitive',
    map: 'de_dust2',
    maxPlayers: 10,
    tickRate: 128,
    customFiles: [{ path: 'cfg/plugin.json', content: '{bad json' }],
  }), /invalid JSON/);

  assert.throws(() => validateCs2Config({
    mode: 'competitive',
    map: 'de_dust2',
    maxPlayers: 10,
    tickRate: 128,
    customFiles: [
      { path: 'cfg/a.cfg', content: '' },
      { path: 'cfg/a.cfg', content: '' },
    ],
  }), /Duplicate custom file path/);

  assert.throws(() => validateCs2Config({
    mode: 'competitive',
    map: 'de_dust2',
    maxPlayers: 10,
    tickRate: 128,
    env: { EXEC: 'bad.cfg' },
  }), /managed by the system/);
});
