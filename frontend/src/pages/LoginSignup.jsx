// import { useEffect, useState } from 'react';
// import { Droplets, Eye, EyeOff } from 'lucide-react';
// import { login, resendOtp, signup, verifyOtp } from '../utils/auth.js';

// export default function LoginSignup({ onAuth }) {
//   const [mode, setMode] = useState('login'); // login | signup | otp
//   const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '', otp: '' });
//   const [show, setShow] = useState(false);
//   const [err, setErr] = useState({});
//   const [info, setInfo] = useState('');
//   const [busy, setBusy] = useState(false);
//   const [wait, setWait] = useState(0); // seconds until "Resend code" is allowed
//   useEffect(() => { if (wait > 0) { const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); } }, [wait]);

//   const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
//   const go = (m) => { setMode(m); setErr({}); setInfo(''); };
//   // Called as a function (not used as a <Component/>) so inputs keep focus while typing.
//   const field = (k, label, type = 'text', extra = {}) => (
//     <label className="field"><span>{label}</span>
//       <input type={type} value={f[k]} onChange={set(k)} aria-invalid={!!err[k]} {...extra} />
//       {err[k] && <em className="err">{err[k]}</em>}
//     </label>
//   );

//   const validate = () => {
//     const e = {};
//     const okEmail = /^\S+@\S+\.\S+$/.test(f.email.trim());
//     if (mode === 'login') {
//       if (!okEmail) e.email = 'Enter a valid email address.';
//       if (!f.password) e.password = 'Enter your password.';
//     } else if (mode === 'signup') {
//       if (f.name.trim().length < 2) e.name = 'Enter your full name.';
//       if (!okEmail) e.email = 'Enter a valid email address.';
//       if (!/^\+?\d{10,13}$/.test(f.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a phone number with 10–13 digits.';
//       if (f.password.length < 8) e.password = 'Use at least 8 characters.';
//       if (f.confirm !== f.password) e.confirm = 'Passwords do not match.';
//     } else if (!/^\d{6}$/.test(f.otp)) e.otp = 'Enter the 6-digit code.';
//     return e;
//   };

//   const submit = async (ev) => {
//     ev.preventDefault();
//     const e = validate(); setErr(e); setInfo('');
//     if (Object.keys(e).length) return;
//     setBusy(true);
//     try {
//       const email = f.email.trim();
//       if (mode === 'login') onAuth(await login(email, f.password));
//       else if (mode === 'signup') { const r = await signup({ name: f.name.trim(), email, phone: f.phone, password: f.password }); setInfo(r.message); setWait(60); setMode('otp'); }
//       else onAuth(await verifyOtp(email, f.otp));
//     } catch (x) { setErr({ form: x.message }); }
//     setBusy(false);
//   };
//   const resend = async () => {
//     setErr({}); setBusy(true);
//     try { const r = await resendOtp(f.email.trim()); setInfo(r.message); setWait(60); } catch (x) { setErr({ form: x.message }); }
//     setBusy(false);
//   };

//   return (
//     <div className="auth-wrap">
//       <form className="auth-card" onSubmit={submit} noValidate>
//         <div className="brand"><Droplets size={28} /><h1>Smart Water Monitoring</h1></div>
//         <p className="muted">Hostel tank level and water-quality monitoring</p>

//         {mode !== 'otp' && (
//           <div className="seg" role="tablist">
//             <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => go('login')}>Log in</button>
//             <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => go('signup')}>Sign up</button>
//           </div>
//         )}

//         {mode === 'signup' && <>{field('name', 'Full name')}{field('email', 'Email', 'email')}{field('phone', 'Phone number (for SMS alerts)', 'tel')}</>}
//         {mode === 'login' && field('email', 'Email', 'email', { autoComplete: 'username' })}

//         {mode !== 'otp' && (
//           <label className="field"><span>Password</span>
//             <div className="pw">
//               <input type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} aria-invalid={!!err.password} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
//               <button type="button" className="icon" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
//             </div>
//             {err.password && <em className="err">{err.password}</em>}
//           </label>
//         )}
//         {mode === 'signup' && field('confirm', 'Confirm password', show ? 'text' : 'password')}

