/*
  POLARIS AI Model — predictive intelligence layer (spec §7/§12).

  A small feed-forward neural network (trained offline with scikit-learn on
  a physics-informed synthetic dataset — see /ai-model/train.py in the repo
  root) estimates, directly from the live digital-twin state that also
  drives the 3D scene:

    • failureRiskPct     — 0-100 near-term failure risk for the asset
    • energyDemandKw     — predicted electrical/thermal demand (kW)
    • operationalDemand  — 0-100 index of how much operational / logistics
                            attention the asset currently needs

  This is a genuine trained model, not a re-skin of the deterministic
  threshold scorer in simulator.js: `aiModelWeights.json` holds real
  weight matrices (32 → 16 → 3 ReLU network) plus the feature
  standardisation stats learned from ~38k synthetic samples (test MAE:
  failure risk ±2.6pp, energy ±1.0 kW, operational demand ±3.2pp — see
  `test_mae` in the weights file). Because no live NCPOR sensor feed
  exists yet, the model is trained on simulated-but-physically-grounded
  data, exactly like the rest of the twin — and is intentionally kept as
  a small, auditable, swap-in-place JSON artifact (not a hidden black
  box) so it can be retrained on real telemetry later without touching
  any UI code.

  Zero runtime dependencies: this file is the entire forward pass.
*/

import weights from "./aiModelWeights.json";

const { types: TYPES, slots: SLOT_NAMES, mean: MEAN, std: STD, layers: LAYERS } =
  weights;

const N_TYPE = TYPES.length;
const N_SLOT = SLOT_NAMES.length;

/* ---------- linear algebra (tiny, dependency-free) ---------- */

function relu(v) {
  return v > 0 ? v : 0;
}

function forward(features) {
  // standardise
  let x = features.map((v, i) => (v - MEAN[i]) / (STD[i] || 1));

  LAYERS.forEach((layer, li) => {
    const isLast = li === LAYERS.length - 1;
    const { w, b } = layer; // w: [inDim][outDim], b: [outDim]
    const outDim = b.length;
    const y = new Array(outDim).fill(0);

    for (let o = 0; o < outDim; o++) {
      let sum = b[o];
      for (let i = 0; i < x.length; i++) sum += x[i] * w[i][o];
      y[o] = isLast ? sum : relu(sum);
    }
    x = y;
  });

  return x; // [failureRiskPct, energyDemandKw, operationalDemand]
}

/* ---------- feature extraction: mirrors ai_model/train.py exactly ---------- */

/*
  Maps each asset type's real telemetry fields onto the eight generic
  "slots" the network was trained on, so one small model can score every
  asset type in the twin. Where the twin has no matching live signal for
  a slot (e.g. RPM is not modelled for diesel generators), a stable
  type-typical constant is used — the same convention the training data
  generator uses for that slot.
*/
function slotVector(type, telemetry) {
  const t = telemetry || {};
  const s = new Array(N_SLOT).fill(0);
  const idx = (name) => SLOT_NAMES.indexOf(name);

  const set = (name, value) => {
    if (value === undefined || value === null || Number.isNaN(value)) return;
    s[idx(name)] = value;
  };

  switch (type) {
    case "generator":
      set("primary_temp", t.temp_c);
      set("vibration", t.vibration_mm_s);
      set("pressure_or_level", t.oil_pressure_bar);
      set("flow_or_output", t.load_kw);
      set("speed_or_rpm", 1500);
      set("secondary_temp", t.coolant_c);
      set("rate_or_power", t.fuel_rate_lph);
      set("quality_pct", 100);
      break;
    case "chp":
      set("primary_temp", t.temp_c);
      set("vibration", t.vibration_mm_s);
      set("pressure_or_level", t.oil_pressure_bar);
      set("flow_or_output", t.load_kw);
      set("speed_or_rpm", 1500);
      set("secondary_temp", t.heat_kw);
      set("rate_or_power", t.fuel_rate_lph);
      set("quality_pct", 100);
      break;
    case "fuel_tank":
      set("primary_temp", t.temp_c);
      set("pressure_or_level", t.level_pct);
      set("quality_pct", 100);
      break;
    case "pump":
      set("primary_temp", t.motor_temp_c);
      set("vibration", t.vibration_mm_s);
      set("pressure_or_level", t.pressure_bar);
      set("flow_or_output", t.flow_lpm);
      set("speed_or_rpm", 2900);
      set("rate_or_power", (t.flow_lpm || 200) * 0.016);
      set("quality_pct", 100);
      break;
    case "water_plant":
      set("primary_temp", 12);
      set("pressure_or_level", t.pressure_bar);
      set("flow_or_output", t.output_lph);
      set("secondary_temp", t.salinity_ppm);
      set("rate_or_power", (t.output_lph || 600) * 0.015);
      set("quality_pct", 100);
      break;
    case "hvac":
      set("primary_temp", t.supply_c);
      set("speed_or_rpm", t.fan_rpm);
      set("secondary_temp", t.zone_c);
      set("rate_or_power", 8 + Math.max(0, 21 - (t.zone_c ?? 21)) * 3);
      set("quality_pct", t.filter_pct);
      break;
    case "building":
    case "lab":
      set("secondary_temp", t.zone_c);
      set("rate_or_power", t.power_kw ?? (type === "lab" ? 18 : 45));
      set("quality_pct", t.humidity_pct ?? 60);
      break;
    case "store":
      set("secondary_temp", t.zone_c);
      set("rate_or_power", 4);
      set("quality_pct", t.stock_pct);
      break;
    case "comms":
      set("secondary_temp", t.latency_ms);
      set("rate_or_power", t.throughput_kbps);
      set("quality_pct", t.link_pct);
      break;
    case "aws":
      set("primary_temp", t.temp_c);
      set("vibration", t.wind_kmh);
      break;
    default:
      break;
  }

  return s;
}

