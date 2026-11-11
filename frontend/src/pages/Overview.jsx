// import { useState, useEffect, useRef, useMemo } from 'react';
// import { Droplets, Cloud, Gauge, Download } from 'lucide-react';
// import { TANK } from '../config.js';
// import {
//   heightFromLevel,
//   latestValid,
//   volumeFromLevel,
// } from '../utils/calculations.js';
// import { downloadCSV } from '../utils/exportUtils.js';
// import SensorCard from '../components/SensorCard.jsx';
// import WaterCalendar from '../components/WaterCalendar.jsx';
// import DailyReadingsModal from '../components/DailyReadingsModal.jsx';
// import TrendChart from '../components/TrendChart.jsx';
// import {
//   getESP32Readings,
//   saveReading,
//   getStoredReadings,
// } from '../esp32Service.js';

// // Local-date key (YYYY-MM-DD) for a timestamp.
// function localDateKey(ts) {
//   const d = new Date(ts);
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, '0');
//   const day = String(d.getDate()).padStart(2, '0');
//   return `${y}-${m}-${day}`;
// }

// // Average of a numeric field, ignoring null / NaN values.
// function avgOf(list, field) {
//   const values = list
//     .map((r) => r[field])
//     .filter((v) => v !== null && v !== undefined && Number.isFinite(Number(v)))
//     .map(Number);

//   if (!values.length) return '';

//   return Number(
//     (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
//   );
// }

// export default function Overview({ hostel }) {
//   const lastSavedRef = useRef(
//     Number(localStorage.getItem(`lastSaved_${hostel.id}`)) || 0
//   );

//   const [readings, setReadings] = useState([]);
//   const [storedReadings, setStoredReadings] = useState([]);
//   const [connectionStatus, setConnectionStatus] = useState('Connecting');
//   const [sel, setSel] = useState(null);
//   const [open, setOpen] = useState(false);

//   // Load historical readings from MongoDB.
//   useEffect(() => {
//     let active = true;

//     async function loadStoredReadings() {
//       try {
//         const result = await getStoredReadings(hostel.id);

//         if (!active) return;

//         const list = Array.isArray(result)
//           ? result
//           : result.readings ?? [];

//         const formattedReadings = list
//           .map((r) => {
//             const timestamp =
//               typeof r.ts === 'number'
//                 ? r.ts
//                 : new Date(r.ts).getTime();

//             const level = r.level ?? null;
//             const turb = r.turb ?? r.turbidity_adc ?? null;
//             const tds = r.tds ?? r.tds_adc ?? null;

//             return {
//               ...r,
//               ts: timestamp,
//               level,
//               turb,
//               tds,
//               turbidityADC: r.turbidity_adc ?? r.turbidityADC,
//               tdsADC: r.tds_adc ?? r.tdsADC,
//               turbidityVoltage:
//                 r.turbidity_voltage ?? r.turbidityVoltage,
//               tdsVoltage: r.tds_voltage ?? r.tdsVoltage,
//               valid: r.valid ?? level != null,
//               quality: r.quality ?? 'unknown',
//             };
//           })
//           .filter((r) => Number.isFinite(r.ts));

//         setStoredReadings(formattedReadings);
//       } catch (error) {
//         console.error('Failed to load database history:', error);
//       }
//     }

//     loadStoredReadings();

//     return () => {
//       active = false;
//     };
//   }, [hostel.id]);

//   // Fetch live ESP32 readings and save one reading every five minutes.
//   useEffect(() => {
//     let active = true;

//     async function fetchReadings() {
//       try {
//         const data = await getESP32Readings();

//         if (!active) return;

//         const reading = {
//           ts: Date.now(),
//           level:
//             Number.isFinite(data.waterLevel) && data.waterLevel >= 0
//               ? data.waterLevel
//               : null,
//           turb: Number.isFinite(data.turbidityADC)
//             ? data.turbidityADC
//             : null,
//           tds: Number.isFinite(data.tdsADC)
//             ? data.tdsADC
//             : null,
//           turbidityADC: data.turbidityADC,
//           turbidityVoltage: data.turbidityVoltage,
//           tdsADC: data.tdsADC,
//           tdsVoltage: data.tdsVoltage,
//           valid:
//             Number.isFinite(data.waterLevel) && data.waterLevel >= 0,
//           quality: 'unknown',
//         };

