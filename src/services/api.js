import { getToken, logout } from '../utils/auth.js';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

async function req(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  let res;
  try { res = await fetch(BASE + path, { ...opts, headers }); }
  catch { throw new Error('Cannot reach the backend. Start it with: uvicorn main:app --reload'); }
  if (res.status === 401) { logout(); location.reload(); throw new Error('Session expired. Please log in again.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Server error ${res.status}`);
  return data;
}
export const syncRecipients = (people) => req('/api/recipients', { method: 'PUT', body: JSON.stringify(people) });
export const notifyStudents = (hostelId) => req(`/api/hostels/${hostelId}/notify-students`, { method: 'POST' });
