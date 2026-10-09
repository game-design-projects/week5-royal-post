// Every tunable in one place. Pure data — imported by both the browser game and
// the node tests (tests/config.test.js re-derives the day length from these).

export const APP_VERSION = '0.1.0';

// World. Seed 42 gives ~61% land with a real sea crossing, and its landmark
// pair sits 155.6° apart (findLandmarks, band 150–160°).
export const SEED = 42;
export const R = 30;
export const LANDMARK_BAND_DEG = [150, 160];

// Flight (from Pigeon Planet, user-tuned): cruise 6 u/s, flap hard 12 u/s.
export const SPEED = { cruise: 6, boost: 12, dive: 7.5, glide: 0.6 /* × cruise while reading */ };
export const ALT = { min: 0.9 /* above ground */, max: 20 /* above R */, cruise: 8 /* typical, above R */, takeoff: 3 };
export const STAMINA = { drain: 0.35, regen: 0.14 };
export const TURN_RATE = 1.4;
export const READ_TURN = 0.35; // the pigeon circles lazily while you read

// Letter weight is the prince/princess contrast made physical.
//   cruise/boost: speed multipliers · drain: wing-power drain multiplier.
export const WEIGHT = {
  light: { cruise: 1.15, boost: 1.1, drain: 0.9, label: 'light' },
  medium: { cruise: 0.9, boost: 0.95, drain: 1.1, label: 'medium' },
  heavy: { cruise: 0.75, boost: 0.85, drain: 1.35, label: 'heavy' },
  heaviest: { cruise: 0.65, boost: 0.8, drain: 1.5, label: 'very heavy' },
};

// Day length, derived (tests/config.test.js checks every line of this):
//   landmark angle 155.6° = 2.716 rad, flown at ALT.cruise → r = 38
//   heavy direct:    2.716 × 38 / (6 × 0.75) = 22.9 s, × MANEUVER 1.3 = 29.8 s
//   heaviest direct: 2.716 × 38 / (6 × 0.65) = 26.5 s, × 1.3            = 34.4 s
//   → DAY.length 55 s leaves ≥ 20 s of slack for a straight run with the
//     heaviest letter, so lateness is a choice, never bad luck.
//   Reading: READ_WPS 3.5 words/s (a brisk adult reader). The pigeon only
//   circles while you read, so reading costs its full duration: a ~300-word
//   prince letter is ~86 s → read it all and you are late, every time; a
//   ~40-word princess card is ~11 s → peeking at hers is nearly free.
export const MANEUVER = 1.3;
export const READ_WPS = 3.5;
export const DAY = { length: 55 };

// Arrival: fly within this distance of the recipient's balcony perch.
export const DELIVER_RADIUS = 4.2;
export const DROP_HOLD = 1.0; // seconds holding Q / DROP to let go of the letter
export const DROP_FALL = 2.2; // seconds of falling-letter animation

export const CRUMBS = { count: 22, bagels: 3, bagelValue: 5, pickupRadius: 1.7, stamina: 0.15 };
export const PROPS = { trees: 170, houses: 55, clouds: 22, clearAngle: 0.14 /* rad kept clear around landmarks */ };
