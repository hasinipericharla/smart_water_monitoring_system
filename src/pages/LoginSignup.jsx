import { useState } from 'react';
import { Droplets, Eye, EyeOff } from 'lucide-react';
import { login, signup } from '../utils/auth.js';

export default function LoginSignup({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ id: '', name: '', email: '', phone: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (mode === 'login') {
      if (!f.id.trim()) e.id = 'Enter your email or username.';
      if (!f.password) e.password = 'Enter your password.';
    } else {
      if (!f.name.trim()) e.name = 'Enter your full name.';
      if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.';
      if (!/^\+?\d{10,13}$/.test(f.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a phone number with 10–13 digits.';
      if (f.password.length < 8) e.password = 'Use at least 8 characters.';
      if (f.confirm !== f.password) e.confirm = 'Passwords do not match.';
    }
    return e;
  };
  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate(); setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try { onAuth(mode === 'login' ? await login(f.id.trim(), f.password) : await signup({ ...f, name: f.name.trim() })); }
    catch (x) { setErr({ form: x.message }); }
    setBusy(false);
  };
  const Field = ({ k, label, type = 'text', ...rest }) => (
    <label className="field"><span>{label}</span>
      <input type={type} value={f[k]} onChange={set(k)} aria-invalid={!!err[k]} {...rest} />
      {err[k] && <em className="err">{err[k]}</em>}
    </label>
  );
  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="brand"><Droplets size={28} /><h1>Smart Water Monitoring</h1></div>
        <p className="muted">Hostel tank level and water-quality monitoring</p>
        <div className="seg" role="tablist">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setErr({}); }}>Log in</button>
          <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => { setMode('signup'); setErr({}); }}>Sign up</button>
        </div>
        {mode === 'login' ? <Field k="id" label="Email or username" autoComplete="username" /> : (
          <>
            <Field k="name" label="Full name" />
            <Field k="email" label="Email" type="email" />
            <Field k="phone" label="Phone number (for SMS alerts)" type="tel" />
          </>
        )}
        <label className="field"><span>Password</span>
          <div className="pw">
            <input type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} aria-invalid={!!err.password} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            <button type="button" className="icon" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          {err.password && <em className="err">{err.password}</em>}
        </label>
        {mode === 'signup' && <Field k="confirm" label="Confirm password" type={show ? 'text' : 'password'} />}
        {err.form && <div className="banner red">{err.form}</div>}
        <button className="btn primary wide" disabled={busy}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
        <p className="muted center">
          {mode === 'login' ? 'New here? ' : 'Already registered? '}
          <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr({}); }}>{mode === 'login' ? 'Create an account' : 'Log in'}</button>
        </p>
        <p className="demo-note">Demo mode: accounts are stored in this browser only.</p>
      </form>
    </div>
  );
}
