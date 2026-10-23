// import { useState, useEffect } from 'react';
// import { Droplets, Cloud, Gauge, Download } from 'lucide-react';
// import { PARAMS, TANK } from '../config.js';
// import { getReadings } from '../utils/mockData.js';
// import { heightFromLevel, latestValid, stats, volumeFromLevel } from '../utils/calculations.js';
// import { dayKey, fmtDate, startOfDay } from '../utils/dateUtils.js';
// import { downloadCSV, downloadPDF } from '../utils/exportUtils.js';
// import SensorCard from '../components/SensorCard.jsx';
// import WaterCalendar from '../components/WaterCalendar.jsx';
// import DailyReadingsModal from '../components/DailyReadingsModal.jsx';
// import TrendChart from '../components/TrendChart.jsx';
// import { getESP32Readings } from '../esp32Service.js';

// export default function Overview({ hostel }) {
//   const [readings, setReadings] = useState([]);
//   const [connectionStatus, setConnectionStatus] = useState('Connecting');

//   useEffect(() => {
//     let active = true;

//     async function fetchReadings() {
//       try {
//         const data = await getESP32Readings();

//         if (!active) return;

//         // const reading = {
//         //   ts: Date.now(),
//         //   level: data.waterLevel >= 0 ? data.waterLevel : null,
//         //   turb: null,
//         //   tds: null,
//         //   valid: true,
//         //   quality: 'unknown',
//         // };
// const reading = {
//   ts: Date.now(),

//   level: data.waterLevel >= 0 ? data.waterLevel : null,

//   // Temporary display of raw ADC readings.
//   turb: Number.isFinite(data.turbidityADC)
//     ? data.turbidityADC
//     : null,

//   tds: Number.isFinite(data.tdsADC)
//     ? data.tdsADC
//     : null,

//   turbidityADC: data.turbidityADC,
//   turbidityVoltage: data.turbidityVoltage,

//   tdsADC: data.tdsADC,
//   tdsVoltage: data.tdsVoltage,

//   valid: true,
//   quality: 'unknown',
// };

//         setReadings((previous) => {
//           const updated = [...previous, reading];
//           return updated.slice(-100);
//         });

//         setConnectionStatus('Connected');
//       } catch (error) {
//         console.error('ESP32 connection error:', error);
//         if (active) setConnectionStatus('Disconnected');
//       }
//     }

//     fetchReadings();
//     const timer = setInterval(fetchReadings, 5000);

//     return () => {
//       active = false;
//       clearInterval(timer);
//     };
//   }, []);
//   const [sel, setSel] = useState(null);
//   const [open, setOpen] = useState(false);
//   const lv = latestValid(readings, 'level');

//   const period = sel
//     ? { from: startOfDay(sel).getTime(), to: startOfDay(sel).getTime() + 864e5, label: dayKey(sel) }
//     : { from: readings[0]?.ts ?? 0, to: Date.now(), label: 'last 30 days (default)' };
//   const rows = readings.filter((r) => r.ts >= period.from && r.ts < period.to);

//   const csv = () => downloadCSV(`${hostel.id}_readings_${period.label.split(' ')[0]}.csv`, [
//     ['hostel', 'tank', 'timestamp', 'water_level_percent', 'turbidity_ntu', 'tds_ppm', 'valid', 'quality'],
//     ...rows.map((r) => [hostel.id, TANK.id, new Date(r.ts).toISOString(), r.level, r.turb, r.tds, r.valid, r.quality]),
//   ]);
//   const pdf = () => downloadPDF(`${hostel.id}_summary.pdf`, `Smart Water Monitoring – ${hostel.id} summary`, [
//     `Hostel: ${hostel.id} (${hostel.category}) · Tank: ${TANK.id}`, `Period: ${period.label}`, 'Data source: SIMULATED readings (prototype)',
//     `Generated: ${new Date().toLocaleString()}`, '',
//     ...Object.entries(PARAMS).map(([k, m]) => { const s = stats(rows, k); return s ? `${m.label}: avg ${s.avg.toFixed(2)}, min ${s.min}, max ${s.max} ${m.unit} (${s.n} valid readings)` : `${m.label}: No data available`; }),
//     '', 'Note: TDS and turbidity within range do not by themselves show that water is safe to drink.',
//   ]);

