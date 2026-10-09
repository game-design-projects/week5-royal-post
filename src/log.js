// Console logging. Key story events always log one line; `?debug=1` adds the
// chatty per-system detail. Every line is tagged: [story] [flight] [world] …
const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');

export const isDebug = () => DEBUG;
export function log(tag, ...args) {
  console.log(`[${tag}]`, ...args);
}
export function dbg(tag, ...args) {
  if (DEBUG) console.log(`[${tag}]`, ...args);
}