//         setReadings((previous) => [...previous, reading].slice(-100));
//         setConnectionStatus('Connected');

//         const now = Date.now();

//         if (now - lastSavedRef.current >= 5 * 60 * 1000) {
//           try {
//             await saveReading({
//               device_id: 'ESP32_01',
//               hostel_id: hostel.id,
//               tank_id: 'T1',
//               distance_cm: data.distanceCm,
//               tank_height_cm: 200,
//               full_offset_cm: 0,
//               tds_adc: data.tdsADC,
//               turbidity_adc: data.turbidityADC,
//               tds_voltage: data.tdsVoltage,
//               turbidity_voltage: data.turbidityVoltage,
//             });

//             lastSavedRef.current = Date.now();

//             localStorage.setItem(
//               `lastSaved_${hostel.id}`,
//               String(lastSavedRef.current)
//             );

//             console.log('Reading saved to database.');
//           } catch (saveError) {
//             console.error(
//               'Failed to save reading to database:',
//               saveError
//             );
//           }
//         }
//       } catch (error) {
//         console.error('ESP32 connection error:', error);

//         if (active) {
//           setConnectionStatus('Disconnected');
//         }
//       }
//     }

//     fetchReadings();

//     const timer = setInterval(fetchReadings, 5000);

//     return () => {
//       active = false;
//       clearInterval(timer);
//     };
//   }, [hostel.id]);

//   // Combine historical and live readings.
//   const allReadings = useMemo(() => {
//     const combined = [...storedReadings, ...readings];
//     const unique = new Map();

//     for (const reading of combined) {
//       if (!Number.isFinite(reading.ts)) continue;

//       const key = `${reading.ts}-${reading.level}-${reading.tds}-${reading.turb}`;

//       if (!unique.has(key)) {
//         unique.set(key, reading);
//       }
//     }

//     return Array.from(unique.values()).sort((a, b) => a.ts - b.ts);
//   }, [storedReadings, readings]);

//   const lv = latestValid(allReadings, 'level');

//   // CSV: daily averages for the past 30 days.
//   const csv = () => {
//     const from = Date.now() - 30 * 24 * 60 * 60 * 1000;
//     const last30 = allReadings.filter((r) => r.ts >= from);

//     // Group readings by local date.
//     const byDay = new Map();
//     for (const r of last30) {
//       const key = localDateKey(r.ts);
//       if (!byDay.has(key)) byDay.set(key, []);
//       byDay.get(key).push(r);
//     }

//     const dailyRows = Array.from(byDay.keys())
//       .sort()
//       .map((date) => {
//         const list = byDay.get(date);
//         return [
//           hostel.id,
//           TANK.id,
//           date,
//           avgOf(list, 'level'),
//           avgOf(list, 'turb'),
//           avgOf(list, 'tds'),
//         ];
//       });

//     downloadCSV(`${hostel.id}_daily_avg_last30days.csv`, [
//       ['hostel', 'tank', 'date', 'water_level', 'turbidity', 'tds'],
//       ...dailyRows,
//     ]);
//   };

//   return (
//     <>
//       <div className="muted small">
//         ESP32 status: <b>{connectionStatus}</b>
//       </div>

//       <div className="top-grid">
//         <div className="cards3">
//           <SensorCard
//             param="level"
//             icon={Droplets}
//             reading={lv}
//             extra={
//               lv &&
//               `≈ ${heightFromLevel(
//                 lv.level,
//                 TANK.heightCm
//               ).toFixed(0)} cm · ${volumeFromLevel(
//                 lv.level,
//                 TANK.capacityL
//               ).toFixed(0)} L (est.)`
//             }
//           />

//           <SensorCard
//             param="turb"
//             icon={Cloud}
//             reading={latestValid(allReadings, 'turb')}
//           />

//           <SensorCard
//             param="tds"
//             icon={Gauge}
//             reading={latestValid(allReadings, 'tds')}
//           />
//         </div>

