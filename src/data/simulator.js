/*
  Station Digital Twin Simulator (spec §9).

  Real Antarctic telemetry is not available for the prototype, so this
  module generates realistic live data for every registered asset and can
  deliberately inject faults. Everything produced here is clearly marked
  as SIMULATED in the interface.

  Pipeline mirrored: simulator -> (MQTT) -> ingestion -> validation ->
  twin state -> frontend.
*/

import {
  assetsByStation,
  baselines,
  statusFromScore,
} from "./assets";

/* ---------- helpers ---------- */

const rand = (n) => (Math.random() - 0.5) * 2 * n;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round = (v, d = 1) => Number(v.toFixed(d));

export const FAULT_KINDS = {
  cooling: {
    label: "Cooling-system degradation",
    applies: ["generator", "chp"],
    effect: (t, p) => ({
      ...t,
      temp_c: t.temp_c + 26 * p,
      coolant_c: (t.coolant_c ?? 68) + 22 * p,
      vibration_mm_s: t.vibration_mm_s + 3.4 * p,
      oil_pressure_bar: t.oil_pressure_bar - 1.5 * p,
      fuel_rate_lph: t.fuel_rate_lph * (1 + 0.22 * p),
    }),
  },
  bearing: {
    label: "Bearing wear / imbalance",
    applies: ["generator", "chp", "pump"],
    effect: (t, p) => ({
      ...t,
      vibration_mm_s: t.vibration_mm_s + 5.2 * p,
      motor_temp_c: t.motor_temp_c ? t.motor_temp_c + 18 * p : undefined,
      temp_c: t.temp_c ? t.temp_c + 9 * p : undefined,
    }),
  },
  fuel_leak: {
    label: "Fuel line leak",
    applies: ["fuel_tank"],
    effect: (t, p) => ({
      ...t,
      level_pct: clamp(t.level_pct - 16 * p, 0, 100),
    }),
  },
  flow_loss: {
    label: "Intake blockage / flow loss",
    applies: ["pump", "water_plant"],
    effect: (t, p) => ({
      ...t,
      flow_lpm: t.flow_lpm ? t.flow_lpm * (1 - 0.7 * p) : undefined,
      output_lph: t.output_lph ? t.output_lph * (1 - 0.7 * p) : undefined,
      pressure_bar: t.pressure_bar * (1 - 0.45 * p),
      motor_temp_c: t.motor_temp_c ? t.motor_temp_c + 14 * p : undefined,
    }),
  },
  heat_loss: {
    label: "Heating capacity loss",
    applies: ["hvac"],
    effect: (t, p) => ({
      ...t,
      supply_c: t.supply_c - 16 * p,
      zone_c: t.zone_c - 9 * p,
      fan_rpm: t.fan_rpm * (1 - 0.25 * p),
      filter_pct: clamp(t.filter_pct - 40 * p, 0, 100),
    }),
  },
  link_loss: {
    label: "Satellite link degradation",
    applies: ["comms"],
    effect: (t, p) => ({
      ...t,
      link_pct: clamp(t.link_pct - 85 * p, 0, 100),
      latency_ms: t.latency_ms + 2200 * p,
      throughput_kbps: t.throughput_kbps * (1 - 0.9 * p),
    }),
  },
};

/* ---------- health scoring (spec §7) ---------- */

/*
  Health is derived from asset-specific signals, never from an arbitrary
  colour. Each rule contributes a penalty; weights live in `thresholds`
  so they stay configuration rather than hard-coded UI logic.
*/

