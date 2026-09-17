/*
  What-if simulation engine (spec §12) and optimisation helpers (spec §10).

  The engine works on a sandboxed copy of the current twin state. It never
  mutates live operational state and never sends commands to equipment —
  the prototype boundary is READ + ANALYSE + SIMULATE (spec §15).
*/

import { assetsByStation, impactChain } from "./assets";
import { stationKpis } from "./simulator";

export const SCENARIOS = [
  {
    id: "generator_failure",
    label: "Generator / CHP failure",
    description: "One prime mover is lost for the scenario duration.",
    needsAsset: true,
    assetTypes: ["generator", "chp"],
  },
  {
    id: "extreme_cold",
    label: "Extreme cold event",
    description: "Outside temperature drops and heating demand rises.",
    needsAsset: false,
  },
  {
    id: "fuel_delay",
    label: "Fuel replenishment delay",
    description: "Resupply slips; consumption continues at current rate.",
    needsAsset: false,
  },
  {
    id: "pump_failure",
    label: "Water system / pump failure",
    description: "Water production stops and stored water is consumed.",
    needsAsset: true,
    assetTypes: ["pump", "water_plant"],
  },
  {
    id: "multi_degradation",
    label: "Multiple asset degradation",
    description: "Two assets degrade at the same time under load.",
    needsAsset: true,
    assetTypes: ["generator", "chp", "pump", "hvac"],
  },
  {
    id: "comms_outage",
    label: "Communication / satellite outage",
    description: "Link is lost; the station runs on the local twin only.",
    needsAsset: false,
  },
];

function heatingDemandKw(outsideTemp, personnel) {
  /* Simplified envelope model: baseline + loss proportional to ΔT. */
  const deltaT = 21 - outsideTemp;
  return Math.round(38 + deltaT * 3.6 + personnel * 0.9);
}

