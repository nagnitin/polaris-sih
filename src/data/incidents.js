/*
  Incident correlation engine (spec §13).

  Individual sensor alerts are noisy. This module groups related signals
  from one asset (and its dependents) into a single incident with a
  probable cause, the affected systems and a recommended response.
*/

import { assetsByStation, impactChain, getAsset } from "./assets";
import { defaultThresholds } from "./simulator";

const SIGNAL_LABELS = {
  temp_c: "Temperature",
  coolant_c: "Coolant temperature",
  vibration_mm_s: "Vibration",
  oil_pressure_bar: "Oil pressure",
  fuel_rate_lph: "Fuel consumption",
  load_kw: "Electrical load",
  heat_kw: "Heat output",
  level_pct: "Tank level",
  flow_lpm: "Flow rate",
  pressure_bar: "Line pressure",
  motor_temp_c: "Motor temperature",
  output_lph: "Water output",
  salinity_ppm: "Permeate salinity",
  supply_c: "Supply air temperature",
  zone_c: "Zone temperature",
  fan_rpm: "Fan speed",
  filter_pct: "Filter condition",
  link_pct: "Link quality",
  latency_ms: "Latency",
  throughput_kbps: "Throughput",
  stock_pct: "Stock level",
  wind_kmh: "Wind speed",
  humidity_pct: "Humidity",
  power_kw: "Power draw",
};

const CAUSE_HINTS = {
  generator: [
    {
      when: (s) => s.includes("temp_c") && s.includes("vibration_mm_s"),
      cause: "Cooling-system degradation with mechanical stress",
      action:
        "Transfer load to the standby set, inspect coolant circuit and radiator, schedule shutdown within the maintenance window.",
    },
    {
      when: (s) => s.includes("oil_pressure_bar"),
      cause: "Lubrication pressure loss",
      action:
        "Check oil level and pump, reduce load to 60%, prepare for controlled shutdown.",
    },
    {
      when: () => true,
      cause: "Abnormal operating envelope",
      action: "Review trend, verify sensor calibration, plan inspection.",
    },
  ],
  chp: [
    {
      when: (s) => s.includes("heat_kw") || s.includes("temp_c"),
      cause: "Heat-recovery efficiency loss",
      action:
        "Balance thermal load across remaining CHP units and inspect the heat exchanger.",
    },
    {
      when: () => true,
      cause: "Abnormal operating envelope",
      action: "Review trend and schedule inspection.",
    },
  ],
  fuel_tank: [
    {
      when: (s) => s.includes("level_pct"),
      cause: "Faster than expected fuel drawdown or line leak",
      action:
        "Verify transfer log against consumption, inspect lines and bunds, re-plan replenishment priority.",
    },
  ],
  pump: [
    {
      when: (s) => s.includes("flow_lpm") || s.includes("pressure_bar"),
      cause: "Intake restriction or impeller wear",
      action:
        "Switch to backup line, inspect intake screen, check for ice formation.",
    },
  ],
  water_plant: [
    {
      when: () => true,
      cause: "Membrane fouling or feed pressure loss",
      action: "Run clean-in-place cycle, verify feed pump, monitor salinity.",
    },
  ],
  hvac: [
    {
      when: () => true,
      cause: "Heating capacity shortfall",
      action:
        "Prioritise living and laboratory zones, verify heat source availability, replace filters.",
    },
  ],
  comms: [
    {
      when: () => true,
      cause: "Satellite link degradation",
      action:
        "Switch to store-and-forward mode; edge gateway will queue telemetry until the link recovers.",
    },
  ],
  store: [
    {
      when: () => true,
      cause: "Cold-storage temperature excursion",
      action: "Check compressor and door seals, verify provisions integrity.",
    },
  ],
  building: [
    {
      when: () => true,
      cause: "Zone conditions outside comfort envelope",
      action: "Verify HVAC supply to the zone and heating distribution.",
    },
  ],
  lab: [
    {
      when: () => true,
      cause: "Laboratory environment deviation",
      action:
        "Protect temperature-sensitive samples and verify HVAC supply to the lab wing.",
    },
  ],
  aws: [
    {
      when: (s) => s.includes("wind_kmh"),
      cause: "Severe wind event",
      action:
        "Restrict outdoor movement, secure loose equipment, postpone external maintenance.",
    },
    {
      when: () => true,
      cause: "Extreme environmental condition",
      action: "Raise heating reserve and review outdoor activity plan.",
    },
  ],
};

function breachedSignals(asset, telemetry, thresholds) {
  const rules = thresholds[asset.type] || {};
  const out = [];

  Object.entries(rules).forEach(([field, rule]) => {
    const value = telemetry[field];
    if (value === undefined) return;

    const breached = rule.lower ? value < rule.warn : value > rule.warn;
    const critical = rule.lower ? value <= rule.crit : value >= rule.crit;

    if (breached) {
      out.push({
        field,
        label: SIGNAL_LABELS[field] || field,
        value,
        limit: rule.warn,
        critical,
        direction: rule.lower ? "below" : "above",
      });
    }
  });

  return out;
}

export function deriveIncidents(
  stationKey,
  stationState,
  thresholds = defaultThresholds
) {
  const incidents = [];

  assetsByStation[stationKey].forEach((asset) => {
    const live = stationState.assets[asset.id];
    if (!live) return;

    const signals = breachedSignals(asset, live.telemetry, thresholds);
    if (!signals.length) return;

    const fields = signals.map((s) => s.field);
    const hints = CAUSE_HINTS[asset.type] || CAUSE_HINTS.building;
    const hint = hints.find((h) => h.when(fields)) || hints[hints.length - 1];

    const severity = signals.some((s) => s.critical)
      ? "critical"
      : live.status === "degraded"
      ? "degraded"
      : "warning";

    incidents.push({
      id: `INC-${asset.id}`,
      station: stationKey,
      assetId: asset.id,
      assetName: asset.name,
      assetType: asset.type,
      zone: asset.zone,
      severity,
      health: live.health,
      failureProbability: live.failureProbability ?? 0,
      rulHours: live.rulHours ?? null,
      signals,
      cause: hint.cause,
      recommendation: hint.action,
      affected: impactChain(asset.id),
      raisedAt: live.history[0]?.t ?? 0,
    });
  });

  const rank = { critical: 0, degraded: 1, warning: 2 };

  return incidents.sort(
    (a, b) =>
      rank[a.severity] - rank[b.severity] || a.health - b.health
  );
}

export function incidentTitle(incident) {
  const asset = getAsset(incident.assetId);
  return `${asset ? asset.name : incident.assetId} — ${incident.cause}`;
}
