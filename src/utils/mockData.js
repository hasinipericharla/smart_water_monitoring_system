// Live readings from the backend (MongoDB). The cache is refreshed by refreshReadings() (called from App.jsx).
import { HOSTELS } from '../config.js';
import { getToken, logout } from './auth.js';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
const cache = {};

export const getReadings = (hostelId) => cache[hostelId] || [];

export async function refreshReadings() {
  const token = getToken();
  if (!token) return; // not logged in
  await Promise.all(HOSTELS.map(async (h) => {
    try {
      const res = await fetch(`${BASE}/api/hostels/${h.id}/readings?limit=20000`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { logout(); location.reload(); return; }
      if (!res.ok) return;
      cache[h.id] = (await res.json()).map((r) => ({
        ts: new Date(r.ts).getTime(), level: r.level, tds: r.tds, turb: r.turb,
        valid: true, // each parameter is null when invalid, and stats skip nulls
        quality: r.valid ? 'ok' : 'level_invalid',
      }));
    } catch { /* backend offline: keep the last data */ }
  }));
}
