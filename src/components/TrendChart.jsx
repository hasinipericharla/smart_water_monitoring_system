import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Download } from 'lucide-react';
import { GAP_MINUTES, PARAMS, THRESHOLDS } from '../config.js';
import { addDays, dayKey } from '../utils/dateUtils.js';
import { downloadCSV } from '../utils/exportUtils.js';

const REFS = {
  level: [THRESHOLDS.waterLevel.low, THRESHOLDS.waterLevel.high],
  tds: [THRESHOLDS.tds.upper, THRESHOLDS.tds.lower],
  turb: [THRESHOLDS.turbidity.upper],
};

export default function TrendChart({ hostel, readings }) {
  const [param, setParam] = useState('level');
  const [range, setRange] = useState('24h');
  const [from, setFrom] = useState(dayKey(addDays(new Date(), -3)));
  const [to, setTo] = useState(dayKey(new Date()));
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 250); return () => clearTimeout(t); }, [param, range, from, to, hostel.id]);

  const { data, rows, error } = useMemo(() => {
    try {
      const now = Date.now();
      let a, b = now;
      if (range === '6h') a = now - 6 * 36e5;
      else if (range === '24h') a = now - 24 * 36e5;
      else { a = new Date(from + 'T00:00:00').getTime(); b = new Date(to + 'T23:59:59').getTime(); if (!(a <= b)) throw new Error('Start date must be on or before the end date.'); }
      const rows = readings.filter((r) => r.ts >= a && r.ts <= b);
      const data = []; let prev = null;
      for (const r of rows) {
        if (prev && r.ts - prev.ts > GAP_MINUTES * 60000) data.push({ ts: prev.ts + 1, v: null }); // break line across gaps
        data.push({ ts: r.ts, v: r.valid ? r[param] : null });
        prev = r;
      }
      return { data, rows };
    } catch (e) { return { error: e.message, data: [], rows: [] }; }
  }, [readings, param, range, from, to]);

  const meta = PARAMS[param];
  const fmtTick = (t) => { const d = new Date(t); return range === 'custom' ? d.toLocaleDateString([], { day: 'numeric', month: 'short' }) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  const download = () => downloadCSV(`${hostel.id}_${meta.label.replace(' ', '')}_${range}.csv`,
    [['hostel', 'timestamp', meta.label, 'unit', 'valid'], ...rows.map((r) => [hostel.id, new Date(r.ts).toISOString(), r[param], meta.unit, r.valid])]);

  return (
    <div className="card">
      <div className="row between wrap">
        <div className="seg">{Object.entries(PARAMS).map(([k, m]) => <button key={k} className={param === k ? 'on' : ''} onClick={() => setParam(k)}>{m.label}</button>)}</div>
        <div className="row wrap">
          <div className="seg">{[['6h', 'Last 6 hours'], ['24h', 'Last 24 hours'], ['custom', 'Custom']].map(([k, l]) => <button key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{l}</button>)}</div>
          <button className="btn" onClick={download} disabled={!rows.length}><Download size={16} /> Download</button>
        </div>
      </div>
      {range === 'custom' && (
        <div className="row" style={{ margin: '10px 0' }}>
          <label className="inline">From <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="inline">To <input type="date" value={to} min={from} max={dayKey(new Date())} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
      )}
      <div className="chart-box">
        {loading ? <div className="state">Loading readings…</div>
          : error ? <div className="state red">{error}</div>
          : !rows.length ? <div className="state">No readings in this period.</div>
          : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3eaf5" />
                <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={fmtTick} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={param === 'level' ? [0, 100] : ['auto', 'auto']} unit={meta.unit === '%' ? '%' : ''} label={meta.unit === '%' ? undefined : { value: meta.unit, angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} formatter={(v) => [v == null ? 'No data' : `${v} ${meta.unit}`, meta.label]} />
                {REFS[param].filter((x) => x != null).map((y) => <ReferenceLine key={y} y={y} stroke="#d64545" strokeDasharray="5 4" />)}
                <Line type="monotone" dataKey="v" stroke="#1d6fe8" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
      </div>
      <p className="muted small">Dashed red lines show configured limits. Line breaks mean missing or invalid readings.</p>
    </div>
  );
}