//         {mode === 'otp' && (
//           <>
//             <p>We sent a 6-digit code to <b>{f.email.trim()}</b>. It expires in 10 minutes.</p>
//             <label className="field"><span>Verification code</span>
//               <input value={f.otp} inputMode="numeric" maxLength={6} autoComplete="one-time-code" aria-invalid={!!err.otp}
//                 onChange={(e) => setF({ ...f, otp: e.target.value.replace(/\D/g, '') })} />
//               {err.otp && <em className="err">{err.otp}</em>}
//             </label>
//           </>
//         )}

//         {info && <div className="banner ok">{info}</div>}
//         {err.form && <div className="banner red">{err.form}</div>}
//         <button className="btn primary wide" disabled={busy}>{mode === 'login' ? 'Log in' : mode === 'signup' ? 'Send verification code' : 'Verify and create account'}</button>

//         {mode === 'otp' ? (
//           <p className="muted center">
//             <button type="button" className="link" disabled={wait > 0 || busy} onClick={resend}>{wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}</button>
//             {' · '}<button type="button" className="link" onClick={() => go('signup')}>Change details</button>
//           </p>
//         ) : (
//           <p className="muted center">
//             {mode === 'login' ? 'New here? ' : 'Already registered? '}
//             <button type="button" className="link" onClick={() => go(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create an account' : 'Log in'}</button>
//           </p>
//         )}
//       </form>
//     </div>
//   );
// }
import { useEffect, useState } from 'react';
import { Droplets, Eye, EyeOff } from 'lucide-react';
import {
  forgotPassword,
  login,
  resendOtp,
  resetPassword,
  signup,
  verifyOtp,
} from '../utils/auth.js';

