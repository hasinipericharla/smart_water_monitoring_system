
// import { useEffect, useMemo, useState } from 'react';
// import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
// import { Download } from 'lucide-react';
// import { GAP_MINUTES, PARAMS, THRESHOLDS } from '../config.js';
// import { addDays, dayKey } from '../utils/dateUtils.js';
// import { downloadCSV } from '../utils/exportUtils.js';
// import { getStoredReadings } from '../esp32Service.js';

// const REFS = {
//   level: [THRESHOLDS.waterLevel.low, THRESHOLDS.waterLevel.high],
//   tds: [THRESHOLDS.tds.upper, THRESHOLDS.tds.lower],
//   turb: [THRESHOLDS.turbidity.upper],
// };

// const BUCKET = 5 * 60 * 1000;        // one chart point every 5 minutes
// const IST_OFFSET = 330 * 60 * 1000;  // so axis ticks land on IST clock times

// export default function TrendChart({ hostel, readings }) {
//   const [storedReadings, setStoredReadings] = useState([]);
//   const [historyError, setHistoryError] = useState('');

//   // Load history from the database, and refresh every 5 minutes
//   useEffect(() => {
//     let active = true;

//     async function loadHistory() {
//       try {
//         const result = await getStoredReadings(hostel.id);
//         const list = Array.isArray(result) ? result : result.readings ?? [];

//         if (!active) return;

//         setStoredReadings(
//           list.map((r) => ({
//             ...r,
//             ts: typeof r.ts === 'number' ? r.ts : new Date(r.ts).getTime(),
//             valid: r.valid ?? true, // DB rows may not have a `valid` field
//           }))
//         );
//         setHistoryError('');
//       } catch (error) {
//         console.error('Failed to load database history:', error);
//         if (active) setHistoryError(error.message);
//       }
//     }

//     loadHistory();
//     const id = setInterval(loadHistory, BUCKET);

//     return () => {
//       active = false;
//       clearInterval(id);
//     };
//   }, [hostel.id]);

//   const [param, setParam] = useState('level');
//   const [range, setRange] = useState('24h');
//   const [from, setFrom] = useState(dayKey(addDays(new Date(), -3)));
//   const [to, setTo] = useState(dayKey(new Date()));
//   const [loading, setLoading] = useState(true);
//   useEffect(() => {
//     setLoading(true);
//     const t = setTimeout(() => setLoading(false), 250);
//     return () => clearTimeout(t);
//   }, [param, range, from, to, hostel.id]);

//   const { data, rows, ticks, domain, error } = useMemo(() => {
//     try {
//       const now = Date.now();
//       let a, b = now;
//       if (range === '6h') a = now - 6 * 36e5;
//       else if (range === '24h') a = now - 24 * 36e5;
//       else {
//         a = new Date(from + 'T00:00:00').getTime();
//         b = new Date(to + 'T23:59:59').getTime();
//         if (!(a <= b)) throw new Error('Start date must be on or before the end date.');
//       }

//       // Merge database + live readings, remove duplicates, keep only the selected range
//       const rows = Array.from(
//         new Map(
//           [...storedReadings, ...readings].map((r) => [`${r.ts}-${r.level}-${r.tds}-${r.turb}`, r])
//         ).values()
//       )
//         .sort((x, y) => x.ts - y.ts)
//         .filter((r) => r.ts >= a && r.ts <= b);

//       // Group into 5-minute buckets (average of valid values)
//       const buckets = new Map();
//       for (const r of rows) {
//         if (!r.valid || r[param] == null) continue;
//         const key = Math.floor(r.ts / BUCKET) * BUCKET;
//         const bk = buckets.get(key) ?? { sum: 0, n: 0 };
//         bk.sum += Number(r[param]);
//         bk.n += 1;
//         buckets.set(key, bk);
//       }

//       const data = [];
//       let prevTs = null;
//       for (const [ts, { sum, n }] of [...buckets.entries()].sort((x, y) => x[0] - y[0])) {
//         if (prevTs && ts - prevTs > GAP_MINUTES * 60000) data.push({ ts: prevTs + 1, v: null }); // break line across gaps
//         data.push({ ts, v: +(sum / n).toFixed(2) });
//         prevTs = ts;
//       }

