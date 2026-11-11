import { PARAMS } from '../config.js';
import { evaluateStatus, statusColor, statusText } from '../utils/statusRules.js';
import { fmtDateTime } from '../utils/dateUtils.js';

export default function SensorCard({ param, reading, icon: Icon, extra }) {
  const p = PARAMS[param], value = reading?.[param];
  const st = evaluateStatus(param, value, reading?.ts);
  return (
    <div className={`card sensor ${statusColor(st)}`}>
      <div className="sensor-h"><Icon size={18} /><span>{p.label}</span><i className="dot" /></div>
      <div className="big">{value == null ? '—' : value.toFixed(p.dec)}<small>{p.unit}</small></div>
      <div className="status">Status: <b>{statusText(param, st)}</b></div>
      {extra && <div className="muted small">{extra}</div>}
      <div className="muted small">Updated {reading ? fmtDateTime(reading.ts) : 'never'}</div>
    </div>
  );
}
