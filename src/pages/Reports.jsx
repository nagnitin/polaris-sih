import { useState } from "react";
import { FileText, Download, FileSpreadsheet, Clock } from "lucide-react";

import { PageHeader, Panel } from "../components/UI";
import { stationProfiles } from "../data/stationProfiles";
import { usePolaris } from "../context/PolarisContext";

const REPORT_TYPES = [
  {
    id: "daily",
    title: "Daily operations report",
    text: "Station health, energy, logistics and environment as of this tick.",
  },
  {
    id: "incident",
    title: "Incident report",
    text: "Every correlated incident with cause, affected systems and response.",
  },
  {
    id: "logistics",
    title: "Logistics & autonomy report",
    text: "Inventory, consumption rates and replenishment priority.",
  },
  {
    id: "assets",
    title: "Asset register (CSV)",
    text: "All modelled assets with live health, status and predictions.",
    csv: true,
  },
];

function buildReport(type, ctx) {
  const { stationKey, kpis, station, incidents, assets } = ctx;
  const profile = stationProfiles[stationKey];
  const stamp = new Date().toLocaleString();

  const header =
    `POLARIS — ${profile.name}\n` +
    `Antarctic Digital Twin & Mission Control\n` +
    `Generated: ${stamp}\n` +
    `Data source: PROTOTYPE SIMULATED TELEMETRY\n` +
    `${"=".repeat(64)}\n\n`;

  if (type === "assets") {
    const rows = assets.map((a) => {
      const live = station.assets[a.id];
      return [
        a.id,
        `"${a.name}"`,
        a.type,
        a.layer,
        live.health,
        live.status,
        live.failureProbability ?? "",
        live.rulHours ?? "",
        live.anomaly,
      ].join(",");
    });

    return (
      "asset_id,name,type,layer,health,status,failure_probability_24h,rul_hours,anomaly\n" +
      rows.join("\n")
    );
  }

  if (type === "incident") {
    if (!incidents.length) {
      return header + "No active incidents at the time of generation.\n";
    }

    return (
      header +
      incidents
        .map(
          (i, index) =>
            `INCIDENT #${String(index + 1).padStart(3, "0")} — ${i.severity.toUpperCase()}\n` +
            `Asset      : ${i.assetName} (${i.assetId})\n` +
            `Zone       : ${i.zone}\n` +
            `Health     : ${i.health}/100\n` +
            `Failure    : ${i.failureProbability}% in next 24 h\n` +
            `RUL        : ${i.rulHours ? `${i.rulHours} h` : "n/a"}\n` +
            `Signals    : ${i.signals
              .map((s) => `${s.label} ${s.value} (${s.direction} ${s.limit})`)
              .join("; ")}\n` +
            `Cause      : ${i.cause}\n` +
            `Affected   : ${i.affected.join(", ") || "isolated"}\n` +
            `Response   : ${i.recommendation}\n`
        )
        .join("\n" + "-".repeat(64) + "\n\n")
    );
  }

  if (type === "logistics") {
    const inv = station.inventory;

    return (
      header +
      "LOGISTICS & STATION AUTONOMY\n\n" +
      `Station autonomy      : ${kpis.autonomy}%\n` +
      `Limiting resource     : ${kpis.limitingResource}\n\n` +
      Object.entries(inv)
        .map(
          ([key, item]) =>
            `${item.label.padEnd(18)}: ${Math.round(item.volume).toLocaleString()} ${item.unit} ` +
            `(${Math.round(item.pct)}%) · rate ${Math.round(item.rate)}\n`
        )
        .join("") +
      `\nFuel endurance        : ${kpis.fuelDays} days at ${kpis.fuelRate} L/h\n` +
      `Water endurance       : ${kpis.waterDays} days\n` +
      `Food endurance        : ${kpis.foodDays} days\n` +
      `Power backup          : ${kpis.powerBackupDays} days\n`
    );
  }

  return (
    header +
    "STATION SUMMARY\n\n" +
    `Overall health        : ${kpis.health}%\n` +
    `Risk level            : ${kpis.riskLevel}\n` +
    `Sensors online        : ${kpis.sensorsOnline}/${kpis.totalSensors}\n` +
    `Assets needing action : ${kpis.degraded}\n\n` +
    "ENERGY\n" +
    `Generation            : ${kpis.generation} kW\n` +
    `Fuel burn             : ${kpis.fuelRate} L/h\n\n` +
    "ENVIRONMENT\n" +
    `Temperature           : ${station.env.temp} °C\n` +
    `Wind speed            : ${station.env.wind} km/h\n` +
    `Humidity              : ${station.env.humidity} %\n` +
    `Pressure              : ${station.env.pressure} hPa\n\n` +
    "LOGISTICS\n" +
    `Station autonomy      : ${kpis.autonomy}% (limited by ${kpis.limitingResource})\n` +
    `Fuel endurance        : ${kpis.fuelDays} days\n\n` +
    "ACTIVE INCIDENTS\n" +
    (incidents.length
      ? incidents
          .map(
            (i) =>
              `- [${i.severity.toUpperCase()}] ${i.assetName}: ${i.cause} ` +
              `(health ${i.health}, ${i.failureProbability}% / 24 h)\n`
          )
          .join("")
      : "- none\n")
  );
}

export default function Reports() {
  const ctx = usePolaris();
  const { stationKey, logAction } = ctx;

  const [active, setActive] = useState("daily");
  const [history, setHistory] = useState([]);

  const type = REPORT_TYPES.find((r) => r.id === active);
  const content = buildReport(active, ctx);

  function download() {
    const blob = new Blob([content], {
      type: type.csv ? "text/csv" : "text/plain",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");

    link.href = url;
    link.download = `polaris-${stationKey}-${active}-${stamp}.${
      type.csv ? "csv" : "txt"
    }`;

    link.click();
    URL.revokeObjectURL(url);

    setHistory((prev) =>
      [
        {
          at: new Date().toLocaleTimeString(),
          title: type.title,
          station: stationKey,
        },
        ...prev,
      ].slice(0, 8)
    );

    logAction("Report exported", `${type.title} · ${stationKey}`);
  }

  return (
    <div className="page">
      <PageHeader
        icon={FileText}
        title="REPORTS"
        subtitle="Operational and scientific reporting generated from the live twin"
      />

      <div className="report-layout">
        <div className="report-types">
          {REPORT_TYPES.map((r) => (
            <button
              key={r.id}
              className={`report-type ${active === r.id ? "on" : ""}`}
              onClick={() => setActive(r.id)}
            >
              {r.csv ? <FileSpreadsheet size={18} /> : <FileText size={18} />}

              <div>
                <strong>{r.title}</strong>
                <span>{r.text}</span>
              </div>
            </button>
          ))}

          {history.length > 0 && (
            <div className="report-history">
              <h4>
                <Clock size={14} /> Recent exports
              </h4>

              {history.map((h, index) => (
                <div key={index}>
                  <span>{h.title}</span>
                  <em>{h.at}</em>
                </div>
              ))}
            </div>
          )}
        </div>

        <Panel
          tone="dark"
          title={type.title}
          subtitle="Preview — values are captured at the moment of export"
          actions={
            <button className="primary-button" onClick={download}>
              <Download size={15} /> Export
            </button>
          }
          className="report-preview-panel"
        >
          <pre className="report-preview">{content}</pre>
        </Panel>
      </div>
    </div>
  );
}