export function runScenario({
  stationKey,
  stationState,
  scenario,
  assetId,
  durationH = 72,
  outsideTemp = -31,
  personnel = 42,
}) {
  const defs = assetsByStation[stationKey];
  const kpis = stationKpis(stationKey, stationState);

  const primeMovers = defs.filter(
    (a) => a.type === "generator" || a.type === "chp"
  );

  const liveOf = (id) => stationState.assets[id];

  const generationBefore = Math.round(
    primeMovers.reduce((s, a) => s + (liveOf(a.id).telemetry.load_kw || 0), 0)
  );

  const heatBefore = Math.round(
    primeMovers.reduce((s, a) => s + (liveOf(a.id).telemetry.heat_kw || 0), 0) ||
      defs
        .filter((a) => a.type === "hvac")
        .reduce((s, a) => s + (liveOf(a.id).telemetry.supply_c || 0) * 4, 0)
  );

  const fuelRateBefore = Math.round(
    primeMovers.reduce((s, a) => s + (liveOf(a.id).telemetry.fuel_rate_lph || 0), 0)
  );

  const waterBefore = Math.round(
    defs
      .filter((a) => a.type === "water_plant" || a.type === "pump")
      .reduce(
        (s, a) =>
          s +
          (liveOf(a.id).telemetry.output_lph ||
            (liveOf(a.id).telemetry.flow_lpm || 0) * 60),
        0
      )
  );

  const demandBefore = heatingDemandKw(stationState.env.temp, personnel);

  let generationAfter = generationBefore;
  let heatAfter = heatBefore;
  let fuelRateAfter = fuelRateBefore;
  let waterAfter = waterBefore;
  let demandAfter = demandBefore;
  let affected = [];
  let narrative = "";
  const actions = [];

  switch (scenario) {
    case "generator_failure": {
      const lost = primeMovers.find((a) => a.id === assetId) || primeMovers[1];
      const lostLoad = liveOf(lost.id).telemetry.load_kw || 0;
      const lostHeat = liveOf(lost.id).telemetry.heat_kw || 0;

      const standby = primeMovers.find((a) => a.standby && a.id !== lost.id);
      const spare = standby
        ? Math.round((liveOf(standby.id).telemetry.load_kw || 0) * 6.5)
        : 0;

      generationAfter = Math.round(
        generationBefore - lostLoad + Math.min(spare, lostLoad)
      );
      heatAfter = Math.round(heatBefore - lostHeat * 0.8);
      fuelRateAfter = Math.round(fuelRateBefore * 1.08);
      demandAfter = heatingDemandKw(outsideTemp, personnel);
      affected = impactChain(lost.id);

      narrative =
        `${lost.name} is unavailable for ${durationH} h. The standby unit ` +
        `covers most of the electrical load, but combined heat output drops ` +
        `while heating demand rises at ${outsideTemp} °C.`;

      if (standby) {
        actions.push({
          action: `Start ${standby.name} and transfer load`,
          effect: `+${Math.min(spare, Math.round(lostLoad))} kW restored`,
        });
      }
      actions.push({
        action: "Shed non-essential laboratory loads (deferrable experiments)",
        effect: "-18 kW demand",
      });
      actions.push({
        action: "Reduce summer-camp zone set point to 12 °C",
        effect: "-22 kW heating demand",
      });
      actions.push({
        action: "Prioritise living quarters, medical room and lab cold chain",
        effect: "Critical zones held at 20 °C",
      });
      break;
    }

    case "extreme_cold": {
      demandAfter = heatingDemandKw(outsideTemp, personnel);
      heatAfter = heatBefore;
      fuelRateAfter = Math.round(
        fuelRateBefore * (1 + Math.max(0, (-outsideTemp - 12) / 45))
      );
      generationAfter = Math.round(generationBefore * 1.12);
      affected = ["Heating distribution", "Fuel reserve", "Power Bus A"];

      narrative =
        `Sustained ${outsideTemp} °C for ${durationH} h raises heating demand ` +
        `to ${demandAfter} kW and increases fuel burn by ` +
        `${Math.max(0, fuelRateAfter - fuelRateBefore)} L/h.`;

      actions.push({
        action: "Pre-heat thermal mass before the front arrives",
        effect: "Smooths peak demand by ~14%",
      });
      actions.push({
        action: "Run two prime movers at 70% instead of one at 95%",
        effect: "Better efficiency, lower failure risk",
      });
      actions.push({
        action: "Postpone outdoor maintenance tasks",
        effect: "Personnel safety",
      });
      break;
    }

    case "fuel_delay": {
      fuelRateAfter = fuelRateBefore;
      demandAfter = heatingDemandKw(outsideTemp, personnel);
      affected = ["Fuel farm", "All prime movers", "Heating", "Station autonomy"];

      narrative =
        `Replenishment is delayed by ${Math.round(durationH / 24)} days. ` +
        `At the current ${fuelRateBefore} L/h burn rate the reserve continues ` +
        `to fall without resupply.`;

      actions.push({
        action: "Move to single-generator operation during low-demand hours",
        effect: `-${Math.round(fuelRateBefore * 0.22)} L/h`,
      });
      actions.push({
        action: "Lower non-critical zone set points by 2 °C",
        effect: "-9% heating fuel",
      });
      actions.push({
        action: "Defer vehicle refuelling to essential trips",
        effect: "Protects generator reserve",
      });
      break;
    }

    case "pump_failure": {
      const lost =
        defs.find((a) => a.id === assetId) ||
        defs.find((a) => a.type === "pump");
      waterAfter = 0;
      affected = impactChain(lost.id);

      narrative =
        `${lost.name} is offline for ${durationH} h. Water production stops ` +
        `and the station draws on stored water only.`;

      actions.push({
        action: "Switch to stored water and restrict non-essential use",
        effect: "Extends supply by ~40%",
      });
      actions.push({
        action: "Melt-water contingency for drinking supply",
        effect: "Maintains potable water",
      });
      actions.push({
        action: "Inspect intake for ice blockage",
        effect: "Primary repair path",
      });
      break;
    }

    case "multi_degradation": {
      const a1 = primeMovers[1] || primeMovers[0];
      const a2 =
        defs.find((a) => a.type === "hvac") || defs.find((a) => a.type === "pump");

      generationAfter = Math.round(generationBefore * 0.68);
      heatAfter = Math.round(heatBefore * 0.6);
      fuelRateAfter = Math.round(fuelRateBefore * 1.14);
      demandAfter = heatingDemandKw(outsideTemp, personnel);
      affected = [...new Set([...impactChain(a1.id), ...impactChain(a2.id)])];

      narrative =
        `${a1.name} and ${a2.name} degrade together. Reserve margin narrows ` +
        `and the station depends on the standby unit for ${durationH} h.`;

      actions.push({
        action: "Declare reduced-capacity operating mode",
        effect: "Protects critical systems",
      });
      actions.push({
        action: "Sequence repairs: prime mover first, then HVAC",
        effect: "Restores 68% capacity in ~6 h",
      });
      break;
    }

    case "comms_outage": {
      affected = ["Mission control link", "Telemetry sync", "Remote support"];
      narrative =
        `Satellite link lost for ${durationH} h. The edge gateway keeps the ` +
        `local twin running, applies local rules and queues telemetry for ` +
        `synchronisation when the link returns.`;

      actions.push({
        action: "Switch to store-and-forward buffering at the edge gateway",
        effect: `~${Math.round(durationH * 4)} MB queued`,
      });
      actions.push({
        action: "Run local rule engine for alerting",
        effect: "Alerts continue on station",
      });
      actions.push({
        action: "Daily HF voice schedule as fallback",
        effect: "Maintains contact",
      });
      break;
    }

    default:
      break;
  }

  const reserveBefore = generationBefore - demandBefore;
  const reserveAfter = generationAfter - demandAfter;

  const fuelDaysBefore = kpis.fuelDays;
  const fuelDaysAfter = Math.floor(
    (stationState.inventory.fuel.volume -
      (fuelRateAfter * durationH)) /
      Math.max(1, fuelRateAfter * 24)
  );

  const autonomyAfter = Math.max(
    0,
    Math.round(kpis.autonomy * (fuelDaysAfter / Math.max(1, fuelDaysBefore)))
  );

  const risk =
    reserveAfter < 0 || autonomyAfter < 25
      ? "HIGH"
      : reserveAfter < 25 || autonomyAfter < 45
      ? "ELEVATED"
      : reserveAfter < 55
      ? "MODERATE"
      : "LOW";

  return {
    scenario,
    durationH,
    outsideTemp,
    personnel,
    narrative,
    affected,
    actions,
    risk,
    rows: [
      {
        label: "Power availability",
        unit: "kW",
        before: generationBefore,
        after: generationAfter,
      },
      {
        label: "Heating capacity",
        unit: "kW",
        before: heatBefore,
        after: heatAfter,
      },
      {
        label: "Heating demand",
        unit: "kW",
        before: demandBefore,
        after: demandAfter,
        invert: true,
      },
      {
        label: "Reserve margin",
        unit: "kW",
        before: reserveBefore,
        after: reserveAfter,
      },
      {
        label: "Fuel consumption",
        unit: "L/h",
        before: fuelRateBefore,
        after: fuelRateAfter,
        invert: true,
      },
      {
        label: "Water production",
        unit: "L/h",
        before: waterBefore,
        after: waterAfter,
      },
      {
        label: "Fuel endurance",
        unit: "days",
        before: fuelDaysBefore,
        after: Math.max(0, fuelDaysAfter),
      },
      {
        label: "Station autonomy",
        unit: "%",
        before: kpis.autonomy,
        after: autonomyAfter,
      },
    ],
  };
}

