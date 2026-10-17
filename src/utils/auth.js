// DEMO MODE: accounts live in this browser's localStorage (password kept only as a SHA-256 hash).
// Replace with backend auth (argon2/bcrypt + JWT/session cookie + server-side role checks) for production.
const KEY = 'swm_users', SESSION = 'swm_session';
const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((x) => x.toString(16).padStart(2, '0')).join('');
const users = () => JSON.parse(localStorage.getItem(KEY) || '[]');
export const currentUser = () => JSON.parse(localStorage.getItem(SESSION) || 'null');
export const logout = () => localStorage.removeItem(SESSION);
export async function signup({ name, email, phone, password }) {
  if (users().some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error('An account with this email already exists.');
  const u = { name, email, phone, role: 'warden', hash: await sha(password) };
  localStorage.setItem(KEY, JSON.stringify([...users(), u]));
  return start(u);
}
export async function login(id, password) {
  const u = users().find((x) => x.email.toLowerCase() === id.toLowerCase() || x.name.toLowerCase() === id.toLowerCase());
  if (!u || u.hash !== (await sha(password))) throw new Error('Incorrect email/username or password.');
  return start(u);
}
function start(u) { const s = { name: u.name, email: u.email, role: u.role }; localStorage.setItem(SESSION, JSON.stringify(s)); return s; }
