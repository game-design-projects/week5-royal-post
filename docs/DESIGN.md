# Royal Post — design

> NYU CS-UY 4553 Game Design, Week 5 (two NPCs with distinct personalities).
> Original idea: V (pigeon carrying letters between a prince and a princess). Fixed, pre-written story — no runtime LLM.

**One line:** you are the royal pigeon on a planet 1.9 km around; every letter between two royals who have never met goes through your claws, and how you carry them decides what kind of marriage they walk into.

## The two NPCs

The assignment asks for two NPCs with distinctive personalities. Here the difference is written into the text, the typography, the 3D models **and the flight physics**.

| | Prince Florian of Highroost | Princess Maren of Westmere |
|---|---|---|
| Voice | Florid, verbose, self-moved. Lists his titles, quotes himself, compares himself to the sun. Underneath: terrified, has never met her, doesn't know how to talk to anyone. | Calm, terse, dry. Runs the kingdom's granary ledgers. Says exactly what she means and nothing else. Underneath: lonely, afraid of crowds, trusts numbers because they never pretend. |
| Letters | 6–12 parchment pages, ribbons, pressed flowers, wax seal with a sun crest. Typeset in a script face with a drop cap. | One index card, wheat-sheaf seal. Typeset in a typewriter face. Signs "— M." |
| Weight (mechanic) | **Heavy.** His letters slow the pigeon (cruise ×0.75, boost drains faster). | **Light.** Her letters barely register (cruise ×1.15). |
| Calls the pigeon | A new grand name every day: Zephyrine the Swift, Aethon the Unwearied, Sir Coo of the Eastern Gale… (the ending card lists them all) | "Pigeon." |
| Home | Highroost Castle: gold-roofed towers, red-and-gold banners, a statue of himself. | Westmere Tower: one slim slate-blue tower, a lit window, a vegetable garden, a beehive. |
| Model | Tall, gold crown, red cape, holds an enormous quill. | Small, plain silver circlet, spectacles, holds a ledger. |
| Bark when you land | "Ah! My winged herald!" | "Pigeon." |
| Feeds you | Never. Gives you a title instead. | Once (Day 4): full wing power and +10 crumbs. |

## Core loop (one day = one letter)

1. **Pickup** — a short card at the sender's balcony: the sender hands over the letter with one line in their voice. Title card: `Day 3 — The Ode · 9 pages · heavy`.
2. **Flight** — sunrise. Fly to the recipient (compass arrow + distance). The day clock runs: a sun arc in the HUD, the sky goes dawn → noon → golden hour → dusk → night (stars appear, landmark windows glow).
3. **Delivery** — fly within range of the recipient's balcony perch → auto-land → the recipient reacts (timing line + seal line + letter-specific line). Their reply becomes the next day's letter.

Crumbs and golden bagels from Pigeon Planet stay on the map: they refill wing power and score, and they are the temptation that makes you late.

## The four verbs (player choices per letter)

The story trunk never changes; these four verbs bend it.

| Verb | How | Consequence |
|---|---|---|
| **On time** | Land before sunset. | Default good path. |
| **Late** | Land after sunset (night). | Recipient notices; key beats change (Day 4 → Day 5). |
| **Peek** | `E` / READ button while flying. Breaks the seal permanently. The letter opens as an overlay **while the clock keeps running** and the pigeon glides. | You see the letter text (otherwise you never do — unpeeked players only see reactions and replies). Recipient reacts to the broken seal in character. The prince's long letters cost real daylight to read; hers cost almost nothing. Some letters contain crossed-out lines only a peeker ever sees. |
| **Lose** | Hold `Q` / hold DROP for 1 s. The letter flutters down. | The day ends at sunset with "The letter never arrived." The recipient never gets it; their next letter is the "silence" variant. |

## The six letters (alternating; text variants keyed on the previous letter's outcome)

