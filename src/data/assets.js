/*
  POLARIS digital-asset registry.

  Every physical component modelled by the twin appears here with:
    id, name, type, layer, 3D placement, telemetry baseline, dependencies.

  Baselines and thresholds are PROTOTYPE values. They are configuration
  data (see Settings → Thresholds) and must be replaced with authorised
  NCPOR engineering values before any operational use.
*/

export const LAYERS = [
  { id: "infrastructure", label: "Infrastructure", color: "#b7e9f4" },
  { id: "energy", label: "Energy", color: "#ffdf83" },
  { id: "fuel", label: "Fuel", color: "#ff9b8e" },
  { id: "water", label: "Water", color: "#aabaff" },
  { id: "hvac", label: "HVAC", color: "#d4e6da" },
  { id: "labs", label: "Laboratories", color: "#c9b6ff" },
  { id: "environment", label: "Environment", color: "#8de5f1" },
  { id: "logistics", label: "Logistics", color: "#ffc98b" },
];

export const STATUS = {
  normal: { label: "NORMAL", color: "#27a567", range: "90–100" },
  warning: { label: "WARNING", color: "#e8b53a", range: "70–89" },
  degraded: { label: "DEGRADED", color: "#ef7f3c", range: "40–69" },
  critical: { label: "CRITICAL", color: "#e5473d", range: "0–39" },
  offline: { label: "OFFLINE", color: "#9aa7a9", range: "n/a" },
};

export function statusFromScore(score) {
  if (score === null || score === undefined) return "offline";
  if (score >= 90) return "normal";
  if (score >= 70) return "warning";
  if (score >= 40) return "degraded";
  return "critical";
}

/* ---------- telemetry baselines by asset type ---------- */

export const baselines = {
  generator: {
    load_kw: { base: 78, unit: "kW", drift: 6 },
    temp_c: { base: 72, unit: "°C", drift: 2.5 },
    vibration_mm_s: { base: 1.6, unit: "mm/s", drift: 0.25 },
    oil_pressure_bar: { base: 4.2, unit: "bar", drift: 0.15 },
    coolant_c: { base: 68, unit: "°C", drift: 2 },
    fuel_rate_lph: { base: 24, unit: "L/h", drift: 1.5 },
  },
  chp: {
    load_kw: { base: 96, unit: "kW", drift: 7 },
    heat_kw: { base: 120, unit: "kW", drift: 9 },
    temp_c: { base: 74, unit: "°C", drift: 2.5 },
    vibration_mm_s: { base: 1.5, unit: "mm/s", drift: 0.22 },
    oil_pressure_bar: { base: 4.4, unit: "bar", drift: 0.15 },
    fuel_rate_lph: { base: 28, unit: "L/h", drift: 1.6 },
  },
  fuel_tank: {
    level_pct: { base: 68, unit: "%", drift: 0.4 },
    temp_c: { base: -14, unit: "°C", drift: 1.5 },
  },
  pump: {
    flow_lpm: { base: 210, unit: "L/min", drift: 12 },
    pressure_bar: { base: 3.1, unit: "bar", drift: 0.2 },
    motor_temp_c: { base: 46, unit: "°C", drift: 2 },
    vibration_mm_s: { base: 1.2, unit: "mm/s", drift: 0.2 },
  },
  water_plant: {
    output_lph: { base: 640, unit: "L/h", drift: 30 },
    salinity_ppm: { base: 180, unit: "ppm", drift: 15 },
    pressure_bar: { base: 55, unit: "bar", drift: 2 },
  },
  hvac: {
    supply_c: { base: 34, unit: "°C", drift: 1.5 },
    zone_c: { base: 21, unit: "°C", drift: 0.6 },
    fan_rpm: { base: 1450, unit: "rpm", drift: 40 },
    filter_pct: { base: 78, unit: "%", drift: 0.5 },
  },
  building: {
    zone_c: { base: 21, unit: "°C", drift: 0.8 },
    power_kw: { base: 34, unit: "kW", drift: 4 },
    occupancy: { base: 18, unit: "persons", drift: 2 },
  },
  lab: {
    zone_c: { base: 20, unit: "°C", drift: 0.5 },
    humidity_pct: { base: 42, unit: "%", drift: 3 },
    power_kw: { base: 12, unit: "kW", drift: 2 },
  },
  store: {
    zone_c: { base: -18, unit: "°C", drift: 1.2 },
    power_kw: { base: 8, unit: "kW", drift: 1.2 },
    stock_pct: { base: 74, unit: "%", drift: 0.3 },
  },
  comms: {
    link_pct: { base: 92, unit: "%", drift: 5 },
    latency_ms: { base: 620, unit: "ms", drift: 60 },
    throughput_kbps: { base: 2100, unit: "kbps", drift: 180 },
  },
  aws: {
    temp_c: { base: -12, unit: "°C", drift: 2 },
    wind_kmh: { base: 18, unit: "km/h", drift: 6 },
    humidity_pct: { base: 62, unit: "%", drift: 5 },
    pressure_hpa: { base: 985, unit: "hPa", drift: 3 },
  },
};

