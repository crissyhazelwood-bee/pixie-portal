import assert from 'node:assert/strict';
import { normalizeReplicateVideoUrl } from '../functions/api/journal/[id]/animate.js';

assert.equal(
  normalizeReplicateVideoUrl('https://replicate.delivery/pbxt/video.mp4'),
  'https://replicate.delivery/pbxt/video.mp4',
);

assert.equal(
  normalizeReplicateVideoUrl(['', { url: 'https://pbxt.replicate.delivery/video.mp4' }]),
  'https://pbxt.replicate.delivery/video.mp4',
);

assert.equal(
  normalizeReplicateVideoUrl({ uri: 'https://replicate.delivery/xezq/output.mp4' }),
  'https://replicate.delivery/xezq/output.mp4',
);

assert.equal(normalizeReplicateVideoUrl(null), '');
assert.equal(normalizeReplicateVideoUrl([{ nope: true }]), '');

console.log('Dream animation output normalization OK');
