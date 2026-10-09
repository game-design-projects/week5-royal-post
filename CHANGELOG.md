# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-08

### Added

- Royal Post: a pigeon carries six letters between Prince Florian of Highroost and Princess Maren of Westmere on a 30-unit planet (flight model and world from *Pigeon Planet*, three.js r128).
- Story engine (`src/story.js`): one letter a day, each letter's variant picked from how the previous one travelled (on time, late, lost, peeked). Two endings, *Happily Ever After* and *Ever After*, decided by whether the day-5 letter is the true one.
- All letter, reaction and ending text in `src/letters.js`. Fifteen letter variants with crossed-out lines that only a peeker sees.
- Letter weight as a mechanic: the prince's heavy letters slow the pigeon and drain wing power faster; the princess's light cards speed it up.
- Day clock: sunrise to sunset in 55 s, with sky, fog, light and stars driven by `src/daylight.js`, glowing windows at dusk, and a HUD sun dial with a sunset countdown.
- Landmarks: Highroost (gold-roofed castle, banners, a statue of the prince) and Westmere (slate tower, garden, beehive), each with its royal on a balcony, a perch, and a light beam over the current destination.
- Peeking overlay: a parchment letter or an index card, read while the clock keeps running and the pigeon circles. Drop by holding Q or DROP; the letter flutters away.
- Story cards for pickup, delivery and loss; an ending card with stats and every name the prince gave you; the Royal Archive of the run's letters.
- Synthesized WebAudio sound effects; touch controls (stick, FLAP, READ, hold DROP); layouts for 1280×720 and 390×844.
- Tagged console logging (`?debug=1` for detail) and `window.__rp` debug hooks.
- Unit tests (`node --test`): seeded rng, terrain and landmark placement, day-length derivation, all 46,656 outcome combinations, the ending rule, letter content contrast and the build. Playwright e2e covering both endings, peeking, late arrival and phone layout, which also generates the README and itch.io screenshots.
- GitHub Actions workflow: test, build, validate and `butler push` to `stevenli-phoenix-work/royal-post:html5` on every push to `main`.