/* ---------- asset registry ---------- */

const maitriAssets = [
  {
    id: "MTR-BLD-01",
    name: "Main Building",
    type: "building",
    layer: "infrastructure",
    zone: "Living / Dining / Lounge",
    critical: true,
    pos: [0, 0, 0],
    size: [16, 3.2, 7],
    feeds: [],
    dependsOn: ["MTR-BUS-A"],
  },
  {
    id: "MTR-LAB-01",
    name: "Geology & Geophysics Lab",
    type: "lab",
    layer: "labs",
    zone: "Laboratory wing",
    critical: true,
    pos: [12.5, 0, -3],
    size: [7, 2.8, 5.5],
    feeds: [],
    dependsOn: ["MTR-BUS-A", "MTR-HVAC-01"],
  },
  {
    id: "MTR-STR-01",
    name: "Cold Storage",
    type: "store",
    layer: "logistics",
    zone: "Provisions",
    critical: false,
    pos: [-11, 0, -3.5],
    size: [5, 2.6, 4.5],
    feeds: [],
    dependsOn: ["MTR-BUS-B"],
  },
  {
    id: "MTR-GEN-01",
    name: "Diesel Generator DG-01",
    type: "generator",
    layer: "energy",
    zone: "Power house",
    critical: true,
    pos: [-8, 0, 7],
    size: [3.4, 2.4, 3],
    feeds: ["MTR-BUS-A"],
    dependsOn: ["MTR-FUEL-01"],
  },
  {
    id: "MTR-GEN-02",
    name: "Diesel Generator DG-02",
    type: "generator",
    layer: "energy",
    zone: "Power house",
    critical: true,
    pos: [-3.6, 0, 7],
    size: [3.4, 2.4, 3],
    feeds: ["MTR-BUS-A", "MTR-BUS-B"],
    dependsOn: ["MTR-FUEL-01"],
  },
  {
    id: "MTR-GEN-03",
    name: "Diesel Generator DG-03 (standby)",
    type: "generator",
    layer: "energy",
    zone: "Power house",
    critical: false,
    standby: true,
    pos: [0.8, 0, 7],
    size: [3.4, 2.4, 3],
    feeds: ["MTR-BUS-B"],
    dependsOn: ["MTR-FUEL-01"],
  },
  {
    id: "MTR-FUEL-01",
    name: "Fuel Farm — Tank A",
    type: "fuel_tank",
    layer: "fuel",
    zone: "Fuel farm",
    critical: true,
    pos: [-15, 0, 4],
    size: [3.2, 3.4, 3.2],
    round: true,
    feeds: ["MTR-GEN-01", "MTR-GEN-02", "MTR-GEN-03"],
    dependsOn: [],
  },
  {
    id: "MTR-FUEL-02",
    name: "Fuel Farm — Tank B",
    type: "fuel_tank",
    layer: "fuel",
    zone: "Fuel farm",
    critical: true,
    pos: [-15, 0, 9],
    size: [3.2, 3.4, 3.2],
    round: true,
    feeds: ["MTR-GEN-01", "MTR-GEN-02"],
    dependsOn: [],
  },
  {
    id: "MTR-FUEL-03",
    name: "Fuel Station",
    type: "fuel_tank",
    layer: "fuel",
    zone: "Vehicle refuelling",
    critical: false,
    pos: [-15, 0, -2],
    size: [2.6, 2.2, 2.6],
    feeds: [],
    dependsOn: [],
  },
  {
    id: "MTR-PMP-01",
    name: "Lake Water Pump House",
    type: "pump",
    layer: "water",
    zone: "Priyadarshini Lake intake",
    critical: true,
    pos: [13, 0, 8],
    size: [4, 2.4, 3.6],
    feeds: ["MTR-BLD-01"],
    dependsOn: ["MTR-BUS-B"],
  },
  {
    id: "MTR-HVAC-01",
    name: "HVAC / Heating Plant",
    type: "hvac",
    layer: "hvac",
    zone: "Utility block",
    critical: true,
    pos: [6, 0, 7],
    size: [4.4, 2.6, 3.4],
    feeds: ["MTR-BLD-01", "MTR-LAB-01"],
    dependsOn: ["MTR-BUS-A"],
  },
  {
    id: "MTR-CMP-01",
    name: "Summer Camp Module",
    type: "building",
    layer: "infrastructure",
    zone: "Seasonal accommodation",
    critical: false,
    pos: [7, 0, -9],
    size: [5.5, 2.4, 3.6],
    feeds: [],
    dependsOn: ["MTR-BUS-B"],
  },
  {
    id: "MTR-COM-01",
    name: "Satellite Communication Mast",
    type: "comms",
    layer: "infrastructure",
    zone: "Comms",
    critical: true,
    pos: [-4, 0, -9],
    size: [1.2, 9, 1.2],
    mast: true,
    feeds: [],
    dependsOn: ["MTR-BUS-A"],
  },
  {
    id: "MTR-AWS-01",
    name: "Automatic Weather Station",
    type: "aws",
    layer: "environment",
    zone: "Open field",
    critical: false,
    pos: [16, 0, 7],
    size: [1, 5, 1],
    mast: true,
    feeds: [],
    dependsOn: [],
  },
];

