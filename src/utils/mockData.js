// SIMULATED DATA ONLY. Replace getReadings() with an API call (see services note in README).
import { addDays, dayKey, startOfDay } from './dateUtils';

const rng = (s) => () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
const cache = {};

export function getReadings(hostelId) {
  if (cache[hostelId]) return cache[hostelId];
  const seed = [...hostelId].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100000, 7);
  const r = rng(seed);
  const step = 30 * 60000, now = Date.now();
  const first = startOfDay(addDays(new Date(), -29));
  const missing = new Set([dayKey(addDays(first, 4 + Math.floor(r() * 8))), dayKey(addDays(first, 15 + Math.floor(r() * 10)))]);
  const phase = r() * 6, out = [];
  for (let t = first.getTime(); t <= now; t += step) {
    if (missing.has(dayKey(t))) continue;
    const h = t / 3600000, bad = r() < 0.01;
    const level = Math.min(100, Math.max(3, 55 + 38 * Math.sin(h / 9 + phase) + (r() - 0.5) * 4));
    const tds = 230 + 70 * Math.sin(h / 31 + phase) + (r() - 0.5) * 30 + (seed % 5) * 10;
    const turb = 1.6 + 0.9 * Math.sin(h / 17 + phase) + r() * 0.7 + (r() < 0.004 ? 4 : 0);
    out.push({ ts: t, level: bad ? null : +level.toFixed(1), tds: bad ? null : +tds.toFixed(0), turb: bad ? null : +turb.toFixed(2), valid: !bad, quality: bad ? 'sensor_fault' : 'ok' });
  }
  return (cache[hostelId] = out);
}
