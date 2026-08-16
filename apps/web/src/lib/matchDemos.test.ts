import { describe, expect, it } from 'vitest';
import {
  DEMO_UPLOAD_CHUNK_BYTES,
  MAX_DEMO_BYTES,
  parseDemoChunkRange,
} from './matchDemos';

describe('demo chunk ranges', () => {
  it('accepts a chunk within the 500 MiB file limit', () => {
    const start = MAX_DEMO_BYTES - DEMO_UPLOAD_CHUNK_BYTES;
    expect(parseDemoChunkRange(`bytes ${start}-${MAX_DEMO_BYTES - 1}/${MAX_DEMO_BYTES}`)).toEqual({
      start,
      end: MAX_DEMO_BYTES - 1,
      total: MAX_DEMO_BYTES,
    });
  });

  it('rejects files larger than 500 MiB', () => {
    expect(parseDemoChunkRange(`bytes 0-0/${MAX_DEMO_BYTES + 1}`)).toBeNull();
  });

  it('rejects chunks larger than the Cloudflare-safe chunk size', () => {
    expect(parseDemoChunkRange(`bytes 0-${DEMO_UPLOAD_CHUNK_BYTES}/${MAX_DEMO_BYTES}`)).toBeNull();
  });

  it.each([
    null,
    '',
    '0-9/10',
    'bytes 10-9/20',
    'bytes 0-10/10',
    'bytes -1-8/10',
  ])('rejects malformed range %j', (value) => {
    expect(parseDemoChunkRange(value)).toBeNull();
  });
});