//       // Evenly spaced axis ticks
//       const step = range === '6h' ? 30 * 60000 : range === '24h' ? 2 * 36e5 : 24 * 36e5;
//       const ticks = [];
//       for (let t = Math.ceil((a + IST_OFFSET) / step) * step - IST_OFFSET; t <= b; t += step) ticks.push(t);

//       return { data, rows, ticks, domain: [a, b] };
//     } catch (e) {
//       return { error: e.message, data: [], rows: [], ticks: [], domain: ['auto', 'auto'] };
//     }
//   }, [readings, storedReadings, param, range, from, to]);

//   const meta = PARAMS[param];

//   const fmtTick = (t) => {
//     const d = new Date(t);

//     return range === 'custom'
//       ? d.toLocaleDateString('en-IN', {
//           day: 'numeric',
//           month: 'short',
//           timeZone: 'Asia/Kolkata',
//         })
//       : d.toLocaleTimeString('en-IN', {
//           hour: '2-digit',
//           minute: '2-digit',
//           hour12: true,
//           timeZone: 'Asia/Kolkata',
//         });
//   };

//   const download = () =>
//     downloadCSV(`${hostel.id}_${meta.label.replace(' ', '')}_${range}.csv`, [
//       ['hostel', 'timestamp', meta.label, 'unit', 'valid'],
//       ...rows.map((r) => [hostel.id, new Date(r.ts).toISOString(), r[param], meta.unit, r.valid]),
//     ]);

//   return (
//     <div className="card">
//       <div className="row between wrap">
//         <div className="seg">
//           {Object.entries(PARAMS).map(([k, m]) => (
//             <button key={k} className={param === k ? 'on' : ''} onClick={() => setParam(k)}>
//               {m.label}
//             </button>
//           ))}
//         </div>
//         <div className="row wrap">
//           <div className="seg">
//             {[['6h', 'Last 6 hours'], ['24h', 'Last 24 hours'], ['custom', 'Custom']].map(([k, l]) => (
//               <button key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>
//                 {l}
//               </button>
//             ))}
//           </div>
//           <button className="btn" onClick={download} disabled={!rows.length}>
//             <Download size={16} /> Download
//           </button>
//         </div>
//       </div>

//       {range === 'custom' && (
//         <div className="row" style={{ margin: '10px 0' }}>
//           <label className="inline">
//             From <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
//           </label>
//           <label className="inline">
//             To{' '}
//             <input
//               type="date"
//               value={to}
//               min={from}
//               max={dayKey(new Date())}
//               onChange={(e) => setTo(e.target.value)}
//             />
//           </label>
//         </div>
//       )}

//       {historyError && <div className="state red">Could not load history: {historyError}</div>}

//       <div className="chart-box">
//         {loading ? (
//           <div className="state">Loading readings…</div>
//         ) : error ? (
//           <div className="state red">{error}</div>
//         ) : !rows.length ? (
//           <div className="state">No readings in this period.</div>
//         ) : (
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#e3eaf5" />
//               <XAxis
//                 dataKey="ts"
//                 type="number"
//                 scale="time"
//                 domain={domain}
//                 ticks={ticks}
//                 interval={0}
//                 tickFormatter={fmtTick}
//                 tick={{ fontSize: 12 }}
//               />
//               <YAxis
//                 tick={{ fontSize: 12 }}
//                 domain={param === 'level' ? [0, 100] : ['auto', 'auto']}
//                 unit={meta.unit === '%' ? '%' : ''}
//                 label={
//                   meta.unit === '%'
//                     ? undefined
//                     : { value: meta.unit, angle: -90, position: 'insideLeft', fontSize: 12 }
//                 }
//               />
//               <Tooltip
//                 labelFormatter={(t) =>
//                   new Date(t).toLocaleString('en-IN', {
//                     timeZone: 'Asia/Kolkata',
//                     day: '2-digit',
//                     month: 'short',
//                     year: 'numeric',
//                     hour: '2-digit',
//                     minute: '2-digit',
//                     second: '2-digit',
//                     hour12: true,
//                   })
//                 }
//                 formatter={(v) => [v == null ? 'No data' : `${v} ${meta.unit}`, meta.label]}
//               />
//               {REFS[param]
//                 .filter((x) => x != null)
//                 .map((y) => (
//                   <ReferenceLine key={y} y={y} stroke="#d64545" strokeDasharray="5 4" />
//                 ))}
//               <Line
//                 type="monotone"
//                 dataKey="v"
//                 stroke="#1d6fe8"
//                 strokeWidth={2}
//                 dot={false}
//                 connectNulls={false}
//                 isAnimationActive={false}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         )}
//       </div>