//   return (
//     <>
//        <div className="muted small">
//   ESP32 status: <b>{connectionStatus}</b>
// </div>
//       <div className="top-grid">
//         <div className="cards3">
//           <SensorCard param="level" icon={Droplets} reading={lv}
//             extra={lv && `≈ ${heightFromLevel(lv.level, TANK.heightCm).toFixed(0)} cm · ${volumeFromLevel(lv.level, TANK.capacityL).toFixed(0)} L (est.)`} />
//           <SensorCard param="turb" icon={Cloud} reading={latestValid(readings, 'turb')} />
//           <SensorCard param="tds" icon={Gauge} reading={latestValid(readings, 'tds')} />
//         </div>
//         <WaterCalendar readings={readings} selected={sel} onSelect={(d) => { setSel(d); setOpen(true); }} />
//       </div>

//       <div className="row between wrap export-bar">
//         <span className="muted small">Export period: <b>{period.label}</b>{sel && <> · <button className="link" onClick={() => setSel(null)}>Clear date</button></>}</span>
//         <div className="row"><button className="btn" onClick={csv}><Download size={16} /> CSV</button><button className="btn" onClick={pdf}><Download size={16} /> PDF</button></div>
//       </div>
//       <TrendChart hostel={hostel} readings={readings} />
//       {open && sel && <DailyReadingsModal date={sel} readings={readings} onClose={() => setOpen(false)} />}
//     </>
//   );
// }
// import { useState,useEffect } from 'react';
// import { Droplets, Cloud, Gauge, Download } from 'lucide-react';
// import { PARAMS, TANK } from '../config.js';
// import { getReadings } from '../utils/mockData.js';
// import { heightFromLevel, latestValid, stats, volumeFromLevel } from '../utils/calculations.js';
// import { dayKey, fmtDate, startOfDay } from '../utils/dateUtils.js';
// import { downloadCSV, downloadPDF } from '../utils/exportUtils.js';
// import SensorCard from '../components/SensorCard.jsx';
// import WaterCalendar from '../components/WaterCalendar.jsx';
// import DailyReadingsModal from '../components/DailyReadingsModal.jsx';
// import TrendChart from '../components/TrendChart.jsx';
// import { getESP32Readings } from '../esp32Service.js';

// export default function Overview({ hostel }) {
//   const readings = getReadings(hostel.id);
//   const [sel, setSel] = useState(null);
//   const [open, setOpen] = useState(false);
//   const lv = latestValid(readings, 'level');

//   const period = sel
//     ? { from: startOfDay(sel).getTime(), to: startOfDay(sel).getTime() + 864e5, label: dayKey(sel) }
//     : { from: readings[0]?.ts ?? 0, to: Date.now(), label: 'last 30 days (default)' };
//   const rows = readings.filter((r) => r.ts >= period.from && r.ts < period.to);

//   const csv = () => downloadCSV(`${hostel.id}_readings_${period.label.split(' ')[0]}.csv`, [
//     ['hostel', 'tank', 'timestamp', 'water_level_percent', 'turbidity_ntu', 'tds_ppm', 'valid', 'quality'],
//     ...rows.map((r) => [hostel.id, TANK.id, new Date(r.ts).toISOString(), r.level, r.turb, r.tds, r.valid, r.quality]),
//   ]);
//   const pdf = () => downloadPDF(`${hostel.id}_summary.pdf`, `Smart Water Monitoring – ${hostel.id} summary`, [
//     `Hostel: ${hostel.id} (${hostel.category}) · Tank: ${TANK.id}`, `Period: ${period.label}`, 'Data source: SIMULATED readings (prototype)',
//     `Generated: ${new Date().toLocaleString()}`, '',
//     ...Object.entries(PARAMS).map(([k, m]) => { const s = stats(rows, k); return s ? `${m.label}: avg ${s.avg.toFixed(2)}, min ${s.min}, max ${s.max} ${m.unit} (${s.n} valid readings)` : `${m.label}: No data available`; }),
//     '', 'Note: TDS and turbidity within range do not by themselves show that water is safe to drink.',
//   ]);

