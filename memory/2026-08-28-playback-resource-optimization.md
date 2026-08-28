# Playback resource optimization

## Debug report

- **Symptom**: CPU and memory usage rose sharply after starting playback; later measurements showed playback memory remaining around 768 MB across Electron processes.
- **Root cause**: The renderer requested original album covers up to 2000x2000 for UI images rendered near 42px, causing unnecessary native image decoding and GPU memory pressure. Persistent backdrop blur and repeated volume writes added avoidable rendering work. The JavaScript heap was small, about 7.95 MB used, so JS state was not the pressure source.
- **Fix**: Added `src/renderer/utils/cover.ts` to request NetEase and QQ cover sizes appropriate to the UI. Track list and player covers now use 100px images with lazy/async decoding; fullscreen lyrics uses 300px. Reduced blur/saturation strength in the player, sidebar, queue, lyrics, and popover surfaces. Added a volume write guard in `src/renderer/utils/audio.ts`.
- **Evidence**: CDP before the image fix showed 300x300 decoded covers; after the fix, relevant covers were 100x100 and most list images stayed unloaded. Production idle used about 446 MB across 4 processes. Playback stabilized around 768 MB across 6 processes after 30 seconds. `pnpm.cmd run lint`, `typecheck`, and `build` passed.
- **Regression test**: No automated browser-resource regression exists. Verification was performed with a production build and CDP image-decoding measurements.
- **Related**: The playback `video_capture` utility process used about 123 MB. Settings page audio-output enumeration calls `navigator.mediaDevices.enumerateDevices()`, which may start Chromium media-device services. Avoiding full media-device enumeration or using a native audio-output enumerator is a separate follow-up.
- **Status**: DONE_WITH_CONCERNS