export default function LoginSignup({ onAuth }) {
  const [mode, setMode] = useState('login'); // login | signup | otp | forgot | reset
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '', otp: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState({});
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0); // seconds until "Resend code" is allowed
  useEffect(() => { if (wait > 0) { const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); } }, [wait]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = (m) => { setMode(m); setErr({}); setInfo(''); };
  // Called as a function (not used as a <Component/>) so inputs keep focus while typing.
  const field = (k, label, type = 'text', extra = {}) => (
    <label className="field"><span>{label}</span>
      <input type={type} value={f[k]} onChange={set(k)} aria-invalid={!!err[k]} {...extra} />
      {err[k] && <em className="err">{err[k]}</em>}
    </label>
  );

  const validate = () => {
    const e = {};
    const okEmail = /^\S+@\S+\.\S+$/.test(f.email.trim());
    if (mode === 'login') {
      if (!okEmail) e.email = 'Enter a valid email address.';
      if (!f.password) e.password = 'Enter your password.';
    } else if (mode === 'signup') {
      if (f.name.trim().length < 2) e.name = 'Enter your full name.';
      if (!okEmail) e.email = 'Enter a valid email address.';
      if (!/^\+?\d{10,13}$/.test(f.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a phone number with 10–13 digits.';
      if (f.password.length < 8) e.password = 'Use at least 8 characters.';
      if (f.confirm !== f.password) e.confirm = 'Passwords do not match.';
    } else if (mode === 'forgot') {
      if (!okEmail) e.email = 'Enter a valid email address.';
    } else if (mode === 'reset') {
      if (!/^\d{6}$/.test(f.otp)) e.otp = 'Enter the 6-digit code.';
      if (f.password.length < 8) e.password = 'Use at least 8 characters.';
      if (f.confirm !== f.password) e.confirm = 'Passwords do not match.';
    } else if (!/^\d{6}$/.test(f.otp)) e.otp = 'Enter the 6-digit code.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate(); setErr(e); setInfo('');
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const email = f.email.trim();
      if (mode === 'login') onAuth(await login(email, f.password));
      else if (mode === 'signup') { const r = await signup({ name: f.name.trim(), email, phone: f.phone, password: f.password }); setInfo(r.message); setWait(60); setMode('otp'); }
      else if (mode === 'forgot') {
        const r = await forgotPassword(email);
        setInfo(r?.message || 'If this email is registered, a reset code has been sent.');
        setWait(60);
        setF({ ...f, otp: '', password: '', confirm: '' });
        setMode('reset');
      } else if (mode === 'reset') {
        const r = await resetPassword(email, f.otp, f.password);
        setF({ ...f, otp: '', password: '', confirm: '' });
        setMode('login');
        setInfo(r?.message || 'Password updated. Log in with your new password.');
      } else onAuth(await verifyOtp(email, f.otp));
    } catch (x) { setErr({ form: x.message }); }
    setBusy(false);
  };

  const resend = async () => {
    setErr({}); setBusy(true);
    try {
      const r = mode === 'reset' ? await forgotPassword(f.email.trim()) : await resendOtp(f.email.trim());
      setInfo(r?.message || 'A new code has been sent.');
      setWait(60);
    } catch (x) { setErr({ form: x.message }); }
    setBusy(false);
  };

  const showTabs = mode === 'login' || mode === 'signup';
  const showPassword = mode === 'login' || mode === 'signup' || mode === 'reset';
  const showOtp = mode === 'otp' || mode === 'reset';

  const buttonLabel = {
    login: 'Log in',
    signup: 'Send verification code',
    otp: 'Verify and create account',
    forgot: 'Send reset code',
    reset: 'Reset password',
  }[mode];

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="brand"><Droplets size={28} /><h1>Smart Water Monitoring</h1></div>
        <p className="muted">Hostel tank level and water-quality monitoring</p>

        {showTabs && (
          <div className="seg" role="tablist">
            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => go('login')}>Log in</button>
            <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => go('signup')}>Sign up</button>
          </div>
        )}

        {mode === 'signup' && <>{field('name', 'Full name')}{field('email', 'Email', 'email')}{field('phone', 'Phone number (for SMS alerts)', 'tel')}</>}
        {mode === 'login' && field('email', 'Email', 'email', { autoComplete: 'username' })}

        {mode === 'forgot' && (
          <>
            <p>Enter your registered email and we will send you a 6-digit reset code.</p>
            {field('email', 'Email', 'email', { autoComplete: 'username' })}
          </>
        )}

        {mode === 'reset' && (
          <p>We sent a 6-digit reset code to <b>{f.email.trim()}</b>. It expires in 10 minutes.</p>
        )}

        {showOtp && (
          <label className="field"><span>{mode === 'reset' ? 'Reset code' : 'Verification code'}</span>
            <input value={f.otp} inputMode="numeric" maxLength={6} autoComplete="one-time-code" aria-invalid={!!err.otp}
              onChange={(e) => setF({ ...f, otp: e.target.value.replace(/\D/g, '') })} />
            {err.otp && <em className="err">{err.otp}</em>}
          </label>
        )}

        {showPassword && (
          <label className="field"><span>{mode === 'reset' ? 'New password' : 'Password'}</span>
            <div className="pw">
              <input type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} aria-invalid={!!err.password} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" className="icon" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {err.password && <em className="err">{err.password}</em>}
          </label>
        )}
        {(mode === 'signup' || mode === 'reset') && field('confirm', mode === 'reset' ? 'Confirm new password' : 'Confirm password', show ? 'text' : 'password')}

        {mode === 'login' && (
          <p className="muted" style={{ textAlign: 'right', margin: '-4px 0 8px' }}>
            <button type="button" className="link" onClick={() => go('forgot')}>Forgot password?</button>
          </p>
        )}

        {info && <div className="banner ok">{info}</div>}
        {err.form && <div className="banner red">{err.form}</div>}
        <button className="btn primary wide" disabled={busy}>{buttonLabel}</button>

        {mode === 'otp' && (
          <p className="muted center">
            <button type="button" className="link" disabled={wait > 0 || busy} onClick={resend}>{wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}</button>
            {' · '}<button type="button" className="link" onClick={() => go('signup')}>Change details</button>
          </p>
        )}

        {mode === 'reset' && (
          <p className="muted center">
            <button type="button" className="link" disabled={wait > 0 || busy} onClick={resend}>{wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}</button>
            {' · '}<button type="button" className="link" onClick={() => go('forgot')}>Change email</button>
          </p>
        )}

        {mode === 'forgot' && (
          <p className="muted center">
            <button type="button" className="link" onClick={() => go('login')}>Back to log in</button>
          </p>
        )}

        {showTabs && (
          <p className="muted center">
            {mode === 'login' ? 'New here? ' : 'Already registered? '}
            <button type="button" className="link" onClick={() => go(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create an account' : 'Log in'}</button>
          </p>
        )}
      </form>
    </div>
  );
}