//   return (
//     <>
//       <div className="top-grid">
//         <div className="cards3">
//           <SensorCard param="level" icon={Droplets} reading={lv}
//             extra={lv && `≈ ${heightFromLevel(lv.level, TANK.heightCm).toFixed(0)} cm · ${volumeFromLevel(lv.level, TANK.capacityL).toFixed(0)} L (est.)`} />
//           <SensorCard param="turb" icon={Cloud} reading={latestValid(readings, 'turb')} />
//           <SensorCard param="tds" icon={Gauge} reading={latestValid(readings, 'tds')} />
//         </div>
//         <WaterCalendar readings={readings} selected={sel} onSelect={(d) => { setSel(d); setOpen(true); }} />
//       </div>

//       <div className="row between wrap export-bar">
//         <span className="muted small">Export period: <b>{period.label}</b>{sel && <> · <button className="link" onClick={() => setSel(null)}>Clear date</button></>}</span>
//         <div className="row"><button className="btn" onClick={csv}><Download size={16} /> CSV</button><button className="btn" onClick={pdf}><Download size={16} /> PDF</button></div>
//       </div>
//       <TrendChart hostel={hostel} readings={readings} />
//       {open && sel && <DailyReadingsModal date={sel} readings={readings} onClose={() => setOpen(false)} />}
//     </>
//   );
// }

// import { useState, useEffect } from 'react';
// import { Droplets, Cloud, Gauge, Download } from 'lucide-react';
// import { PARAMS, TANK } from '../config.js';
// import {
//   heightFromLevel,
//   latestValid,
//   stats,
//   volumeFromLevel,
// } from '../utils/calculations.js';
// import { dayKey, startOfDay } from '../utils/dateUtils.js';
// import { downloadCSV, downloadPDF } from '../utils/exportUtils.js';
// import SensorCard from '../components/SensorCard.jsx';
// import WaterCalendar from '../components/WaterCalendar.jsx';
// import DailyReadingsModal from '../components/DailyReadingsModal.jsx';
// import TrendChart from '../components/TrendChart.jsx';
// import { getESP32Readings,saveReading, } from '../esp32Service.js';
// import { useRef } from 'react';

// export default function Overview({ hostel }) {
//   // const lastSavedRef = useRef(0);
//   const lastSavedRef = useRef(
//   Number(localStorage.getItem(`lastSaved_${hostel.id}`)) || 0
// );
//   const [readings, setReadings] = useState([]);
//   const [connectionStatus, setConnectionStatus] = useState('Connecting');

//   // Fetch live readings from ESP32
//   useEffect(() => {
//     let active = true;

// //     async function fetchReadings() {
// //       try {
// //         const data = await getESP32Readings();

// //         const now = Date.now();

// //         if (now - lastSavedRef.current >= 5 * 60 * 1000) {
// //   await saveReading({
// //     device_id: 'ESP32_01',
// //     hostel_id: hostel.id,
// //     tank_id: 'T1',
// //     distance_cm: data.distanceCm,
// //     tank_height_cm: 200,
// //     full_offset_cm: 0,
// //     tds_adc: data.tdsADC,
// //     turbidity_adc: data.turbidityADC,
// //     tds_voltage: data.tdsVoltage,
// //     turbidity_voltage: data.turbidityVoltage,
// //   });

// //   lastSavedRef.current = now;
// // }

// //         if (!active) return;

// //         const reading = {
// //           ts: Date.now(),

// //           level:
// //             Number.isFinite(data.waterLevel) && data.waterLevel >= 0
// //               ? data.waterLevel
// //               : null,

// //           // Temporary display of raw ADC readings
// //           turb: Number.isFinite(data.turbidityADC)
// //             ? data.turbidityADC
// //             : null,

// //           tds: Number.isFinite(data.tdsADC)
// //             ? data.tdsADC
// //             : null,

// //           turbidityADC: data.turbidityADC,
// //           turbidityVoltage: data.turbidityVoltage,

// //           tdsADC: data.tdsADC,
// //           tdsVoltage: data.tdsVoltage,

// //           valid: true,
// //           quality: 'unknown',
// //         };

// //         setReadings((previous) => {
// //           return [...previous, reading].slice(-100);
// //         });

// //         setConnectionStatus('Connected');
// //       } catch (error) {
// //         console.error('ESP32 connection error:', error);

// //         if (active) {
// //           setConnectionStatus('Disconnected');
// //         }
// //       }
// //     }
// async function fetchReadings() {
//   try {
//     const data = await getESP32Readings();

//     if (!active) return;

