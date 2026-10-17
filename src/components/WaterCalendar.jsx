import { addDays, dayKey, startOfDay } from '../utils/dateUtils.js';
import { groupByDay } from '../utils/calculations.js';

export default function WaterCalendar({ readings, selected, onSelect }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29)); // today + previous 29
  const has = groupByDay(readings);
  const lead = (days[0].getDay() + 6) % 7; // Monday-first grid
  return (
    <div className="card calendar">
      <h3>Last 30 days</h3>
      <div className="cal-grid">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <b key={i} className="cal-h">{d}</b>)}
        {Array.from({ length: lead }, (_, i) => <span key={'b' + i} />)}
        {days.map((d) => {
          const k = dayKey(d), isToday = k === dayKey(today), sel = selected && dayKey(selected) === k;
          return (
            <button key={k} className={`cal-d ${isToday ? 'today' : ''} ${sel ? 'sel' : ''} ${has[k] ? 'has' : 'none'}`} onClick={() => onSelect(d)}
              title={has[k] ? 'Readings available' : 'No data'} aria-label={`${d.toDateString()}${has[k] ? '' : ', no data'}`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <p className="muted small"><i className="key today" /> Today <i className="key has" /> Has data <i className="key none" /> No data</p>
      <p className="muted small">{days[0].toLocaleDateString([], { day: 'numeric', month: 'short' })} – {today.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</p>
    </div>
  );
}