export const defaultThresholds = {
  generator: {
    temp_c: { warn: 84, crit: 98, weight: 26 },
    vibration_mm_s: { warn: 2.8, crit: 4.5, weight: 24 },
    oil_pressure_bar: { warn: 3.4, crit: 2.6, weight: 20, lower: true },
    coolant_c: { warn: 82, crit: 95, weight: 18 },
    fuel_rate_lph: { warn: 30, crit: 36, weight: 12 },
  },
  chp: {
    temp_c: { warn: 86, crit: 99, weight: 26 },
    vibration_mm_s: { warn: 2.8, crit: 4.5, weight: 24 },
    oil_pressure_bar: { warn: 3.4, crit: 2.6, weight: 20, lower: true },
    fuel_rate_lph: { warn: 34, crit: 41, weight: 16 },
    heat_kw: { warn: 90, crit: 62, weight: 14, lower: true },
  },
  fuel_tank: {
    level_pct: { warn: 35, crit: 18, weight: 80, lower: true },
    temp_c: { warn: 4, crit: 12, weight: 20 },
  },
  pump: {
    flow_lpm: { warn: 150, crit: 90, weight: 34, lower: true },
    pressure_bar: { warn: 2.3, crit: 1.5, weight: 26, lower: true },
    motor_temp_c: { warn: 62, crit: 78, weight: 22 },
    vibration_mm_s: { warn: 2.4, crit: 4.0, weight: 18 },
  },
  water_plant: {
    output_lph: { warn: 450, crit: 280, weight: 44, lower: true },
    salinity_ppm: { warn: 320, crit: 480, weight: 32 },
    pressure_bar: { warn: 44, crit: 34, weight: 24, lower: true },
  },
  hvac: {
    supply_c: { warn: 26, crit: 19, weight: 34, lower: true },
    zone_c: { warn: 17, crit: 13, weight: 34, lower: true },
    fan_rpm: { warn: 1150, crit: 850, weight: 16, lower: true },
    filter_pct: { warn: 45, crit: 25, weight: 16, lower: true },
  },
  building: {
    zone_c: { warn: 17, crit: 13, weight: 70, lower: true },
    power_kw: { warn: 52, crit: 64, weight: 30 },
  },
  lab: {
    zone_c: { warn: 17, crit: 14, weight: 46, lower: true },
    humidity_pct: { warn: 62, crit: 74, weight: 30 },
    power_kw: { warn: 20, crit: 26, weight: 24 },
  },
  store: {
    zone_c: { warn: -12, crit: -6, weight: 62 },
    stock_pct: { warn: 30, crit: 15, weight: 38, lower: true },
  },
  comms: {
    link_pct: { warn: 70, crit: 40, weight: 54, lower: true },
    latency_ms: { warn: 1400, crit: 2600, weight: 28 },
    throughput_kbps: { warn: 900, crit: 400, weight: 18, lower: true },
  },
  aws: {
    wind_kmh: { warn: 55, crit: 90, weight: 60 },
    temp_c: { warn: -28, crit: -38, weight: 40, lower: true },
  },
};

export function scoreAsset(type, telemetry, thresholds = defaultThresholds) {
  const rules = thresholds[type];
  if (!rules) return 100;

  let penalty = 0;

  Object.entries(rules).forEach(([key, rule]) => {
    const value = telemetry[key];
    if (value === undefined || value === null) return;

    const { warn, crit, weight, lower } = rule;
    let severity = 0;

    if (lower) {
      if (value <= crit) severity = 1;
      else if (value < warn) severity = (warn - value) / (warn - crit);
    } else {
      if (value >= crit) severity = 1;
      else if (value > warn) severity = (value - warn) / (crit - warn);
    }

    penalty += clamp(severity, 0, 1) * weight;
  });

  return Math.round(clamp(100 - penalty, 0, 100));
}

/* Failure probability over the next 24 h and remaining useful life. */
export function predict(health, trendDelta) {
  const decay = Math.max(0, -trendDelta);
  const base = clamp((100 - health) / 100, 0, 1);
  const probability = clamp(base * 0.72 + decay * 0.09, 0, 0.97);

  const rul =
    health >= 95
      ? null
      : Math.round(clamp((health / 100) * 900 - decay * 90, 4, 900));

  return {
    failureProbability: Math.round(probability * 100),
    rulHours: rul,
  };
}

/* ---------- initial state ---------- */

