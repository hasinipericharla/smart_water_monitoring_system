// const ESP32_URL = 'http://10.49.101.124';

// export async function getESP32Readings() {
//   const response = await fetch(`${ESP32_URL}/data`, {
//     method: 'GET',
//     cache: 'no-store',
//   });

//   if (!response.ok) {
//     throw new Error(`ESP32 returned HTTP ${response.status}`);
//   }

//   const data = await response.json();

//   return {
//     status: data.status,
//     turbidity: data.turbidity,
//     tds: data.tds,
//     waterLevel: data.waterLevel,
//   };
// }
const ESP32_URL = 'http://10.49.101.124';

export async function getESP32Readings() {
  const response = await fetch(`${ESP32_URL}/data`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`ESP32 returned HTTP ${response.status}`);
  }

  return await response.json();
}