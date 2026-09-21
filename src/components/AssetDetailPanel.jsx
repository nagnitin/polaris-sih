import { History, FlaskConical, Wrench, X, Crosshair } from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  YAxis,
  Tooltip,
} from "recharts";

import { baselines, impactChain, STATUS } from "../data/assets";
import { usePolaris } from "../context/PolarisContext";
import { StatusPill } from "./UI";

const FIELD_LABELS = {
  load_kw: "Power output",
  heat_kw: "Heat output",
  temp_c: "Temperature",
  coolant_c: "Coolant",
  vibration_mm_s: "Vibration",
  oil_pressure_bar: "Oil pressure",
  fuel_rate_lph: "Fuel rate",
  level_pct: "Tank level",
  flow_lpm: "Flow",
  pressure_bar: "Pressure",
  motor_temp_c: "Motor temp",
  output_lph: "Output",
  salinity_ppm: "Salinity",
  supply_c: "Supply air",
  zone_c: "Zone temp",
  fan_rpm: "Fan speed",
  filter_pct: "Filter",
  power_kw: "Power draw",
  occupancy: "Occupancy",
  stock_pct: "Stock",
  humidity_pct: "Humidity",
  link_pct: "Link quality",
  latency_ms: "Latency",
  throughput_kbps: "Throughput",
  wind_kmh: "Wind speed",
  pressure_hpa: "Pressure",
};

export default function AssetDetailPanel({
  asset,
  onClose,
  onSimulate,
  onHistory,
}) {
  const { station, logAction } = usePolaris();

  if (!asset) return null;

  const live = station.assets[asset.id];
  if (!live) return null;

  const spec = baselines[asset.type] || {};
  const affected = impactChain(asset.id);

  const series = live.history.map((h) => ({
    t: h.t,
    health: h.health,
  }));

  return (
    <aside className="asset-panel">
      <div className="asset-panel-head">
        <div>
          <span className="asset-id">{asset.id}</span>
          <h3>{asset.name}</h3>
          <p>{asset.zone}</p>
        </div>

        {onClose && (
          <button
            className="ghost-icon"
            onClick={onClose}
            aria-label="Close asset details"
          >
            <X size={17} />
          </button>
        )}
      </div>

      <div className="asset-status-row">
        <StatusPill status={live.status} />

        <div className="asset-health">
          <strong>{live.health}</strong>
          <span>/ 100 health</span>
        </div>
      </div>

      <div className="asset-spark">
        <ResponsiveContainer width="100%" height={64}>
          <AreaChart data={series}>
            <defs>
              <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={STATUS[live.status].color}
                  stopOpacity={0.55}
                />
                <stop
                  offset="100%"
                  stopColor={STATUS[live.status].color}
                  stopOpacity={0.04}
                />
              </linearGradient>
            </defs>

            <YAxis domain={[0, 100]} hide />

            <Tooltip
              contentStyle={{ borderRadius: 10, border: "none" }}
              labelFormatter={() => "Health"}
            />

            <Area
              type="monotone"
              dataKey="health"
              stroke={STATUS[live.status].color}
              strokeWidth={2}
              fill="url(#hg)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="asset-telemetry">
        {Object.entries(live.telemetry).map(([key, value]) => (
          <div className="telemetry-row" key={key}>
            <span>{FIELD_LABELS[key] || key}</span>

            <strong>
              {typeof value === "number" ? value.toFixed(1) : value}
              <em>{spec[key]?.unit || ""}</em>
            </strong>
          </div>
        ))}
      </div>

      {live.failureProbability !== undefined && (
        <div className="asset-prediction">
          <div>
            <span>Failure probability</span>
            <strong>{live.failureProbability}% / 24 h</strong>
          </div>

          <div>
            <span>Predicted RUL</span>
            <strong>
              {live.rulHours ? `${live.rulHours} h` : "—"}
            </strong>
          </div>

          <div>
            <span>Anomaly score</span>
            <strong>{live.anomaly}</strong>
          </div>
        </div>
      )}

      {affected.length > 0 && (
        <div className="asset-affected">
          <span>If this asset fails</span>

          <div className="chip-row">
            {affected.map((name) => (
              <span className="chip" key={name}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        className="twin-center-button"
        onClick={() =>
          window.dispatchEvent(new Event("polaris-refocus"))
        }
      >
        <Crosshair size={15} /> Center camera on asset
      </button>

      <div className="asset-actions">
        <button
          onClick={() => {
            logAction("Asset history opened", asset.id);
            onHistory?.(asset);
          }}
        >
          <History size={15} /> History
        </button>

        <button onClick={() => onSimulate?.(asset)}>
          <FlaskConical size={15} /> Simulate
        </button>

        <button
          onClick={() =>
            logAction("Maintenance record requested", asset.id)
          }
        >
          <Wrench size={15} /> Maintenance
        </button>
      </div>

      <p className="asset-footnote">
        Prototype telemetry. Thresholds are configuration data and must be
        replaced with authorised NCPOR values before operational use.
      </p>
    </aside>
  );
}