function seedTelemetry(asset, envBias) {
  const spec = baselines[asset.type] || {};
  const t = {};

  Object.entries(spec).forEach(([key, cfg]) => {
    let base = cfg.base;

    if (asset.standby) {
      if (key === "load_kw" || key === "heat_kw") base = base * 0.12;
      if (key === "fuel_rate_lph") base = base * 0.15;
      if (key === "temp_c") base = base * 0.55;
    }

    if (asset.type === "aws" && key === "temp_c") base = envBias.temp;
    if (asset.type === "aws" && key === "wind_kmh") base = envBias.wind;
    if (asset.type === "aws" && key === "humidity_pct") base = envBias.humidity;
    if (asset.type === "aws" && key === "pressure_hpa") base = envBias.pressure;

    t[key] = round(base + rand(cfg.drift * 0.4), 2);
  });

  return t;
}

const envBiasByStation = {
  maitri: { temp: -12.4, wind: 18, humidity: 62, pressure: 985 },
  bharati: { temp: -18.7, wind: 32, humidity: 71, pressure: 978 },
};

export const initialInventory = {
  maitri: {
    fuel: { label: "Fuel (HSD)", pct: 68, unit: "L", volume: 214000, rate: 1420 },
    food: { label: "Food", pct: 81, unit: "days", volume: 192, rate: 1 },
    water: { label: "Water", pct: 74, unit: "L", volume: 54000, rate: 2100 },
    spares: { label: "Critical spares", pct: 38, unit: "kits", volume: 42, rate: 0.4 },
  },
  bharati: {
    fuel: { label: "Fuel (HSD)", pct: 61, unit: "L", volume: 186000, rate: 1580 },
    food: { label: "Food", pct: 73, unit: "days", volume: 164, rate: 1 },
    water: { label: "Water", pct: 69, unit: "L", volume: 48000, rate: 2400 },
    spares: { label: "Critical spares", pct: 29, unit: "kits", volume: 31, rate: 0.5 },
  },
};

export function createInitialState() {
  const stations = {};

  Object.keys(assetsByStation).forEach((key) => {
    const envBias = envBiasByStation[key];
    const assets = {};

    assetsByStation[key].forEach((asset) => {
      const telemetry = seedTelemetry(asset, envBias);
      const health = scoreAsset(asset.type, telemetry);

      assets[asset.id] = {
        id: asset.id,
        telemetry,
        health,
        previousHealth: health,
        status: statusFromScore(health),
        history: [{ t: 0, health }],
        anomaly: 0,
        runtimeH: 1200 + Math.round(Math.random() * 3600),
      };
    });

    stations[key] = {
      assets,
      inventory: JSON.parse(JSON.stringify(initialInventory[key])),
      env: { ...envBias },
      envHistory: [],
      loadHistory: [],
      tick: 0,
    };
  });

  return { stations, faults: [], incidents: [], tick: 0 };
}

/* ---------- one simulation step ---------- */

