// One shared status function: cards, calendar popup and alerts must all use this.
import { THRESHOLDS, STALE_MINUTES } from '../config';

export function evaluateStatus(param, value, ts, now = Date.now(), th = THRESHOLDS) {
  if (value == null || Number.isNaN(value)) return 'unavailable';
  if (ts && now - ts > STALE_MINUTES * 60000) return 'stale';
  if (param === 'level') {
    const { low, high } = th.waterLevel; // exactly low/high counts as normal
    return value < low ? 'low' : value > high ? 'high' : 'normal';
  }
  if (param === 'tds') {
    const { upper, lower } = th.tds;
    if (upper == null && lower == null) return 'unconfigured';
    if (upper != null && value > upper) return 'high';
    if (lower != null && value < lower) return 'low';
    return 'normal';
  }
  const { upper } = th.turbidity;
  if (upper == null) return 'unconfigured';
  return value > upper ? 'high' : 'normal';
}
export const statusColor = (s) => (s === 'normal' ? 'green' : s === 'low' || s === 'high' ? 'red' : 'gray');
export const statusText = (param, s) => {
  if (param === 'level' && s === 'low') return 'Low water';
  if (param === 'level' && s === 'high') return 'High water';
  return { normal: 'Normal', high: 'Above limit', low: 'Below limit', stale: 'Stale reading', unavailable: 'Unavailable', unconfigured: 'Threshold not set' }[s];
};

// Water quality from TDS + turbidity readings. 'good' only means within configured limits, not safe to drink.
export function qualityOf(tdsR, turbR) {
  const s = [evaluateStatus('tds', tdsR?.tds, tdsR?.ts), evaluateStatus('turb', turbR?.turb, turbR?.ts)];
  if (s.some((x) => x === 'high' || x === 'low')) return 'bad';
  return s.every((x) => x === 'normal') ? 'good' : 'unknown';
}