//         <div className="calendar-export-container">
//           <WaterCalendar
//             readings={allReadings}
//             selected={sel}
//             onSelect={(date) => {
//               setSel(date);
//               setOpen(true);
//             }}
//           />
//         </div>
//       </div>

//       <TrendChart
//         hostel={hostel}
//         readings={allReadings}
//         actions={
//           <button className="btn" onClick={csv}>
//             <Download size={16} /> CSV
//           </button>
//         }
//       />

//       {open && sel && (
//         <DailyReadingsModal
//           date={sel}
//           readings={allReadings}
//           onClose={() => setOpen(false)}
//         />
//       )}
//     </>
//   );
// }

import { useState, useEffect, useRef, useMemo } from 'react';
import { Droplets, Cloud, Gauge, Download } from 'lucide-react';
import { PARAMS, TANK } from '../config.js';
import {
  groupByDay,
  heightFromLevel,
  latestValid,
  stats,
  volumeFromLevel,
} from '../utils/calculations.js';
import { addDays, dayKey, startOfDay } from '../utils/dateUtils.js';
import { downloadCSV } from '../utils/exportUtils.js';
import SensorCard from '../components/SensorCard.jsx';
import WaterCalendar from '../components/WaterCalendar.jsx';
import DailyReadingsModal from '../components/DailyReadingsModal.jsx';
import TrendChart from '../components/TrendChart.jsx';
import {
  getESP32Readings,
  saveReading,
  getStoredReadings,
} from '../esp32Service.js';