export function advance(state, thresholds = defaultThresholds) {
  const next = {
    ...state,
    tick: state.tick + 1,
    stations: {},
    faults: state.faults
      .map((f) => ({
        ...f,
        progress: clamp(f.progress + (f.rate ?? 0.045), 0, 1),
      }))
      .filter((f) => !f.cleared),
  };

  Object.entries(state.stations).forEach(([key, station]) => {
    const assets = {};
    const stationFaults = next.faults.filter((f) => f.station === key);

    /* environment drifts slowly and drives heating demand */
    const env = {
      temp: round(
        clamp(station.env.temp + rand(0.55), -42, 2),
        1
      ),
      wind: round(clamp(station.env.wind + rand(2.4), 2, 130), 0),
      humidity: round(clamp(station.env.humidity + rand(1.6), 25, 96), 0),
      pressure: round(clamp(station.env.pressure + rand(0.9), 940, 1025), 0),
    };

    /* colder outside -> higher heating and generator demand */
    const coldFactor = clamp((-env.temp - 10) / 28, -0.2, 1);

    assetsByStation[key].forEach((asset) => {
      const prev = station.assets[asset.id];
      const spec = baselines[asset.type] || {};
      let telemetry = { ...prev.telemetry };

      Object.entries(spec).forEach(([field, cfg]) => {
        const target = (() => {
          let base = cfg.base;

          if (asset.standby) {
            if (field === "load_kw" || field === "heat_kw") base *= 0.12;
            if (field === "fuel_rate_lph") base *= 0.15;
            if (field === "temp_c") base *= 0.55;
          }

          if (asset.type === "aws") {
            if (field === "temp_c") return env.temp;
            if (field === "wind_kmh") return env.wind;
            if (field === "humidity_pct") return env.humidity;
            if (field === "pressure_hpa") return env.pressure;
          }

          if (field === "load_kw") base *= 1 + coldFactor * 0.26;
          if (field === "heat_kw") base *= 1 + coldFactor * 0.34;
          if (field === "fuel_rate_lph") base *= 1 + coldFactor * 0.2;
          if (field === "supply_c") base -= coldFactor * 2.4;
          if (field === "zone_c") base -= coldFactor * 0.7;
          if (field === "level_pct") return prev.telemetry.level_pct - 0.045;

          return base;
        })();

        /* mean-reverting random walk keeps values realistic */
        const current = telemetry[field] ?? target;
        const moved = current + (target - current) * 0.25 + rand(cfg.drift * 0.5);

        telemetry[field] = round(moved, 2);
      });

      /* apply any active fault on this asset */
      stationFaults
        .filter((f) => f.assetId === asset.id)
        .forEach((f) => {
          const kind = FAULT_KINDS[f.kind];
          if (kind) {
            const applied = kind.effect(telemetry, f.progress);
            Object.entries(applied).forEach(([k, v]) => {
              if (v !== undefined) telemetry[k] = round(v, 2);
            });
          }
        });

      const health = scoreAsset(asset.type, telemetry, thresholds);
      const trendDelta = health - prev.health;

      /* simple statistical anomaly signal: deviation from baseline */
      const anomaly = (() => {
        let worst = 0;
        Object.entries(spec).forEach(([field, cfg]) => {
          const value = telemetry[field];
          if (value === undefined) return;
          const z = Math.abs(value - cfg.base) / (cfg.drift * 3 || 1);
          worst = Math.max(worst, z);
        });
        return round(clamp(worst / 4, 0, 1), 2);
      })();

      const history = [
        ...prev.history.slice(-59),
        { t: next.tick, health },
      ];

      assets[asset.id] = {
        ...prev,
        telemetry,
        previousHealth: prev.health,
        health,
        trendDelta,
        status: statusFromScore(health),
        anomaly,
        history,
        runtimeH: prev.runtimeH + 0.25,
        ...predict(health, trendDelta),
      };
    });

    /* inventory burns down based on live consumption */
    const genLoad = assetsByStation[key]
      .filter((a) => a.type === "generator" || a.type === "chp")
      .reduce((sum, a) => sum + (assets[a.id].telemetry.load_kw || 0), 0);

    const fuelBurn = assetsByStation[key]
      .filter((a) => a.type === "generator" || a.type === "chp")
      .reduce((sum, a) => sum + (assets[a.id].telemetry.fuel_rate_lph || 0), 0);

    const inventory = { ...station.inventory };
    inventory.fuel = {
      ...inventory.fuel,
      volume: Math.max(0, inventory.fuel.volume - fuelBurn * 0.25),
      rate: Math.round(fuelBurn * 24),
      pct: round(
        clamp(
          ((inventory.fuel.volume - fuelBurn * 0.25) /
            initialInventory[key].fuel.volume) *
            initialInventory[key].fuel.pct,
          0,
          100
        ),
        1
      ),
    };

    const envHistory = [
      ...station.envHistory.slice(-47),
      {
        t: next.tick,
        time: clockLabel(next.tick),
        temperature: env.temp,
        wind: env.wind,
        humidity: env.humidity,
        pressure: env.pressure,
      },
    ];

    const heatingDemand = round(120 + coldFactor * 95 + rand(6), 0);

    const loadHistory = [
      ...station.loadHistory.slice(-47),
      {
        t: next.tick,
        time: clockLabel(next.tick),
        generation: round(genLoad, 0),
        demand: round(genLoad * (0.86 + Math.random() * 0.1), 0),
        heating: heatingDemand,
      },
    ];

    next.stations[key] = {
      assets,
      inventory,
      env,
      envHistory,
      loadHistory,
      tick: next.tick,
    };
  });

  return next;
}

