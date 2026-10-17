import { useState } from 'react';
import { Droplets, Cloud, Gauge, Download } from 'lucide-react';
import { PARAMS, TANK } from '../config.js';
import { getReadings } from '../utils/mockData.js';
import { heightFromLevel, latestValid, stats, volumeFromLevel } from '../utils/calculations.js';
import { dayKey, fmtDate, startOfDay } from '../utils/dateUtils.js';
import { downloadCSV, downloadPDF } from '../utils/exportUtils.js';
import SensorCard from '../components/SensorCard.jsx';
import WaterCalendar from '../components/WaterCalendar.jsx';
import DailyReadingsModal from '../components/DailyReadingsModal.jsx';
import TrendChart from '../components/TrendChart.jsx';

export default function Overview({ hostel }) {
  const readings = getReadings(hostel.id);
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState(false);
  const lv = latestValid(readings, 'level');

  const period = sel
    ? { from: startOfDay(sel).getTime(), to: startOfDay(sel).getTime() + 864e5, label: dayKey(sel) }
    : { from: readings[0]?.ts ?? 0, to: Date.now(), label: 'last 30 days (default)' };
  const rows = readings.filter((r) => r.ts >= period.from && r.ts < period.to);

  const csv = () => downloadCSV(`${hostel.id}_readings_${period.label.split(' ')[0]}.csv`, [
    ['hostel', 'tank', 'timestamp', 'water_level_percent', 'turbidity_ntu', 'tds_ppm', 'valid', 'quality'],
    ...rows.map((r) => [hostel.id, TANK.id, new Date(r.ts).toISOString(), r.level, r.turb, r.tds, r.valid, r.quality]),
  ]);
  const pdf = () => downloadPDF(`${hostel.id}_summary.pdf`, `Smart Water Monitoring – ${hostel.id} summary`, [
    `Hostel: ${hostel.id} (${hostel.category}) · Tank: ${TANK.id}`, `Period: ${period.label}`, 'Data source: SIMULATED readings (prototype)',
    `Generated: ${new Date().toLocaleString()}`, '',
    ...Object.entries(PARAMS).map(([k, m]) => { const s = stats(rows, k); return s ? `${m.label}: avg ${s.avg.toFixed(2)}, min ${s.min}, max ${s.max} ${m.unit} (${s.n} valid readings)` : `${m.label}: No data available`; }),
    '', 'Note: TDS and turbidity within range do not by themselves show that water is safe to drink.',
  ]);

  return (
    <>
      <div className="top-grid">
        <div className="cards3">
          <SensorCard param="level" icon={Droplets} reading={lv}
            extra={lv && `≈ ${heightFromLevel(lv.level, TANK.heightCm).toFixed(0)} cm · ${volumeFromLevel(lv.level, TANK.capacityL).toFixed(0)} L (est.)`} />
          <SensorCard param="turb" icon={Cloud} reading={latestValid(readings, 'turb')} />
          <SensorCard param="tds" icon={Gauge} reading={latestValid(readings, 'tds')} />
        </div>
        <WaterCalendar readings={readings} selected={sel} onSelect={(d) => { setSel(d); setOpen(true); }} />
      </div>

      <div className="row between wrap export-bar">
        <span className="muted small">Export period: <b>{period.label}</b>{sel && <> · <button className="link" onClick={() => setSel(null)}>Clear date</button></>}</span>
        <div className="row"><button className="btn" onClick={csv}><Download size={16} /> CSV</button><button className="btn" onClick={pdf}><Download size={16} /> PDF</button></div>
      </div>
      <TrendChart hostel={hostel} readings={readings} />
      {open && sel && <DailyReadingsModal date={sel} readings={readings} onClose={() => setOpen(false)} />}
    </>
  );
}