| Day | Letter | Notes |
|---|---|---|
| 1 | Prince → Princess **"The Proposal"** (heavy) | The two kingdoms share a tiny planet; a treaty says they marry by the Harvest Moon. He introduces himself with every title, a 40-verse ode "available upon request", and "third place, Junior Joust". Crossed-out P.S. (peek only): *I have never actually met you and I am terrified.* |
| 2 | Princess → Prince **"Received"** (light) | Delivered: "Received. Eleven pages. The treaty says we marry by the Harvest Moon; I'll honour it. The ode is not required. — M." Lost: "Your pigeon arrived with nothing but a look of guilt. If you meant to write, write." |
| 3 | Prince → Princess **"The Ode"** (heavy) | Wounded by brevity, he doubles down: nine stanzas, she is the moon, he is the sun. If #2 was lost: "Perhaps my letter was too modest. Allow me to elaborate." (even longer). Crossed-out (peek only): *What do you like? Nobody has ever told me what you like.* |
| 4 | Princess → Prince **"One True Thing"** (light) — the turning point | "Florian. Stop writing poems. Tell me one true thing about yourself. Something nobody would put on a banner. — M. P.S. Feed the pigeon." She feeds you at pickup. If #3 was lost: "Three days and nothing. Either you've run out of adjectives or something is wrong." Same question either way. |
| 5 | Prince → Princess — **the key letter**, three versions | **#4 on time → "The True Thing" (light! he finally travels light):** "Maren. One true thing: I came third in the junior joust because there were three of us. I'm afraid of heights, which is inconvenient in a castle. I wrote eleven pages because I didn't think one would be enough. — Florian. (Just Florian.)" **#4 late → "By Candlelight" (medium):** starts honest, panics, reverts to flourish halfway. **#4 lost → "A Royal Proclamation in Twelve Cantos" (heaviest).** |
| 6 | Princess → Prince **"Harvest Moon"** (light) | True letter received: "I'm afraid of crowds, which is inconvenient for a princess. I balance the granary ledgers at night because numbers never pretend. I'll see you at the Harvest Moon. Bring nothing heavy. — Maren. (Just Maren.)" Grand letter received: "Received. Twelve cantos. See you at the Harvest Moon, as the treaty requires. — M." Lost: "Nothing again. Fine. The treaty is the treaty." |

## Endings (they always marry — V's premise — the question is how)

- **Happily Ever After** — Letter 5 is *The True Thing* and is not lost; **or** it is *By Candlelight*, delivered on time. Wedding on the hill between the two homes; they speak plainly; his letters are short now; the pigeon retires on a pension of crumbs.
- **Ever After** (unhappily together) — every other path. A correct, polite wedding. He speaks in cantos; she counts the guests. They live in separate wings and keep writing letters — the pigeon now carries them across a hallway.

Epilogue lines vary with stats (peeked ≥3: "The pigeon knew everything before either of them did. It never told." · lost ≥2 · all on time · crumbs eaten). The ending card shows: on time / late / lost / peeked, crumbs, every grand name the prince gave you, and a nudge that another ending exists.

## World & flight (from Pigeon Planet, r128)

- Planet radius 30, value-noise terrain, sea, villages, trees, clouds — **seeded PRNG** (deterministic map so landmarks never land in the sea and tests are stable).
- Highroost and Westmere sit on land roughly 150–160° apart (great-circle), found deterministically from the seed.
- Quaternion-pivot flight, third-person chase camera, `A/D` turn, `W/S` climb/dive, `Space` flap hard (wing power), touch stick + FLAP. Cruise 6 u/s, boost 12 u/s (user-tuned), multiplied by letter weight.
- Day length is a tuned constant: a direct flight with a heavy letter makes it with some margin; reading a long letter mid-flight or chasing bagels makes you late.

## Tech

Plain HTML + native ES modules, no bundler; `vendor/three.min.js` (r128, UMD global) loaded by a classic `<script>`. Pure modules (story engine, letters, daylight, rng, sphere math) are unit-tested with `node --test`; the browser layer is covered by a playwright-core e2e that plays every day through debug hooks. CI publishes to `stevenli-phoenix-work/royal-post:html5` on push to `main`.
