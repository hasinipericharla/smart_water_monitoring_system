import { useState } from 'react';
import Auth from './pages/LoginSignup.jsx';
import HostelSelection from './pages/HostelSelection.jsx';
import DashboardLayout from './pages/DashboardLayout.jsx';
import { currentUser, logout } from './utils/auth.js';

export default function App() {
  const [user, setUser] = useState(currentUser());
  const [hostel, setHostel] = useState(null);
  const out = () => { logout(); setUser(null); setHostel(null); };
  if (!user) return <Auth onAuth={setUser} />;
  if (!hostel) return <HostelSelection user={user} onSelect={setHostel} onLogout={out} />;
  return <DashboardLayout user={user} hostel={hostel} onChangeHostel={() => setHostel(null)} onLogout={out} />;
}
