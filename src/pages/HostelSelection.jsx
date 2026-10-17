import { Building2, LogOut } from 'lucide-react';
import { HOSTELS } from '../config.js';
import { getReadings } from '../utils/mockData.js';
import { latestValid } from '../utils/calculations.js';
import { evaluateStatus,qualityOf, statusColor, statusText } from '../utils/statusRules.js';

export default function HostelSelection({ user, onSelect, onLogout }) {
  const groups = [...new Set(HOSTELS.map((h) => h.category))];
  return (
    <div className="page-wrap">
      <header className="topbar">
        <div><h1>Select a hostel</h1><p className="muted">Signed in as {user.name}</p></div>
        <button className="btn" onClick={onLogout}><LogOut size={16} /> Log out</button>
      </header>
      <p className="demo-note">Readings shown are simulated until hardware is connected.</p>
      {groups.map((g) => (
        <section key={g}>
          <h2>{g}s</h2>
          <div className="hostel-grid">
            {HOSTELS.filter((h) => h.category === g).map((h) => {
              // const r = latestValid(getReadings(h.id), 'level');
                const rd = getReadings(h.id), r = latestValid(rd, 'level');
  const q = qualityOf(latestValid(rd, 'tds'), latestValid(rd, 'turb'));
              const st = evaluateStatus('level', r?.level, r?.ts);
              return (
                <button key={h.id} className={`card hostel ${statusColor(st)}`} onClick={() => onSelect(h)}>
                  <Building2 size={22} />
                  <strong>{h.id}</strong>
                  <span className="muted">{h.category}</span>
                  <span className="pill">{r ? `${r.level.toFixed(0)}% · ${statusText('level', st)}` : 'No data'}</span>
                    <span className={`pill ${q === 'good' ? 'green' : q === 'bad' ? 'red' : 'gray'}`}>Quality: {{ good: 'Good', bad: 'Bad', unknown: 'Not assessed' }[q]}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