const bharatiAssets = [
  {
    id: "BHR-BLD-01",
    name: "Main Module Block",
    type: "building",
    layer: "infrastructure",
    zone: "Living / Dining / Lounge",
    critical: true,
    pos: [0, 0, 0],
    size: [18, 4.2, 8],
    stilts: true,
    feeds: [],
    dependsOn: ["BHR-BUS-A"],
  },
  {
    id: "BHR-LAB-01",
    name: "Biology & Chemistry Lab",
    type: "lab",
    layer: "labs",
    zone: "Laboratory wing — level 2",
    critical: true,
    pos: [13, 0, -4],
    size: [7, 3.2, 5.5],
    stilts: true,
    feeds: [],
    dependsOn: ["BHR-BUS-A", "BHR-HVAC-01"],
  },
  {
    id: "BHR-STR-01",
    name: "Cold Storage",
    type: "store",
    layer: "logistics",
    zone: "Provisions",
    critical: false,
    pos: [-12, 0, -4],
    size: [5, 2.6, 4.5],
    feeds: [],
    dependsOn: ["BHR-BUS-B"],
  },
  {
    id: "BHR-CHP-01",
    name: "CHP Unit 01",
    type: "chp",
    layer: "energy",
    zone: "Energy centre",
    critical: true,
    pos: [-8.5, 0, 8],
    size: [3.6, 2.6, 3.2],
    feeds: ["BHR-BUS-A", "BHR-HVAC-01"],
    dependsOn: ["BHR-FUEL-01"],
  },
  {
    id: "BHR-CHP-02",
    name: "CHP Unit 02",
    type: "chp",
    layer: "energy",
    zone: "Energy centre",
    critical: true,
    pos: [-4, 0, 8],
    size: [3.6, 2.6, 3.2],
    feeds: ["BHR-BUS-A", "BHR-BUS-B"],
    dependsOn: ["BHR-FUEL-01"],
  },
  {
    id: "BHR-CHP-03",
    name: "CHP Unit 03 (standby)",
    type: "chp",
    layer: "energy",
    zone: "Energy centre",
    critical: false,
    standby: true,
    pos: [0.5, 0, 8],
    size: [3.6, 2.6, 3.2],
    feeds: ["BHR-BUS-B"],
    dependsOn: ["BHR-FUEL-01"],
  },
  {
    id: "BHR-FUEL-01",
    name: "Fuel Farm — Tank A",
    type: "fuel_tank",
    layer: "fuel",
    zone: "Fuel farm",
    critical: true,
    pos: [-16, 0, 5],
    size: [3.2, 3.4, 3.2],
    round: true,
    feeds: ["BHR-CHP-01", "BHR-CHP-02", "BHR-CHP-03"],
    dependsOn: [],
  },
  {
    id: "BHR-FUEL-02",
    name: "Fuel Farm — Tank B",
    type: "fuel_tank",
    layer: "fuel",
    zone: "Fuel farm",
    critical: true,
    pos: [-16, 0, 10],
    size: [3.2, 3.4, 3.2],
    round: true,
    feeds: ["BHR-CHP-01", "BHR-CHP-02"],
    dependsOn: [],
  },
  {
    id: "BHR-PMP-01",
    name: "Seawater Pump House",
    type: "pump",
    layer: "water",
    zone: "Quilty Bay intake",
    critical: true,
    pos: [14, 0, 9],
    size: [4, 2.4, 3.6],
    feeds: ["BHR-RO-01"],
    dependsOn: ["BHR-BUS-B"],
  },
  {
    id: "BHR-RO-01",
    name: "Reverse Osmosis Plant",
    type: "water_plant",
    layer: "water",
    zone: "Water treatment",
    critical: true,
    pos: [8.5, 0, 9],
    size: [4, 2.6, 3.4],
    feeds: ["BHR-BLD-01"],
    dependsOn: ["BHR-PMP-01", "BHR-BUS-B"],
  },
  {
    id: "BHR-HVAC-01",
    name: "HVAC / Heat Recovery",
    type: "hvac",
    layer: "hvac",
    zone: "Utility level",
    critical: true,
    pos: [4.5, 0, 8],
    size: [4.4, 2.6, 3.4],
    feeds: ["BHR-BLD-01", "BHR-LAB-01"],
    dependsOn: ["BHR-BUS-A", "BHR-CHP-01"],
  },
  {
    id: "BHR-CMP-01",
    name: "Summer / Emergency Camp",
    type: "building",
    layer: "infrastructure",
    zone: "Seasonal accommodation",
    critical: false,
    pos: [8, 0, -10],
    size: [5.5, 2.4, 3.6],
    feeds: [],
    dependsOn: ["BHR-BUS-B"],
  },
  {
    id: "BHR-COM-01",
    name: "Satellite Communication Dome",
    type: "comms",
    layer: "infrastructure",
    zone: "Comms",
    critical: true,
    pos: [-5, 0, -10],
    size: [1.2, 8, 1.2],
    mast: true,
    feeds: [],
    dependsOn: ["BHR-BUS-A"],
  },
  {
    id: "BHR-AWS-01",
    name: "Automatic Weather Station",
    type: "aws",
    layer: "environment",
    zone: "Promontory",
    critical: false,
    pos: [17, 0, 3],
    size: [1, 5, 1],
    mast: true,
    feeds: [],
    dependsOn: [],
  },
];