//       <p className="muted small">
//         Each point is a 5-minute average. Dashed red lines show configured limits. Line breaks mean missing or invalid
//         readings.
//       </p>
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Download } from 'lucide-react';
import { GAP_MINUTES, PARAMS, THRESHOLDS } from '../config.js';
import { addDays, dayKey } from '../utils/dateUtils.js';
import { downloadCSV } from '../utils/exportUtils.js';
import { getStoredReadings } from '../esp32Service.js';

const REFS = {
  level: [THRESHOLDS.waterLevel.low, THRESHOLDS.waterLevel.high],
  tds: [THRESHOLDS.tds.upper, THRESHOLDS.tds.lower],
  turb: [THRESHOLDS.turbidity.upper],
};

const BUCKET = 5 * 60 * 1000;        // one chart point every 5 minutes
const IST_OFFSET = 330 * 60 * 1000;  // so axis ticks land on IST clock times

// Return the first non-empty value among the possible field names, as a number
const pick = (r, keys) => {
  for (const k of keys) {
    if (r[k] != null && r[k] !== '') return Number(r[k]);
  }
  return null;
};

// Make database rows and live rows use the same field names
const normalize = (r) => ({
  ...r,
  ts: typeof r.ts === 'number' ? r.ts : new Date(r.ts).getTime(),
  level: pick(r, ['level', 'waterLevel', 'water_level']),
  tds: pick(r, ['tds', 'TDS', 'tdsValue']),
  turb: pick(r, ['turb', 'turbidity', 'Turbidity', 'ntu']),
  valid: r.valid ?? true, // DB rows may not have a `valid` field
});

