import { dayKey } from './dateUtils';

// Sensor reports distance D to water surface; H = usable tank height.
export function levelFromDistance(H, D) {
  if (!(H > 0) || D < 0 || D > H * 1.05) return null; // flag impossible readings, don't use them
  return Math.min(100, Math.max(0, ((H - D) / H) * 100));
}
export const heightFromLevel = (pct, H) => (pct / 100) * H;
export const volumeFromLevel = (pct, capacity) => (pct / 100) * capacity; // constant cross-section tanks only

const usable = (rs, k) => rs.filter((r) => r.valid && r[k] != null).map((r) => r[k]);
export function stats(rs, k) {
  const v = usable(rs, k);
  if (!v.length) return null; // missing data is never treated as zero
  return { avg: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v), max: Math.max(...v), n: v.length };
}
export function groupByDay(readings) {
  const m = {};
  for (const r of readings) (m[dayKey(r.ts)] ||= []).push(r);
  return m;
}
export function latestValid(readings, k) {
  for (let i = readings.length - 1; i >= 0; i--) if (readings[i].valid && readings[i][k] != null) return readings[i];
  return null;
}
