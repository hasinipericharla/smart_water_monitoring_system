import { X } from 'lucide-react';
import { PARAMS } from '../config.js';
import { dayKey, fmtDate, fmtDateTime } from '../utils/dateUtils.js';
import { groupByDay, latestValid, stats } from '../utils/calculations.js';
import { evaluateStatus, statusColor, statusText } from '../utils/statusRules.js';

export default function DailyReadingsModal({ date, readings, onClose }) {
  const k = dayKey(date), isToday = k === dayKey(new Date());
  const rows = groupByDay(readings)[k] || [];
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h"><h3>{fmtDate(date)}</h3><button className="icon" aria-label="Close" onClick={onClose}><X size={20} /></button></div>
        <p className="muted">{isToday ? 'Latest valid readings today' : 'Daily averages'}</p>
        {Object.entries(PARAMS).map(([p, meta]) => {
          let body;
          if (isToday) {
            const r = latestValid(rows, p);
            if (!r) body = <span className="muted">No data available</span>;
            else {
              const st = evaluateStatus(p, r[p], r.ts);
              body = <><b>{r[p].toFixed(meta.dec)} {meta.unit}</b> <span className={`pill ${statusColor(st)}`}>{statusText(p, st)}</span><div className="muted small">{fmtDateTime(r.ts)}</div></>;
            }
          } else {
            const s = stats(rows, p);
            if (!s) body = <span className="muted">No data available</span>;
            else {
              const st = evaluateStatus(p, s.avg);
              body = <><b>{s.avg.toFixed(meta.dec + 1)} {meta.unit}</b> <span className={`pill ${statusColor(st)}`}>{statusText(p, st)}</span><div className="muted small">{s.n} valid readings used</div></>;
            }
          }
          return <div key={p} className="mrow"><span>{meta.label}</span><div>{body}</div></div>;
        })}
        <button className="btn primary wide" onClick={onClose}>Back to overview</button>
      </div>
    </div>
  );
}
