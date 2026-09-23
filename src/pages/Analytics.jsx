import { useState } from "react";
import { ChartNoAxesCombined, Brain, TrendingDown, Cpu } from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Cell,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { PageHeader, Panel, Metric, StatusPill, Bar, SimBadge } from "../components/UI";
import AssetDetailPanel from "../components/AssetDetailPanel";
import { STATUS } from "../data/assets";
import { usePolaris } from "../context/PolarisContext";

const MODELS = [
  {
    name: "Neural asset forecaster",
    approach: "28→32→16→3 MLP (scikit-learn, 38.5k samples)",
    purpose:
      "Failure risk %, energy demand kW and attention index per asset, straight from live twin state",
    live: true,
  },
  {
    name: "Anomaly detection",
    approach: "Isolation Forest / statistical rules",
    purpose: "Flags sensor behaviour outside the learned envelope",
  },
  {
    name: "Failure prediction",
    approach: "Random Forest / XGBoost",
    purpose: "Probability of equipment failure in the next 24 h",
  },
  {
    name: "Demand forecasting",
    approach: "Gradient-boosted time series",
    purpose: "Power, heating and fuel demand ahead of weather fronts",
  },
  {
    name: "Health scoring",
    approach: "Weighted rules + model outputs",
    purpose: "Converts many signals into one asset score",
  },
];

