import { useState } from 'react';
import { LayoutDashboard, BellRing, BarChart3, LogOut, Droplets } from 'lucide-react';
import Overview from './Overview.jsx';
import AlertRecipients from './AlertRecipients.jsx';
import WeeklyReport from './WeeklyReport.jsx';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'alerts', label: 'Whom to Send Alerts', icon: BellRing },
  { id: 'weekly', label: 'Weekly Report', icon: BarChart3 },
];

export default function DashboardLayout({ user, hostel, onChangeHostel, onLogout }) {
  const [page, setPage] = useState('overview');
  return (
    <div className="dash">
      <aside className="sidebar">
        <div className="brand sm"><Droplets size={22} /><span>Water Monitor</span></div>
        <nav>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? 'on' : ''} onClick={() => setPage(id)} title={label}><Icon size={20} /><span>{label}</span></button>
          ))}
          <button onClick={onLogout} title="Logout"><LogOut size={20} /><span>Logout</span></button>
        </nav>
      </aside>
      <main className="content">
        <header className="topbar">
          <div><h1>{hostel.id} <small>{hostel.category}</small></h1><p className="muted">{user.name}</p></div>
          <div className="row"><span className="badge">Live data</span><button className="btn" onClick={onChangeHostel}>Change hostel</button></div>
        </header>
        {page === 'overview' && <Overview hostel={hostel} />}
        {page === 'alerts' && <AlertRecipients hostel={hostel} />}
        {page === 'weekly' && <WeeklyReport hostel={hostel} />}
      </main>
    </div>
  );
}
