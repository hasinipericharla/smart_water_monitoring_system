import { useEffect, useState } from 'react';
import { Pencil, Plus, Send, Trash2, UserX, UserCheck } from 'lucide-react';
import { HOSTELS, STUDENT_ALERTS, WARDEN_ALERTS } from '../config.js';
import AddPersonModal from '../components/AddPersonModal.jsx';
import { notifyStudents, syncRecipients } from '../services/api.js';

const KEY = 'swm_people';
const SEED = [
  { id: 's1', type: 'warden', role: 'Chief Warden', name: 'Sample Chief Warden', phone: '+919000000001', email: '', hostelId: 'LH1', alerts: ['highLevel', 'lowLevel', 'tds', 'turb', 'offline', 'report'], active: true },
  { id: 's2', type: 'warden', role: 'Warden', name: 'Sample Warden', phone: '+919000000002', email: '', hostelId: 'LH1', alerts: ['highLevel', 'lowLevel', 'tds', 'turb', 'offline'], active: true },
  { id: 's3', type: 'student', name: 'Sample Student', phone: '+919000000003', studentId: 'S-0001', hostelId: 'LH1', alerts: ['lowLevel', 'conservation'], active: true },
];
const load = () => JSON.parse(localStorage.getItem(KEY) || 'null') || SEED;

export default function AlertRecipients({ hostel }) {
  const [people, setPeople] = useState(load);
  const [tab, setTab] = useState('warden');
  const [edit, setEdit] = useState(null); // person | {} for new
  const [note, setNote] = useState(null);
  const offline = () => setNote({ bad: true, text: 'Saved here, but the backend is not reachable, so SMS will not use this change.' });
  useEffect(() => { syncRecipients(people).catch(() => {}); }, []);
  const save = (next) => { setPeople(next); localStorage.setItem(KEY, JSON.stringify(next)); syncRecipients(next).catch(offline); };
  const sendStudents = async () => {
    if (!confirm(`Send a low-water SMS to active students of ${hostel.id}?`)) return;
    try {
      const r = await notifyStudents(hostel.id);
      setNote({ text: r.provider === 'console' ? `TEST MODE: ${r.sent} message(s) printed in the backend terminal. No real SMS was sent.` : `SMS accepted by the provider for ${r.sent} of ${r.total} students${r.failed ? ` (${r.failed} failed)` : ''}.` });
    } catch (e) { setNote({ bad: true, text: e.message }); }
  };
  const list = people.filter((p) => p.type === tab && p.hostelId === hostel.id);
  const cats = tab === 'warden' ? WARDEN_ALERTS : STUDENT_ALERTS;

  const submit = (p) => { save(p.id ? people.map((x) => (x.id === p.id ? p : x)) : [...people, { ...p, id: 'p' + Date.now(), active: true }]); setEdit(null); };
  const toggle = (p) => save(people.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
  const remove = (p) => { if (confirm(`Delete ${p.name}? This cannot be undone.`)) save(people.filter((x) => x.id !== p.id)); };

  return (
    <div className="card">
      <div className="row between wrap">
        <div className="seg">
          <button className={tab === 'warden' ? 'on' : ''} onClick={() => setTab('warden')}>Wardens</button>
          <button className={tab === 'student' ? 'on' : ''} onClick={() => setTab('student')}>Students</button>
        </div>
        <div className="row wrap">
          {tab === 'warden' && <button className="btn" onClick={sendStudents}><Send size={16} /> Send low-water SMS to students</button>}
          <button className="btn primary" onClick={() => setEdit({ type: tab })}><Plus size={16} /> Add new {tab}</button>
        </div>
      </div>
      <p className="muted small">SMS recipients for {hostel.id}. Delete the sample rows and add real numbers before using a live SMS provider.</p>
      {note && <div className={`banner ${note.bad ? 'red' : 'ok'}`}>{note.text}</div>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th>{tab === 'student' && <th>Student ID</th>}{tab === 'warden' && <th>Role</th>}<th>Phone</th><th>Hostel</th><th>Alerts</th><th>Status</th><th /></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={8} className="muted center">No {tab}s yet for {hostel.id}. Use “Add new {tab}”.</td></tr>}
            {list.map((p) => (
              <tr key={p.id} className={p.active ? '' : 'off'}>
                <td>{p.name}</td>{tab === 'student' && <td>{p.studentId || '—'}</td>}{tab === 'warden' && <td>{p.role}</td>}
                <td>{p.phone}</td><td>{p.hostelId}</td>
                <td className="small">{p.alerts.map((a) => cats[a]).filter(Boolean).join(', ') || 'None'}</td>
                <td><span className={`pill ${p.active ? 'green' : 'gray'}`}>{p.active ? 'Active' : 'Inactive'}</span></td>
                <td className="actions">
                  <button className="icon" aria-label="Edit" onClick={() => setEdit(p)}><Pencil size={16} /></button>
                  <button className="icon" aria-label={p.active ? 'Deactivate' : 'Activate'} onClick={() => toggle(p)}>{p.active ? <UserX size={16} /> : <UserCheck size={16} />}</button>
                  <button className="icon" aria-label="Delete" onClick={() => remove(p)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <AddPersonModal person={edit} hostelId={hostel.id} hostels={HOSTELS} cats={edit.type === 'warden' ? WARDEN_ALERTS : STUDENT_ALERTS} onSave={submit} onCancel={() => setEdit(null)} />}
    </div>
  );
}