/*
  stationCtx: { env: {temp, wind, humidity}, personnel: number }
  assetState: the live per-asset object from twin.stations[key].assets[id]
              (telemetry, health, anomaly, trendDelta, runtimeH, ...)
  assetDef:   the static registry entry from assets.js (id, type, ...)
*/
export function extractFeatures(assetDef, assetState, stationCtx) {
  const f = new Array(MEAN.length).fill(0);
  const typeIdx = TYPES.indexOf(assetDef.type);
  if (typeIdx >= 0) f[typeIdx] = 1;

  const slots = slotVector(assetDef.type, assetState.telemetry);
  for (let i = 0; i < N_SLOT; i++) f[N_TYPE + i] = slots[i];

  let off = N_TYPE + N_SLOT;
  f[off + 0] = stationCtx.env?.temp ?? -15;
  f[off + 1] = stationCtx.env?.wind ?? 20;
  f[off + 2] = stationCtx.env?.humidity ?? 65;
  f[off + 3] = stationCtx.personnel ?? 45;
  off += 4;

  f[off + 0] = (assetState.runtimeH ?? 1500) / 60000;
  f[off + 1] = 0.15; // maintenance-gap proxy: not tracked live in the prototype twin
  f[off + 2] = (assetState.health ?? 100) / 100;
  f[off + 3] = (assetState.trendDelta ?? 0) / 10;
  f[off + 4] = assetState.anomaly ?? 0;

  return f;
}

/* ---------- public API ---------- */

export function predictAsset(assetDef, assetState, stationCtx) {
  if (!assetState) return null;
  const features = extractFeatures(assetDef, assetState, stationCtx);
  const [riskRaw, energyRaw, opRaw] = forward(features);

  return {
    failureRiskPct: clamp(riskRaw, 0.5, 99.5),
    energyDemandKw: Math.max(0, energyRaw),
    operationalDemand: clamp(opRaw, 0, 100),
  };
}

export function predictStation(assetDefs, stationState, stationCtx) {
  const rows = assetDefs.map((def) => {
    const state = stationState.assets[def.id];
    const pred = predictAsset(def, state, stationCtx);
    return { asset: def, state, ...pred };
  });

  const valid = rows.filter((r) => r.failureRiskPct !== undefined);
  const totalEnergyKw = round(valid.reduce((s, r) => s + r.energyDemandKw, 0), 1);

  const weight = (r) => (r.asset.critical ? 2 : 1);
  const wSum = valid.reduce((s, r) => s + weight(r), 0) || 1;

  const avgFailureRiskPct = round(
    valid.reduce((s, r) => s + r.failureRiskPct * weight(r), 0) / wSum,
    1
  );
  const avgOperationalDemand = round(
    valid.reduce((s, r) => s + r.operationalDemand * weight(r), 0) / wSum,
    1
  );

  const topRisk = [...valid].sort((a, b) => b.failureRiskPct - a.failureRiskPct).slice(0, 5);

  return {
    rows: valid,
    totalEnergyKw,
    avgFailureRiskPct,
    avgOperationalDemand,
    topRisk,
  };
}

export const AI_MODEL_INFO = {
  architecture: "28 → 32 → 16 → 3 (ReLU, fully connected)",
  trainedOn: "38,500 synthetic samples across 11 asset types",
  testMae: weights.test_mae,
  targets: weights.targets,
};

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
function round(v, d = 1) {
  const p = 10 ** d;
  return Math.round(v * p) / p;
}
