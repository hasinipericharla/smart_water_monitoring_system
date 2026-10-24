import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { PARAMS, TANK } from '../config.js';
import { getReadings } from '../utils/mockData.js';
import { groupByDay, stats } from '../utils/calculations.js';
import { addDays, dayKey, fmtDate, mondayOf, WEEKDAYS } from '../utils/dateUtils.js';
import { downloadCSV } from '../utils/exportUtils.js';

export default function WeeklyReport({ hostel }) {
  const readings = getReadings(hostel.id), byDay = groupByDay(readings);
  const [param, setParam] = useState('level');
  const [weekStart, setWeekStart] = useState(mondayOf(new Date()));
  const [view, setView] = useState('bar');
  const meta = PARAMS[param], today = dayKey(new Date());
  const days = WEEKDAYS.map((name, i) => {
    const d = addDays(weekStart, i), k = dayKey(d), future = k > today;
    const s = future ? null : stats(byDay[k] || [], param);
    return { name: name.slice(0, 3), full: name, date: d, k, s, v: s ? +s.avg.toFixed(meta.dec + 1) : null, future };
  });
  const all = days.flatMap((d) => byDay[d.k] || []);
  const week = stats(all, param);
  const label = `${fmtDate(weekStart)} – ${fmtDate(addDays(weekStart, 6))}`;
  const thisMon = mondayOf(new Date());
  const preset = dayKey(weekStart) === dayKey(thisMon) ? 'cur' : 'prev';

  // CSV: daily averages for the selected week (same logic as the Overview CSV).
  const csv = () => {
    const avg = (rows, key) => {
      const s = stats(rows, key);
      return s ? Number(s.avg.toFixed(PARAMS[key].dec + 1)) : 'No data';
    };

    const dailyRows = days
      .filter((d) => !d.future && byDay[d.k])
      .map((d) => {
        const rows = byDay[d.k];
        const validCount = rows.filter((r) => r.valid).length;
        return [
          hostel.id,
          TANK.id,
          d.k,
          avg(rows, 'level'),
          avg(rows, 'turb'),
          avg(rows, 'tds'),
          validCount,
        ];
      });

    downloadCSV(`${hostel.id}_weekly_${dayKey(weekStart)}.csv`, [
      ['hostel', 'tank', 'date', 'water_level', 'turbidity', 'tds', 'valid_readings'],
      ...dailyRows,
    ]);
  };

  const tip = ({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0].payload;
    return <div className="tip"><b>{d.full}</b><div>{d.v == null ? 'No data' : `${d.v} ${meta.unit}`}</div>{d.s && <div className="muted small">{d.s.n} readings</div>}</div>; };
  const axis = <><CartesianGrid strokeDasharray="3 3" stroke="#e3eaf5" /><XAxis dataKey="name" /><YAxis unit={meta.unit === '%' ? '%' : ''} domain={param === 'level' ? [0, 100] : [0, 'auto']} label={meta.unit === '%' ? undefined : { value: meta.unit, angle: -90, position: 'insideLeft', fontSize: 12 }} /><Tooltip content={tip} /></>;

  return (
    <>
      <div className="seg tabs">{Object.entries(PARAMS).map(([k, m]) => <button key={k} className={param === k ? 'on' : ''} onClick={() => setParam(k)}>{m.label}</button>)}</div>
      <div className="card">
        <div className="row between wrap">
          <div className="seg">
            <button className={preset === 'cur' ? 'on' : ''} onClick={() => setWeekStart(thisMon)}>Current week</button>
            <button className={preset === 'prev' ? 'on' : ''} onClick={() => setWeekStart(addDays(thisMon, -7))}>Previous week</button>
          </div>
          <div className="row">
            <div className="seg"><button className={view === 'bar' ? 'on' : ''} onClick={() => setView('bar')}>Bar</button><button className={view === 'line' ? 'on' : ''} onClick={() => setView('line')}>Line</button></div>
            <button className="btn" onClick={csv}><Download size={16} /> CSV</button>
          </div>
        </div>
        <h3>{meta.label} – daily average ({meta.unit})</h3>
        <p className="muted small">{label} · Monday to Sunday · {hostel.id}</p>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            {view === 'bar'
              ? <BarChart data={days}>{axis}<Bar dataKey="v" fill="#1d6fe8" radius={[6, 6, 0, 0]} /></BarChart>
              : <LineChart data={days}>{axis}<Line dataKey="v" stroke="#1d6fe8" strokeWidth={2} connectNulls={false} /></LineChart>}
          </ResponsiveContainer>
        </div>
        <div className="daychips">{days.map((d) => <span key={d.k} className={d.v == null ? 'nodata' : ''}>{d.name}: {d.v == null ? 'No data' : d.v}</span>)}</div>
      </div>
      <div className="cards3">
        {[['Weekly average', week?.avg.toFixed(meta.dec + 1)], ['Minimum', week?.min], ['Maximum', week?.max]].map(([t, v]) => (
          <div key={t} className="card"><span className="muted">{t}</span><div className="big sm">{v ?? '—'}<small>{v != null ? meta.unit : ''}</small></div><span className="muted small">{week ? `${week.n} valid readings · ${days.filter((d) => d.s).length}/7 days with data` : 'No data available'}</span></div>
        ))}
      </div>
    </>
  );
}