export default function TrendChart({ hostel, readings }) {
  const [storedReadings, setStoredReadings] = useState([]);
  const [historyError, setHistoryError] = useState('');

  // Load history from the database, and refresh every 5 minutes
  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const result = await getStoredReadings(hostel.id);
        const list = Array.isArray(result) ? result : result.readings ?? [];

        // Debug: check the real field names coming from the database (remove when done)
        console.log('DB sample:', list[0]);

        if (!active) return;

        setStoredReadings(list.map(normalize));
        setHistoryError('');
      } catch (error) {
        console.error('Failed to load database history:', error);
        if (active) setHistoryError(error.message);
      }
    }

    loadHistory();
    const id = setInterval(loadHistory, BUCKET);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [hostel.id]);

  const [param, setParam] = useState('level');
  const [range, setRange] = useState('24h');
  const [from, setFrom] = useState(dayKey(addDays(new Date(), -3)));
  const [to, setTo] = useState(dayKey(new Date()));
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, [param, range, from, to, hostel.id]);

  const { data, rows, ticks, domain, error } = useMemo(() => {
    try {
      const now = Date.now();
      let a, b = now;
      if (range === '6h') a = now - 6 * 36e5;
      else if (range === '24h') a = now - 24 * 36e5;
      else {
        a = new Date(from + 'T00:00:00').getTime();
        b = new Date(to + 'T23:59:59').getTime();
        if (!(a <= b)) throw new Error('Start date must be on or before the end date.');
      }

      // Merge database + live readings, remove duplicates, keep only the selected range
      const rows = Array.from(
        new Map(
          [...storedReadings, ...readings.map(normalize)].map((r) => [
            `${r.ts}-${r.level}-${r.tds}-${r.turb}`,
            r,
          ])
        ).values()
      )
        .sort((x, y) => x.ts - y.ts)
        .filter((r) => r.ts >= a && r.ts <= b);

      // Group into 5-minute buckets (average of valid values)
      const buckets = new Map();
      for (const r of rows) {
        if (r.valid === false || r[param] == null || Number.isNaN(r[param])) continue;
        const key = Math.floor(r.ts / BUCKET) * BUCKET;
        const bk = buckets.get(key) ?? { sum: 0, n: 0 };
        bk.sum += Number(r[param]);
        bk.n += 1;
        buckets.set(key, bk);
      }

      const data = [];
      let prevTs = null;
      for (const [ts, { sum, n }] of [...buckets.entries()].sort((x, y) => x[0] - y[0])) {
        if (prevTs && ts - prevTs > GAP_MINUTES * 60000) data.push({ ts: prevTs + 1, v: null }); // break line across gaps
        data.push({ ts, v: +(sum / n).toFixed(2) });
        prevTs = ts;
      }

      // Evenly spaced axis ticks
      const step = range === '6h' ? 30 * 60000 : range === '24h' ? 2 * 36e5 : 24 * 36e5;
      const ticks = [];
      for (let t = Math.ceil((a + IST_OFFSET) / step) * step - IST_OFFSET; t <= b; t += step) ticks.push(t);

      return { data, rows, ticks, domain: [a, b] };
    } catch (e) {
      return { error: e.message, data: [], rows: [], ticks: [], domain: ['auto', 'auto'] };
    }
  }, [readings, storedReadings, param, range, from, to]);

  const meta = PARAMS[param];

  const fmtTick = (t) => {
    const d = new Date(t);

    return range === 'custom'
      ? d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          timeZone: 'Asia/Kolkata',
        })
      : d.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        });
  };

  const download = () =>
    downloadCSV(`${hostel.id}_${meta.label.replace(' ', '')}_${range}.csv`, [
      ['hostel', 'timestamp', meta.label, 'unit', 'valid'],
      ...rows.map((r) => [hostel.id, new Date(r.ts).toISOString(), r[param], meta.unit, r.valid]),
    ]);

  return (
    <div className="card">
      <div className="row between wrap">
        <div className="seg">
          {Object.entries(PARAMS).map(([k, m]) => (
            <button key={k} className={param === k ? 'on' : ''} onClick={() => setParam(k)}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="row wrap">
          <div className="seg">
            {[['6h', 'Last 6 hours'], ['24h', 'Last 24 hours'], ['custom', 'Custom']].map(([k, l]) => (
              <button key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>
                {l}
              </button>
            ))}
          </div>
          <button className="btn" onClick={download} disabled={!rows.length}>
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      {range === 'custom' && (
        <div className="row" style={{ margin: '10px 0' }}>
          <label className="inline">
            From <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="inline">
            To{' '}
            <input
              type="date"
              value={to}
              min={from}
              max={dayKey(new Date())}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
      )}

      {historyError && <div className="state red">Could not load history: {historyError}</div>}

      <div className="chart-box">
        {loading ? (
          <div className="state">Loading readings…</div>
        ) : error ? (
          <div className="state red">{error}</div>
        ) : !rows.length ? (
          <div className="state">No readings in this period.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3eaf5" />
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={domain}
                ticks={ticks}
                interval={0}
                tickFormatter={fmtTick}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={param === 'level' ? [0, 100] : ['auto', 'auto']}
                unit={meta.unit === '%' ? '%' : ''}
                label={
                  meta.unit === '%'
                    ? undefined
                    : { value: meta.unit, angle: -90, position: 'insideLeft', fontSize: 12 }
                }
              />
              <Tooltip
                labelFormatter={(t) =>
                  new Date(t).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })
                }
                formatter={(v) => [v == null ? 'No data' : `${v} ${meta.unit}`, meta.label]}
              />
              {REFS[param]
                .filter((x) => x != null)
                .map((y) => (
                  <ReferenceLine key={y} y={y} stroke="#d64545" strokeDasharray="5 4" />
                ))}
              <Line
                type="monotone"
                dataKey="v"
                stroke="#1d6fe8"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="muted small">
        Each point is a 5-minute average. Dashed red lines show configured limits. Line breaks mean missing or invalid
        readings.
      </p>
    </div>
  );
}