//     // Update the dashboard using live ESP32 readings.
//     const reading = {
//       ts: Date.now(),
//       level:
//         Number.isFinite(data.waterLevel) && data.waterLevel >= 0
//           ? data.waterLevel
//           : null,
//       turb: Number.isFinite(data.turbidityADC)
//         ? data.turbidityADC
//         : null,
//       tds: Number.isFinite(data.tdsADC)
//         ? data.tdsADC
//         : null,
//       turbidityADC: data.turbidityADC,
//       turbidityVoltage: data.turbidityVoltage,
//       tdsADC: data.tdsADC,
//       tdsVoltage: data.tdsVoltage,
//       valid: true,
//       quality: 'unknown',
//     };

//     setReadings((previous) => [...previous, reading].slice(-100));
//     setConnectionStatus('Connected');

//     // Save the first reading immediately, then every 5 minutes.
//     const now = Date.now();

//     if (now - lastSavedRef.current >= 5 * 60 * 1000) {
//       try {
//         await saveReading({
//           device_id: 'ESP32_01',
//           hostel_id: hostel.id,
//           tank_id: 'T1',
//           distance_cm: data.distanceCm,
//           tank_height_cm: 200,
//           full_offset_cm: 0,
//           tds_adc: data.tdsADC,
//           turbidity_adc: data.turbidityADC,
//           tds_voltage: data.tdsVoltage,
//           turbidity_voltage: data.turbidityVoltage,
//         });

//         // lastSavedRef.current = Date.now();
//         // console.log('Reading saved to database.');
//         lastSavedRef.current = Date.now();

// localStorage.setItem(
//   `lastSaved_${hostel.id}`,
//   String(lastSavedRef.current)
// );

// console.log('Reading saved to database.');
//       } catch (saveError) {
//         console.error('Failed to save reading to database:', saveError);
//       }
//     }
//   } catch (error) {
//     console.error('ESP32 connection error:', error);

//     if (active) {
//       setConnectionStatus('Disconnected');
//     }
//   }
// }



//     fetchReadings();

//     const timer = setInterval(fetchReadings, 5000);

//     return () => {
//       active = false;
//       clearInterval(timer);
//     };
//   }, []);

//   const [sel, setSel] = useState(null);
//   const [open, setOpen] = useState(false);

//   const lv = latestValid(readings, 'level');

//   const period = sel
//     ? {
//         from: startOfDay(sel).getTime(),
//         to: startOfDay(sel).getTime() + 864e5,
//         label: dayKey(sel),
//       }
//     : {
//         from: readings[0]?.ts ?? 0,
//         to: Date.now(),
//         label: 'last 30 days (default)',
//       };

//   const rows = readings.filter(
//     (r) => r.ts >= period.from && r.ts < period.to
//   );

//   // Export readings as CSV
//   const csv = () =>
//     downloadCSV(
//       `${hostel.id}_readings_${period.label.split(' ')[0]}.csv`,
//       [
//         [
//           'hostel',
//           'tank',
//           'timestamp',
//           'water_level_percent',
//           'turbidity_adc',
//           'tds_adc',
//           'turbidity_voltage',
//           'tds_voltage',
//           'valid',
//           'quality',
//         ],
//         ...rows.map((r) => [
//           hostel.id,
//           TANK.id,
//           new Date(r.ts).toISOString(),
//           r.level,
//           r.turbidityADC,
//           r.tdsADC,
//           r.turbidityVoltage,
//           r.tdsVoltage,
//           r.valid,
//           r.quality,
//         ]),
//       ]
//     );

//   // Export summary as PDF
//   const pdf = () =>
//     downloadPDF(
//       `${hostel.id}_summary.pdf`,
//       `Smart Water Monitoring – ${hostel.id} summary`,
//       [
//         `Hostel: ${hostel.id} (${hostel.category}) · Tank: ${TANK.id}`,
//         `Period: ${period.label}`,
//         'Data source: Live ESP32 sensor readings',
//         `Connection status: ${connectionStatus}`,
//         `Generated: ${new Date().toLocaleString()}`,
//         '',
//         ...Object.entries(PARAMS).map(([k, m]) => {
//           const s = stats(rows, k);

//           return s
//             ? `${m.label}: avg ${s.avg.toFixed(2)}, min ${s.min}, max ${s.max} ${m.unit} (${s.n} valid readings)`
//             : `${m.label}: No data available`;
//         }),
//         '',
//         'Note: Turbidity and TDS currently display raw ADC readings. Calibrate and convert them before treating them as NTU or ppm.',
//         'TDS and turbidity readings alone do not establish that water is safe to drink.',
//       ]
//     );

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
//             reading={latestValid(readings, 'turb')}
//           />

