# Smart Water Monitoring System (prototype)

React + Vite + Recharts dashboard for hostel tank level, turbidity and TDS. Covers Phases 1–2 of the spec with **simulated data** (labelled in the UI).

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```
Node 18+ required. No environment variables are needed for the prototype.

## Where things are
- `src/config.js` – hostels, tank size, **thresholds** (water level 20/80; TDS 500 ppm and turbidity 5 NTU are *demo placeholders* – set to `null` until confirmed for your sensors).
- `src/utils/statusRules.js` – single status function used by cards, popup and graphs.
- `src/utils/calculations.js` – level %, daily/weekly stats (missing data never becomes 0).
- `src/utils/mockData.js` – simulated readings; replace `getReadings()` with an API call.
- `src/utils/auth.js` – demo auth (localStorage, hashed). Replace with backend auth.
- `backend/main.py` – small FastAPI stub: reading ingest, level formula, duplicate-alert suppression, SMS placeholder (logs only).

## Not done yet
Real DB, real auth/roles, SMS gateway, monthly report page, device-offline detection, per-tank config UI. TDS/turbidity readings within range do not prove water is safe to drink.