/* ---------- optimisation (spec §10) ---------- */

export function optimiseGenerators(stationKey, stationState) {
  const defs = assetsByStation[stationKey].filter(
    (a) => a.type === "generator" || a.type === "chp"
  );

  const units = defs.map((def) => {
    const live = stationState.assets[def.id];
    const load = live.telemetry.load_kw || 0;
    const fuel = live.telemetry.fuel_rate_lph || 0;
    const efficiency = load > 0 ? load / Math.max(0.1, fuel) : 0;

    return {
      id: def.id,
      name: def.name,
      standby: !!def.standby,
      health: live.health,
      status: live.status,
      load: Math.round(load),
      fuel: Math.round(fuel * 10) / 10,
      efficiency: Math.round(efficiency * 100) / 100,
    };
  });

  const totalLoad = units.reduce((s, u) => s + u.load, 0);
  const active = units.filter((u) => !u.standby);
  const healthiest = [...active].sort((a, b) => b.health - a.health)[0];
  const weakest = [...active].sort((a, b) => a.health - b.health)[0];

  const recommendations = [];

  if (weakest && healthiest && weakest.id !== healthiest.id) {
    const shift = Math.round(
      Math.min(weakest.load * 0.35, (100 - healthiest.health) + 30)
    );

    if (weakest.health < 92 && shift > 5) {
      recommendations.push({
        title: `Shift ${shift} kW from ${weakest.name} to ${healthiest.name}`,
        why: `${weakest.name} is at health ${weakest.health} while ${healthiest.name} has margin.`,
        gain: `Failure risk -${Math.min(38, Math.round(shift / 2))}% · fuel -${(shift * 0.06).toFixed(1)} L/h`,
      });
    }
  }

  const worstEff = [...active].sort((a, b) => a.efficiency - b.efficiency)[0];
  if (worstEff && active.length > 1) {
    recommendations.push({
      title: `Rebalance to 70–75% loading per unit`,
      why: `${worstEff.name} runs at ${worstEff.efficiency} kW/L, below the fleet best.`,
      gain: `~${(totalLoad * 0.04).toFixed(0)} kW equivalent fuel saving per hour`,
    });
  }

  recommendations.push({
    title: "Align heavy laboratory loads with the CHP heat window",
    why: "Thermal and electrical peaks currently overlap poorly.",
    gain: "Peak demand -9% · smoother generator loading",
  });

  return { units, totalLoad, recommendations };
}
