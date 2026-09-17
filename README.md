# POLARIS — Antarctic Digital Twin & Mission Control

Frontend prototype for SIH 2026 · Problem statement **SIH26060** — Digital
platform for efficient remote management of Indian Antarctic research
stations (Maitri & Bharati). Team **BHARATI_GU**.

---

## Run it

```bash
npm install
npm run dev
```

Log in with any non-empty username and password. The login screen is the one
you built; only its submit handler was wired to the app.

---

## What is in here

Eleven pages behind the login, all sharing the Mission Control visual
language (dark shell, pastel cards, 27px radii, DM Sans).

| Page | What it does |
|---|---|
| **Home** | The Mission Control dashboard — station health, critical alerts, environment, map, autonomy, 3D preview, AI copilot. Every number is live. |
| **Stations** | Maitri and Bharati side by side with live KPIs, plus the published NCPOR/COMNAP station record (climate, facilities, crew). |
| **3D Twin** | Real Three.js scene. Orbit, zoom, toggle 8 layers, click any asset for live telemetry, health, failure probability and dependants. |
| **Energy** | Generation vs demand, heating load vs outside temperature, prime-mover table, generator-scheduling recommendations. |
| **Logistics** | Inventory burning down live, endurance per resource, replenishment priority ordered against the reserve policy. |
| **Environment** | Live weather channels translated into operational decisions, not just graphs. |
| **Analytics** | Asset health ranking, anomaly vs failure-probability quadrant, health-trend watchlist, RUL, model inventory. |
| **Simulation** | Six what-if scenarios on a sandboxed copy of the twin, with before/after comparison and a recommended response. |
| **Alerts** | Correlated incidents (not raw sensor spam) with probable cause, affected systems, recommendation and acknowledgement. |
| **Reports** | Daily, incident, logistics and asset-register reports generated from the live twin and exported as .txt / .csv. |
| **Settings** | Threshold editor, RBAC matrix, edge/offline mode, fault injection, audit log. |

---

## Source layout

```
src/
  data/
    stationProfiles.js    NCPOR/COMNAP facts for Maitri and Bharati
    assets.js             asset registry: layers, 3D placement, dependencies
    simulator.js          telemetry generator, health scoring, KPIs, faults
    incidents.js          signal → incident correlation with cause + response
    simulationEngine.js   what-if scenarios and generator optimisation
  context/
    PolarisContext.jsx    live twin state, 2.5s tick, roles, audit log
  components/             dashboard cards, 3D scene, asset inspector, UI kit
  pages/                  the eleven pages above + your login
```

The data flow mirrors the architecture in the spec:

```
simulator → (MQTT) → ingestion → validation → twin state → UI / AI / simulation
```

Swapping the simulator for a real MQTT feed means replacing `advance()` in
`simulator.js` with an ingestion subscription. Nothing else changes, because
every page reads from the twin state, never from the generator.

---

## How the numbers work

**Health score** — each asset type has weighted rules in
`defaultThresholds` (temperature, vibration, oil pressure, flow, link
quality…). A breach contributes a weighted penalty; 100 minus the total
penalty is the score. 90+ normal, 70–89 warning, 40–69 degraded, below 40
critical. Thresholds are configuration, editable in Settings, never
hard-coded in components.

**Failure probability / RUL** — derived from the score and its trend, so a
falling asset raises risk before it breaches a hard limit.

**Station autonomy** — each resource is measured against its own target
endurance (fuel 200 d, water 30 d, food 220 d, spares 90 d), then combined
so the weakest resource dominates without hiding the overall picture.

**Incidents** — signals from one asset are grouped into a single incident
with a probable cause and the dependency chain it affects, instead of
raising four separate alerts for one failing generator.

---

## Demo script (the story that sells it)

1. Log in → **Home**: both stations green-ish, 1–2 live alerts already running.
2. **Alerts**: DG-02 at Maitri shows temperature + vibration + oil pressure
   correlated into one incident — "cooling-system degradation" — with the
   affected chain Power Bus A → HVAC → Laboratory.
3. **3D Twin**: click DG-02. It is pulsing orange in the scene; the inspector
   shows live telemetry, health, failure probability and RUL.
4. **Simulation**: run "Generator / CHP failure", 72 h, −31 °C, 42 people.
   Power, heating, fuel, water and autonomy are recalculated before/after,
   with a risk level and a ranked response.
5. **Energy**: the optimiser recommends shifting load to the healthier unit
   and quantifies the fuel saving.
6. **Settings**: hit "Simulate outage" — the link goes red, packets queue at
   the edge gateway, the station keeps running. Restore the link and they
   synchronise.
7. **Reports**: export the incident report as proof of the audit trail.

Fault injection lives in Settings if you want to trigger a fresh failure
live on stage.

---

## Prototype boundary

Deliberately **read + analyse + simulate**. POLARIS recommends actions; it
never actuates generators, pumps or any other equipment. Real actuation
would need explicit authorisation, safety interlocks, engineering validation
and a separate secure control architecture.

Telemetry is simulated and labelled as such throughout. Station descriptions
come from NCPOR's published material; engineering limits, internal layouts
and operating thresholds are treated as configurable prototype values rather
than guessed.

---

## Not built yet (deliberate)

The backend half of the spec: FastAPI services, PostgreSQL + TimescaleDB,
the real MQTT broker, OAuth2/OIDC with MFA, and ML models trained on real
data. The frontend is structured so each of those slots in behind the
existing twin-state interface.