export const assetsByStation = {
  maitri: maitriAssets,
  bharati: bharatiAssets,
};

export const allAssets = [...maitriAssets, ...bharatiAssets];

export function getAsset(id) {
  return allAssets.find((a) => a.id === id);
}

/* Power buses are logical assets used by the dependency graph. */
export const powerBuses = {
  maitri: [
    { id: "MTR-BUS-A", name: "Power Bus A", serves: ["MTR-BLD-01", "MTR-LAB-01", "MTR-HVAC-01", "MTR-COM-01"] },
    { id: "MTR-BUS-B", name: "Power Bus B", serves: ["MTR-STR-01", "MTR-PMP-01", "MTR-CMP-01"] },
  ],
  bharati: [
    { id: "BHR-BUS-A", name: "Power Bus A", serves: ["BHR-BLD-01", "BHR-LAB-01", "BHR-HVAC-01", "BHR-COM-01"] },
    { id: "BHR-BUS-B", name: "Power Bus B", serves: ["BHR-STR-01", "BHR-PMP-01", "BHR-RO-01", "BHR-CMP-01"] },
  ],
};

/* Which downstream systems are affected if an asset degrades. */
export function impactChain(assetId) {
  const asset = getAsset(assetId);
  if (!asset) return [];

  const stationKey = assetId.startsWith("MTR") ? "maitri" : "bharati";
  const buses = powerBuses[stationKey];
  const out = [];

  asset.feeds.forEach((target) => {
    const bus = buses.find((b) => b.id === target);
    if (bus) {
      out.push(bus.name);
      bus.serves.forEach((s) => {
        const served = getAsset(s);
        if (served) out.push(served.name);
      });
    } else {
      const served = getAsset(target);
      if (served) out.push(served.name);
    }
  });

  return [...new Set(out)];
}
