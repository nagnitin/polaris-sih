import { Zap, Sparkles, Flame } from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { PageHeader, Panel, Metric, StatusPill, Bar, SimBadge } from "../components/UI";
import { optimiseGenerators } from "../data/simulationEngine";
import { usePolaris } from "../context/PolarisContext";

export default function Energy({ navigate }) {
  const { station, stationKey, kpis, setSelectedAssetId } = usePolaris();

  const { units, totalLoad, recommendations } = optimiseGenerators(
    stationKey,
    station
  );

  const history = station.loadHistory.slice(-24);

  const heating = station.loadHistory.slice(-24).map((h) => ({
    time: h.time,
    heating: h.heating,
    outside: station.envHistory.find((e) => e.t === h.t)?.temperature ?? 0,
  }));

  const reserve = kpis.generation - Math.round(kpis.generation * 0.86);

  return (
    <div className="page">
      <PageHeader
        icon={Zap}
        title="ENERGY"
        subtitle="Power generation, heating load and generator scheduling"
      >
        <SimBadge />
      </PageHeader>

      <div className="metric-row">
        <Metric
          label="Total generation"
          value={kpis.generation}
          unit="kW"
          hint={`${units.filter((u) => !u.standby).length} units online`}
          tone="amber"
        />

        <Metric
          label="Reserve margin"
          value={reserve}
          unit="kW"
          hint={reserve > 25 ? "Healthy headroom" : "Tight — review loading"}
          tone="green"
        />

        <Metric
          label="Fuel burn"
          value={kpis.fuelRate}
          unit="L/h"
          hint={`${kpis.fuelRate * 24} L per day`}
          tone="coral"
        />

        <Metric
          label="Fuel endurance"
          value={kpis.fuelDays}
          unit="days"
          hint={`Limiting resource: ${kpis.limitingResource}`}
          tone="blue"
        />
      </div>

      <div className="split-grid">
        <Panel
          tone="dark"
          title="Generation vs demand"
          subtitle="Rolling window of the live twin"
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="genFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffdf83" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#ffdf83" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#3c4648" vertical={false} />

              <XAxis
                dataKey="time"
                tick={{ fill: "#9fb0b2", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fill: "#9fb0b2", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={38}
              />

              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none" }}
              />

              <Area
                type="monotone"
                dataKey="generation"
                stroke="#ffdf83"
                strokeWidth={2}
                fill="url(#genFill)"
                name="Generation (kW)"
              />

              <Line
                type="monotone"
                dataKey="demand"
                stroke="#8de5f1"
                strokeWidth={2}
                dot={false}
                name="Demand (kW)"
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="chart-legend light">
            <span>
              <i className="legend-dot" style={{ background: "#ffdf83" }} />
              Generation
            </span>
            <span>
              <i className="legend-dot" style={{ background: "#8de5f1" }} />
              Demand
            </span>
          </div>
        </Panel>

        <Panel
          tone="dark"
          title="Heating load vs outside temperature"
          subtitle="Colder air drives heating demand and fuel burn"
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={heating}>
              <CartesianGrid stroke="#3c4648" vertical={false} />

              <XAxis
                dataKey="time"
                tick={{ fill: "#9fb0b2", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                yAxisId="left"
                tick={{ fill: "#9fb0b2", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={38}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#9fb0b2", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={38}
              />

              <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />

              <Line
                yAxisId="left"
                type="monotone"
                dataKey="heating"
                stroke="#ff9b8e"
                strokeWidth={2}
                dot={false}
                name="Heating (kW)"
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="outside"
                stroke="#aabaff"
                strokeWidth={2}
                dot={false}
                name="Outside (°C)"
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="chart-legend light">
            <span>
              <i className="legend-dot" style={{ background: "#ff9b8e" }} />
              Heating demand
            </span>
            <span>
              <i className="legend-dot" style={{ background: "#aabaff" }} />
              Outside temperature
            </span>
          </div>
        </Panel>
      </div>

      <Panel
        tone="dark"
        title="Prime movers"
        subtitle={`${totalLoad} kW combined · click a unit to inspect it in the twin`}
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Status</th>
                <th>Health</th>
                <th>Load</th>
                <th>Fuel rate</th>
                <th>Efficiency</th>
                <th>Loading</th>
              </tr>
            </thead>

            <tbody>
              {units.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => {
                    setSelectedAssetId(u.id);
                    navigate("3D Twin");
                  }}
                >
                  <td>
                    <strong>{u.name}</strong>
                    <small>{u.id}</small>
                  </td>

                  <td>
                    <StatusPill status={u.status} />
                  </td>

                  <td>{u.health}</td>
                  <td>{u.load} kW</td>
                  <td>{u.fuel} L/h</td>
                  <td>{u.efficiency} kW/L</td>

                  <td className="cell-bar">
                    <Bar
                      value={u.load}
                      max={140}
                      tone={u.load > 110 ? "amber" : "green"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        tone="mint"
        title="Optimisation recommendations"
        subtitle="Generator scheduling and load balancing — advisory only, no equipment is controlled"
        actions={<Sparkles size={18} />}
      >
        <div className="reco-grid">
          {recommendations.map((r) => (
            <div className="reco-card" key={r.title}>
              <Flame size={16} />
              <strong>{r.title}</strong>
              <p>{r.why}</p>
              <span className="reco-gain">{r.gain}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
