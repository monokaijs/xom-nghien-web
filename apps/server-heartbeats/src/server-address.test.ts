import { describe, expect, it } from 'vitest';
import { parseServerAddress } from './server-address.js';

describe('parseServerAddress', () => {
  it.each([
    'steam://run/892970//+connect cs2.xomnghien.com:2456',
    'steam://run/892970//+connect%20cs2.xomnghien.com:2456/',
    'steam://rungameid/892970//+connect%20cs2.xomnghien.com:2456/',
  ])('parses a Valheim Steam launch URL: %s', (connectionLink) => {
    expect(parseServerAddress(connectionLink)).toEqual({
      host: 'cs2.xomnghien.com',
      port: 2456,
      address: 'cs2.xomnghien.com:2456',
    });
  });
});