function clockLabel(tick) {
  const minutes = (tick * 15) % (24 * 60);
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/* ---------- derived station-level KPIs ---------- */

export function stationKpis(stationKey, stationState) {
  const defs = assetsByStation[stationKey];
  const assets = stationState.assets;

  let weighted = 0;
  let weight = 0;

  defs.forEach((def) => {
    const w = def.critical ? 2 : 1;
    weighted += assets[def.id].health * w;
    weight += w;
  });

  const health = Math.round(weighted / weight);

  const generation = defs
    .filter((a) => a.type === "generator" || a.type === "chp")
    .reduce((s, a) => s + (assets[a.id].telemetry.load_kw || 0), 0);

  const fuelRate = defs
    .filter((a) => a.type === "generator" || a.type === "chp")
    .reduce((s, a) => s + (assets[a.id].telemetry.fuel_rate_lph || 0), 0);

  const online = defs.filter(
    (a) => assets[a.id].status !== "offline"
  ).length;

  const sensorsPerAsset = 4;
  const degraded = defs.filter((a) =>
    ["degraded", "critical"].includes(assets[a.id].status)
  ).length;

  const fuelDays = Math.floor(
    stationState.inventory.fuel.volume / Math.max(1, fuelRate * 24)
  );

  const waterDays = Math.floor(
    stationState.inventory.water.volume /
      Math.max(1, stationState.inventory.water.rate)
  );

  const foodDays = stationState.inventory.food.volume;

  /* Critical-load endurance on the reserve tank and battery bank. */
  const powerBackupDays = Math.max(2, Math.floor(fuelDays * 0.08));

  /*
    Station autonomy (spec §11): inventory converted into operational
    endurance against the reserve policy. Each resource is measured
    against its own target endurance, then combined so that the weakest
    resource dominates without hiding the overall picture.
  */
  const targets = { fuel: 200, water: 30, food: 220, spares: 90 };

  const sparesDays = Math.round(
    stationState.inventory.spares.volume /
      Math.max(0.05, stationState.inventory.spares.rate)
  );

  const ratios = [
    fuelDays / targets.fuel,
    waterDays / targets.water,
    foodDays / targets.food,
    sparesDays / targets.spares,
  ].map((r) => clamp(r, 0, 1));

  const mean = ratios.reduce((s, r) => s + r, 0) / ratios.length;
  const weakest = Math.min(...ratios);

  const autonomy = Math.round(
    clamp((mean * 0.5 + weakest * 0.5) * 100 * (0.55 + (health / 100) * 0.45), 0, 100)
  );

  const limiting = Math.min(fuelDays, waterDays, foodDays, sparesDays);

  return {
    health,
    generation: Math.round(generation),
    fuelRate: Math.round(fuelRate),
    fuelDays,
    waterDays,
    foodDays,
    powerBackupDays,
    autonomy,
    sparesDays,
    limitingResource:
      limiting === fuelDays
        ? "Fuel"
        : limiting === waterDays
        ? "Water"
        : limiting === sparesDays
        ? "Spares"
        : "Food",
    sensorsOnline: online * sensorsPerAsset,
    totalSensors: defs.length * sensorsPerAsset,
    degraded,
    riskLevel:
      health >= 88 ? "LOW" : health >= 72 ? "MODERATE" : health >= 55 ? "ELEVATED" : "HIGH",
  };
}