export default function Overview({ hostel }) {
  const lastSavedRef = useRef(
    Number(localStorage.getItem(`lastSaved_${hostel.id}`)) || 0
  );

  const [readings, setReadings] = useState([]);
  const [storedReadings, setStoredReadings] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState(false);

  // Load historical readings from MongoDB.
  useEffect(() => {
    let active = true;

    async function loadStoredReadings() {
      try {
        const result = await getStoredReadings(hostel.id);

        if (!active) return;

        const list = Array.isArray(result)
          ? result
          : result.readings ?? [];

        const formattedReadings = list
          .map((r) => {
            const timestamp =
              typeof r.ts === 'number'
                ? r.ts
                : new Date(r.ts).getTime();

            const level = r.level ?? null;
            const turb = r.turb ?? r.turbidity_adc ?? null;
            const tds = r.tds ?? r.tds_adc ?? null;

            return {
              ...r,
              ts: timestamp,
              level,
              turb,
              tds,
              turbidityADC: r.turbidity_adc ?? r.turbidityADC,
              tdsADC: r.tds_adc ?? r.tdsADC,
              turbidityVoltage:
                r.turbidity_voltage ?? r.turbidityVoltage,
              tdsVoltage: r.tds_voltage ?? r.tdsVoltage,
              valid: r.valid ?? level != null,
              quality: r.quality ?? 'unknown',
            };
          })
          .filter((r) => Number.isFinite(r.ts));

        setStoredReadings(formattedReadings);
      } catch (error) {
        console.error('Failed to load database history:', error);
      }
    }

    loadStoredReadings();

    return () => {
      active = false;
    };
  }, [hostel.id]);

  // Fetch live ESP32 readings and save one reading every five minutes.
  useEffect(() => {
    let active = true;

    async function fetchReadings() {
      try {
        const data = await getESP32Readings();

        if (!active) return;

        const reading = {
          ts: Date.now(),
          level:
            Number.isFinite(data.waterLevel) && data.waterLevel >= 0
              ? data.waterLevel
              : null,
          turb: Number.isFinite(data.turbidityADC)
            ? data.turbidityADC
            : null,
          tds: Number.isFinite(data.tdsADC)
            ? data.tdsADC
            : null,
          turbidityADC: data.turbidityADC,
          turbidityVoltage: data.turbidityVoltage,
          tdsADC: data.tdsADC,
          tdsVoltage: data.tdsVoltage,
          valid:
            Number.isFinite(data.waterLevel) && data.waterLevel >= 0,
          quality: 'unknown',
        };

        setReadings((previous) => [...previous, reading].slice(-100));
        setConnectionStatus('Connected');

        const now = Date.now();

        if (now - lastSavedRef.current >= 5 * 60 * 1000) {
          try {
            await saveReading({
              device_id: 'ESP32_01',
              hostel_id: hostel.id,
              tank_id: 'T1',
              distance_cm: data.distanceCm,
              tank_height_cm: 200,
              full_offset_cm: 0,
              tds_adc: data.tdsADC,
              turbidity_adc: data.turbidityADC,
              tds_voltage: data.tdsVoltage,
              turbidity_voltage: data.turbidityVoltage,
            });

            lastSavedRef.current = Date.now();

            localStorage.setItem(
              `lastSaved_${hostel.id}`,
              String(lastSavedRef.current)
            );

            console.log('Reading saved to database.');
          } catch (saveError) {
            console.error(
              'Failed to save reading to database:',
              saveError
            );
          }
        }
      } catch (error) {
        console.error('ESP32 connection error:', error);

        if (active) {
          setConnectionStatus('Disconnected');
        }
      }
    }

    fetchReadings();

    const timer = setInterval(fetchReadings, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [hostel.id]);

  // Combine historical and live readings.
  const allReadings = useMemo(() => {
    const combined = [...storedReadings, ...readings];
    const unique = new Map();

    for (const reading of combined) {
      if (!Number.isFinite(reading.ts)) continue;

      const key = `${reading.ts}-${reading.level}-${reading.tds}-${reading.turb}`;

      if (!unique.has(key)) {
        unique.set(key, reading);
      }
    }

    return Array.from(unique.values()).sort((a, b) => a.ts - b.ts);
  }, [storedReadings, readings]);

  const lv = latestValid(allReadings, 'level');

  // CSV: daily averages for the same 30 calendar days the calendar shows.
  // Uses the same groupByDay + stats logic as the calendar popup,
  // so the numbers match exactly.
  const csv = () => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 30 }, (_, i) =>
      addDays(today, i - 29)
    );
    const byDay = groupByDay(allReadings);

    const avg = (rows, key) => {
      const s = stats(rows, key);
      return s ? Number(s.avg.toFixed(PARAMS[key].dec + 1)) : '';
    };

    const dailyRows = days
      .map((d) => {
        const k = dayKey(d);
        const rows = byDay[k];
        if (!rows) return null;

        return [
          hostel.id,
          TANK.id,
          k,
          avg(rows, 'level'),
          avg(rows, 'turb'),
          avg(rows, 'tds'),
        ];
      })
      .filter(Boolean);

    downloadCSV(`${hostel.id}_daily_avg_last30days.csv`, [
      ['hostel', 'tank', 'date', 'water_level', 'turbidity', 'tds'],
      ...dailyRows,
    ]);
  };

  return (
    <>
      <div className="muted small">
        ESP32 status: <b>{connectionStatus}</b>
      </div>

      <div className="top-grid">
        <div className="cards3">
          <SensorCard
            param="level"
            icon={Droplets}
            reading={lv}
            extra={
              lv &&
              `≈ ${heightFromLevel(
                lv.level,
                TANK.heightCm
              ).toFixed(0)} cm · ${volumeFromLevel(
                lv.level,
                TANK.capacityL
              ).toFixed(0)} L (est.)`
            }
          />

          <SensorCard
            param="turb"
            icon={Cloud}
            reading={latestValid(allReadings, 'turb')}
          />

          <SensorCard
            param="tds"
            icon={Gauge}
            reading={latestValid(allReadings, 'tds')}
          />
        </div>

        <div className="calendar-export-container">
          <WaterCalendar
            readings={allReadings}
            selected={sel}
            onSelect={(date) => {
              setSel(date);
              setOpen(true);
            }}
          />
        </div>
      </div>

      <TrendChart
        hostel={hostel}
        readings={allReadings}
        actions={
          <button className="btn" onClick={csv}>
            <Download size={16} /> CSV
          </button>
        }
      />

      {open && sel && (
        <DailyReadingsModal
          date={sel}
          readings={allReadings}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}