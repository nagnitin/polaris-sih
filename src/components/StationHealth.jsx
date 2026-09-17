import { Activity, ChevronDown } from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

import { healthHistory } from "../data/stationData";

export default function StationHealth({ station }) {
  /* Live twin history when available, seeded history before the first ticks */
  const live = station.healthHistory || [];

  const data =
    live.length > 4
      ? live
      : healthHistory.map((item) => ({
          ...item,
          health:
            station.id === "bharati"
              ? Math.max(60, item.health - 4)
              : item.health,
        }));

  const trend = station.healthTrend ?? 0;
  const sensorTrend = station.sensorTrend ?? 0;

  return (
    <section className="dashboard-card health-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon coral-icon">
            <Activity size={24} />
          </div>

          <div>
            <h2>STATION HEALTH</h2>
            <p>Live status and key parameters</p>
          </div>
        </div>

        <div className="card-filters">
          <button className="filter-pill">
            {station.name}
            <ChevronDown size={14} />
          </button>

          <button className="filter-pill">
            Live feed
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="card-divider" />

      <div className="health-content">
        <div className="health-chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barCategoryGap="16%">
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#293435",
                  fontSize: 11,
                }}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(255,255,255,0.15)",
                }}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                }}
              />

              <Bar
                dataKey="health"
                fill="#d8e8e2"
                radius={[9, 9, 9, 9]}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="health-metrics">
          <div className="health-metric">
            <div className="metric-heading">
              <span>OVERALL HEALTH</span>
              <b>
                {trend >= 0 ? "↑" : "↓"} {trend >= 0 ? "+" : ""}
                {trend}%
              </b>
            </div>

            <strong>{station.health}%</strong>

            <p>
              {station.degraded
                ? `${station.degraded} asset(s) need attention`
                : "All systems operational"}
            </p>
          </div>

          <div className="health-metric">
            <div className="metric-heading">
              <span>ACTIVE SENSORS</span>
              <b>
                {sensorTrend >= 0 ? "↑" : "↓"} {sensorTrend >= 0 ? "+" : ""}
                {sensorTrend}%
              </b>
            </div>

            <strong>
              {station.sensorsOnline} / {station.totalSensors}
            </strong>

            <p>Sensors online</p>
          </div>
        </div>
      </div>
    </section>
  );
}
