import { useState } from 'react';

export default function AddPersonModal({ person, hostelId, hostels, cats, onSave, onCancel }) {
  const isW = person.type === 'warden';
  const [f, setF] = useState({ name: '', phone: '', email: '', studentId: '', role: 'Warden', hostelId, alerts: Object.keys(cats).filter((k) => k !== 'report' && k !== 'supply'), ...person });
  const [err, setErr] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (k) => setF({ ...f, alerts: f.alerts.includes(k) ? f.alerts.filter((x) => x !== k) : [...f.alerts, k] });
  const submit = (e) => {
    e.preventDefault();
    const x = {};
    if (!f.name.trim()) x.name = 'Enter the full name.';
    if (!/^\+?\d{10,13}$/.test(f.phone.replace(/[\s-]/g, ''))) x.phone = 'Enter a valid phone number (10–13 digits).';
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Enter a valid email address.';
    setErr(x);
    if (!Object.keys(x).length) onSave({ ...f, name: f.name.trim(), phone: f.phone.replace(/[\s-]/g, '') });
  };
  return (
    <div className="overlay" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <h3>{person.id ? 'Edit' : 'Add new'} {person.type}</h3>
        <label className="field"><span>Full name</span><input value={f.name} onChange={set('name')} />{err.name && <em className="err">{err.name}</em>}</label>
        <label className="field"><span>Phone number</span><input value={f.phone} onChange={set('phone')} placeholder="+91XXXXXXXXXX" />{err.phone && <em className="err">{err.phone}</em>}</label>
        {isW && <label className="field"><span>Email (optional)</span><input value={f.email} onChange={set('email')} />{err.email && <em className="err">{err.email}</em>}</label>}
        {isW && <label className="field"><span>Role</span><select value={f.role} onChange={set('role')}><option>Warden</option><option>Chief Warden</option></select></label>}
        {!isW && <label className="field"><span>Student ID (optional)</span><input value={f.studentId} onChange={set('studentId')} /></label>}
        <label className="field"><span>Assigned hostel</span><select value={f.hostelId} onChange={set('hostelId')}>{hostels.map((h) => <option key={h.id}>{h.id}</option>)}</select></label>
        <fieldset><legend>Alert categories</legend>
          {Object.entries(cats).map(([k, l]) => <label key={k} className="check"><input type="checkbox" checked={f.alerts.includes(k)} onChange={() => toggle(k)} /> {l}</label>)}
        </fieldset>
        <div className="row end"><button type="button" className="btn" onClick={onCancel}>Cancel</button><button className="btn primary">Save</button></div>
      </form>
    </div>
  );
}
