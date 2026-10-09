import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../tools/build.mjs';
import { validate } from '../scripts/check-html5.mjs';

test('build produces a valid itch.io HTML5 bundle with only runtime files', async () => {
  const out = await mkdtemp(join(tmpdir(), 'royal-post-dist-'));
  try {
    await build({ outDir: out });
    const top = (await readdir(out)).sort();
    assert.deepEqual(top, ['index.html', 'src', 'styles', 'vendor']);
    assert.ok((await readdir(join(out, 'vendor'))).includes('three.min.js'));
    await validate(out);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});