//           <SensorCard
//             param="tds"
//             icon={Gauge}
//             reading={latestValid(readings, 'tds')}
//           />
//         </div>

//         <WaterCalendar
//           readings={readings}
//           selected={sel}
//           onSelect={(d) => {
//             setSel(d);
//             setOpen(true);
//           }}
//         />
//       </div>

//       <div className="row between wrap export-bar">
//         <span className="muted small">
//           Export period: <b>{period.label}</b>
//           {sel && (
//             <>
//               {' · '}
//               <button
//                 className="link"
//                 onClick={() => setSel(null)}
//               >
//                 Clear date
//               </button>
//             </>
//           )}
//         </span>

//         <div className="row">
//           <button className="btn" onClick={csv}>
//             <Download size={16} /> CSV
//           </button>

//           <button className="btn" onClick={pdf}>
//             <Download size={16} /> PDF
//           </button>
//         </div>
//       </div>

//       <TrendChart hostel={hostel} readings={readings} />

//       {open && sel && (
//         <DailyReadingsModal
//           date={sel}
//           readings={readings}
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
  heightFromLevel,
  latestValid,
  stats,
  volumeFromLevel,
} from '../utils/calculations.js';
import { dayKey, startOfDay } from '../utils/dateUtils.js';
import { downloadCSV, downloadPDF } from '../utils/exportUtils.js';
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

  // Selected date or default last-30-day period.
  const period = sel
    ? {
        from: startOfDay(sel).getTime(),
        to: startOfDay(sel).getTime() + 864e5,
        label: dayKey(sel),
      }
    : {
        from: Date.now() - 30 * 24 * 60 * 60 * 1000,
        to: Date.now(),
        label: 'last 30 days (default)',
      };

  const rows = allReadings.filter(
    (r) => r.ts >= period.from && r.ts < period.to
  );

  // Export readings for the selected date or last 30 days.
  const csv = () =>
    downloadCSV(
      `${hostel.id}_readings_${period.label.split(' ')[0]}.csv`,
      [
        [
          'hostel',
          'tank',
          'timestamp',
          'water_level_percent',
          'turbidity_adc',
          'tds_adc',
          'turbidity_voltage',
          'tds_voltage',
          'valid',
          'quality',
        ],
        ...rows.map((r) => [
          hostel.id,
          r.tank_id ?? TANK.id,
          new Date(r.ts).toISOString(),
          r.level,
          r.turbidityADC ?? r.turbidity_adc,
          r.tdsADC ?? r.tds_adc,
          r.turbidityVoltage ?? r.turbidity_voltage,
          r.tdsVoltage ?? r.tds_voltage,
          r.valid,
          r.quality,
        ]),
      ]
    );

  // Export summary calculated from the selected readings.
  const pdf = () =>
    downloadPDF(
      `${hostel.id}_summary.pdf`,
      `Smart Water Monitoring – ${hostel.id} summary`,
      [
        `Hostel: ${hostel.id} (${hostel.category}) · Tank: ${TANK.id}`,
        `Period: ${period.label}`,
        'Data source: MongoDB history and live ESP32 readings',
        `Connection status: ${connectionStatus}`,
        `Generated: ${new Date().toLocaleString()}`,
        '',
        ...Object.entries(PARAMS).map(([key, meta]) => {
          const summary = stats(rows, key);

          return summary
            ? `${meta.label}: avg ${summary.avg.toFixed(2)}, min ${summary.min}, max ${summary.max} ${meta.unit} (${summary.n} valid readings)`
            : `${meta.label}: No data available`;
        }),
        '',
        'Note: Turbidity and TDS currently display raw ADC readings. Calibrate and convert them before treating them as NTU or ppm.',
        'TDS and turbidity readings alone do not establish that water is safe to drink.',
      ]
    );

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

          <div
            className="row"
            style={{ justifyContent: 'flex-end', marginTop: '12px' }}
          >
            <button className="btn" onClick={csv}>
              <Download size={16} /> CSV
            </button>

            <button className="btn" onClick={pdf}>
              <Download size={16} /> PDF
            </button>
          </div>
        </div>
      </div>

      <TrendChart hostel={hostel} readings={allReadings} />

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