export default function Analytics({ navigate }) {
  const {
    assets,
    station,
    kpis,
    selectedAssetId,
    setSelectedAssetId,
    aiForecast,
  } = usePolaris();

  const [sort, setSort] = useState("risk");

  const rows = assets
    .map((def) => {
      const live = station.assets[def.id];

      return {
        def,
        live,
        risk: live.failureProbability ?? 0,
        health: live.health,
        anomaly: live.anomaly,
      };
    })
    .sort((a, b) =>
      sort === "risk"
        ? b.risk - a.risk
        : sort === "health"
        ? a.health - b.health
        : b.anomaly - a.anomaly
    );

  const watchlist = rows.filter((r) => r.health < 90).slice(0, 4);

  const trendData = (watchlist.length ? watchlist : rows.slice(0, 3)).map(
    (r) => ({
      id: r.def.id,
      name: r.def.name,
      series: r.live.history.map((h) => ({ t: h.t, health: h.health })),
    })
  );

  const merged = (trendData[0]?.series || []).map((point, index) => {
    const row = { t: point.t };
    trendData.forEach((series) => {
      row[series.id] = series.series[index]?.health;
    });
    return row;
  });

  const scatter = rows.map((r) => ({
    x: r.anomaly,
    y: r.risk,
    z: 100 - r.health,
    name: r.def.name,
    status: r.live.status,
  }));

  const selected = assets.find((a) => a.id === selectedAssetId);

  const avgAnomaly =
    rows.reduce((s, r) => s + r.anomaly, 0) / Math.max(1, rows.length);

  return (
    <div className="page">
      <PageHeader
        icon={ChartNoAxesCombined}
        title="ANALYTICS & PREDICTIVE MAINTENANCE"
        subtitle="Anomaly detection, failure probability and remaining useful life"
      >
        <SimBadge label="PROTOTYPE MODELS" />
      </PageHeader>

      <div className="metric-row">
        <Metric
          label="Station health"
          value={kpis.health}
          unit="%"
          hint={`Risk level ${kpis.riskLevel}`}
          tone="green"
        />

        <Metric
          label="Assets at risk"
          value={rows.filter((r) => r.risk >= 25).length}
          hint="Failure probability ≥ 25% / 24 h"
          tone="coral"
        />

        <Metric
          label="Mean anomaly score"
          value={avgAnomaly.toFixed(2)}
          hint="0 = nominal, 1 = far outside envelope"
          tone="amber"
        />

        <Metric
          label="Shortest RUL"
          value={
            rows
              .map((r) => r.live.rulHours)
              .filter(Boolean)
              .sort((a, b) => a - b)[0] ?? "—"
          }
          unit=" h"
          hint="Lowest remaining useful life in the fleet"
          tone="blue"
        />
      </div>

      <div className="analytics-layout">
        <div className="analytics-main">
          <Panel
            tone="dark"
            title="Neural forecast — station level"
            subtitle="Trained network scoring every asset from the live twin state"
            actions={<Brain size={17} />}
          >
            <div className="ai-station-metrics">
              <div>
                <span>Weighted failure risk</span>
                <strong>{aiForecast.avgFailureRiskPct}%</strong>
              </div>

              <div>
                <span>Predicted demand</span>
                <strong>{aiForecast.totalEnergyKw} kW</strong>
              </div>

              <div>
                <span>Attention index</span>
                <strong>{Math.round(aiForecast.avgOperationalDemand)}/100</strong>
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Highest-risk assets (model)</th>
                    <th>Failure risk</th>
                    <th>Predicted demand</th>
                    <th>Attention</th>
                  </tr>
                </thead>

                <tbody>
                  {aiForecast.topRisk.map(({ asset, failureRiskPct, energyDemandKw, operationalDemand }) => (
                    <tr
                      key={asset.id}
                      className={selectedAssetId === asset.id ? "is-selected" : ""}
                      onClick={() => setSelectedAssetId(asset.id)}
                    >
                      <td>
                        <strong>{asset.name}</strong>
                        <small>{asset.zone}</small>
                      </td>

                      <td>
                        <span
                          className={
                            failureRiskPct >= 50
                              ? "ai-risk-coral"
                              : failureRiskPct >= 25
                              ? "ai-risk-amber"
                              : "ai-risk-green"
                          }
                        >
                          {failureRiskPct.toFixed(1)}%
                        </span>
                      </td>

                      <td>{energyDemandKw.toFixed(1)} kW</td>
                      <td>{Math.round(operationalDemand)}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            tone="dark"
            title="Asset health ranking"
            subtitle="Click a row to open the asset inspector"
            actions={
              <div className="segmented">
                {["risk", "health", "anomaly"].map((key) => (
                  <button
                    key={key}
                    className={sort === key ? "on" : ""}
                    onClick={() => setSort(key)}
                  >
                    {key}
                  </button>
                ))}
              </div>
            }
          >
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Status</th>
                    <th>Health</th>
                    <th>Failure / 24 h</th>
                    <th>RUL</th>
                    <th>Anomaly</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map(({ def, live, risk }) => (
                    <tr
                      key={def.id}
                      className={selectedAssetId === def.id ? "is-selected" : ""}
                      onClick={() => setSelectedAssetId(def.id)}
                    >
                      <td>
                        <strong>{def.name}</strong>
                        <small>{def.zone}</small>
                      </td>

                      <td>
                        <StatusPill status={live.status} />
                      </td>

                      <td className="cell-bar">
                        <Bar
                          value={live.health}
                          tone={
                            live.health > 85
                              ? "green"
                              : live.health > 65
                              ? "amber"
                              : "coral"
                          }
                        />
                        <span>{live.health}</span>
                      </td>

                      <td>{risk}%</td>
                      <td>{live.rulHours ? `${live.rulHours} h` : "—"}</td>
                      <td>{live.anomaly}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="split-grid">
            <Panel
              tone="dark"
              title="Health trend — watchlist"
              subtitle="Degradation is visible before failure"
              actions={<TrendingDown size={17} />}
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={merged}>
                  <CartesianGrid stroke="#3c4648" vertical={false} />

                  <XAxis dataKey="t" hide />

                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#9fb0b2", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={34}
                  />

                  <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />

                  {trendData.map((series, index) => (
                    <Line
                      key={series.id}
                      type="monotone"
                      dataKey={series.id}
                      name={series.name}
                      stroke={
                        ["#ff9b8e", "#ffdf83", "#8de5f1", "#aabaff"][index % 4]
                      }
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              <div className="chart-legend light">
                {trendData.map((series, index) => (
                  <span key={series.id}>
                    <i
                      className="legend-dot"
                      style={{
                        background:
                          ["#ff9b8e", "#ffdf83", "#8de5f1", "#aabaff"][index % 4],
                      }}
                    />
                    {series.name}
                  </span>
                ))}
              </div>
            </Panel>

            <Panel
              tone="dark"
              title="Anomaly vs failure probability"
              subtitle="Upper-right quadrant needs attention first"
              actions={<Brain size={17} />}
            >
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid stroke="#3c4648" />

                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Anomaly"
                    domain={[0, 1]}
                    tick={{ fill: "#9fb0b2", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Failure %"
                    tick={{ fill: "#9fb0b2", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={34}
                  />

                  <ZAxis type="number" dataKey="z" range={[40, 260]} />

                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{ borderRadius: 12, border: "none" }}
                    formatter={(value, key) => [value, key]}
                  />

                  <Scatter data={scatter} fill="#8de5f1" name="Assets">
                    {scatter.map((point, index) => (
                      <Cell
                        key={index}
                        fill={STATUS[point.status].color}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <Panel
            tone="mint"
            title="Model inventory"
            subtitle="What runs behind each number in this page"
            actions={<Cpu size={18} />}
          >
            <div className="table-wrap">
              <table className="data-table light">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Prototype approach</th>
                    <th>Purpose</th>
                  </tr>
                </thead>

                <tbody>
                  {MODELS.map((m) => (
                    <tr key={m.name}>
                      <td>
                        <strong>{m.name}</strong>
                        {m.live && <em className="ai-live-badge">LIVE</em>}
                      </td>
                      <td>{m.approach}</td>
                      <td>{m.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {selected && (
          <AssetDetailPanel
            asset={selected}
            onClose={() => setSelectedAssetId(null)}
            onSimulate={() => navigate("Simulation")}
            onHistory={() => navigate("3D Twin")}
          />
        )}
      </div>
    </div>
  );
}
