
// const ESP32_URL = 'http://10.49.101.124';

// export async function getESP32Readings() {
//   const response = await fetch(`${ESP32_URL}/data`, {
//     cache: 'no-store',
//   });

//   if (!response.ok) {
//     throw new Error(`ESP32 returned HTTP ${response.status}`);
//   }

//   return await response.json();
// }

import { getToken } from './utils/auth.js';

const ESP32_URL = 'http://10.49.101.124';
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function getESP32Readings() {
const response = await fetch(`${ESP32_URL}/data`, {
cache: 'no-store',
});

if (!response.ok) {
throw new Error(`ESP32 returned HTTP ${response.status}`);
}

return await response.json();
}

export async function saveReading(reading) {
const token = getToken();

const response = await fetch(`${API_URL}/api/readings`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
...(token ? { Authorization: `Bearer ${token}` } : {}),
...(import.meta.env.VITE_DEVICE_KEY
? { 'X-API-Key': import.meta.env.VITE_DEVICE_KEY }
: {}),
},
body: JSON.stringify(reading),
});

if (!response.ok) {
const message = await response.text();
throw new Error(`Failed to save reading (${response.status}): ${message}`);
}

return await response.json();
}


export async function getStoredReadings(hostelId) {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/api/hostels/${encodeURIComponent(hostelId)}/readings`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load stored readings (${response.status}): ${await response.text()}`
    );
  }

  return await response.json();
}

