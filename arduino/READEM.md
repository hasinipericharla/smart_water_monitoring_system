# Arduino / ESP32 firmware

Put the ESP32 sketch here (e.g. `water_monitor/water_monitor.ino`).

The dashboard (`frontend/src/esp32Service.js`) polls the device with `GET http://<esp32-ip>/data`
and reads fields such as `waterLevel` and `turbidityADC` (see `frontend/src/pages/Overview.jsx`
for the full list). Update `ESP32_URL` in `esp32Service.js` whenever the board's IP changes.
