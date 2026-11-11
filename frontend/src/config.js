// Central configuration. In production these come from the backend settings table.
export const HOSTELS = [
  ...['LH1', 'LH2', 'LH3', 'LH4'].map((id) => ({ id, category: "Ladies' Hostel" })),
  ...['MH1', 'MH2', 'MH3', 'MH4', 'MH5', 'MH6', 'MH7'].map((id) => ({ id, category: "Men's Hostel" })),
];

// One tank per hostel in the prototype. Calibrate per real tank.
export const TANK = { id: 'T1', heightCm: 200, capacityL: 10000 };

// Water-level limits come from the project requirements.
// TDS / turbidity limits are DEMO PLACEHOLDERS so the red/green logic can be seen.
// Set them to null until confirmed for your sensors: status then shows "Threshold not set"
// and no quality alerts are raised.
export const THRESHOLDS = {
  waterLevel: { low: 20, high: 80 },
  tds: { upper: 500, lower: null },
  turbidity: { upper: 5 },
};

export const STALE_MINUTES = 60; // readings older than this are shown gray
export const GAP_MINUTES = 10; // graph line breaks across gaps longer than this

export const PARAMS = {
  level: { label: 'Water Level', unit: '%', dec: 0 },
  turb: { label: 'Turbidity', unit: 'NTU', dec: 1 },
  tds: { label: 'TDS', unit: 'ppm', dec: 0 },
};

export const WARDEN_ALERTS = {
  highLevel: 'High water level',
  lowLevel: 'Low water level',
  tds: 'Abnormal TDS',
  turb: 'Abnormal turbidity',
  offline: 'Sensor offline',
  report: 'Scheduled reports',
};
export const STUDENT_ALERTS = {
  lowLevel: 'Low water level',
  conservation: 'Water conservation notices',
  supply: 'Water-supply updates',
};
