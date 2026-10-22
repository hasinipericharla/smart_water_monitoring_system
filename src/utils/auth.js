// Talks to the backend. The session (user + JWT token) is kept in this browser's localStorage.
const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
const SESSION = 'swm_session';

export const currentUser = () => { const s = JSON.parse(localStorage.getItem(SESSION) || 'null'); return s?.token ? s : null; };
export const getToken = () => currentUser()?.token || null;
export const logout = () => localStorage.removeItem(SESSION);

async function post(path, body) {
  let res;
  try { res = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
  catch { throw new Error('Cannot reach the server. Is the backend running?'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Please check the details you entered.');
  return data;
}
const save = ({ token, user }) => { const s = { ...user, token }; localStorage.setItem(SESSION, JSON.stringify(s)); return s; };

export const signup = ({ name, email, phone, password }) => post('/api/auth/signup', { name, email, phone: phone.replace(/[\s-]/g, ''), password });
export const resendOtp = (email) => post('/api/auth/resend-otp', { email });
export const verifyOtp = async (email, otp) => save(await post('/api/auth/verify-otp', { email, otp }));
export const login = async (email, password) => save(await post('/api/auth/login', { email, password }));
