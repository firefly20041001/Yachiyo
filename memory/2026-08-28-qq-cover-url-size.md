# QQ Music cover URL size

## Debug report

- **Symptom**: QQ Music song covers stopped displaying after the playback image optimization.
- **Root cause**: QQ image URLs were rewritten from the valid `R300x300M` segment to `R100x100M`. The QQ image service does not provide a 100px variant for this URL pattern and returned 404.
- **Fix**: `src/renderer/utils/cover.ts` now maps QQ cover requests to the nearest supported size of 150, 300, or 500. A 100px request uses 150px; 300px remains exact.
- **Evidence**: A real QQ cover returned 404 at 50px, 100px, and 200px, while 150px, 300px, and 500px returned `image/jpeg`. Added `scripts/test-cover-url.mjs`; `pnpm.cmd run test:cover`, `typecheck`, and `lint` pass.
- **Regression test**: `scripts/test-cover-url.mjs`
- **Related**: The prior playback-resource change reduced oversized image decoding but assumed QQ supported arbitrary square sizes.
- **Status**: DONE
