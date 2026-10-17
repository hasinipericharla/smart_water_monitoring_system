const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function req(path, opts = {}) {
  let res;
  try { res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...opts }); }
  catch { throw new Error('Cannot reach the backend. Start it with: uvicorn main:app --reload'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Server error ${res.status}`);
  return data;
}
export const syncRecipients = (people) => req('/api/recipients', { method: 'PUT', body: JSON.stringify(people) });
export const notifyStudents = (hostelId) => req(`/api/hostels/${hostelId}/notify-students`, { method: 'POST' });