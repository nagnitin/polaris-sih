import {
  Thermometer,
  Wind,
  Droplets,
  Gauge,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
} from "recharts";

import { environmentalHistory } from "../data/stationData";

export default function EnvironmentalMonitoring({
  station,
}) {
  const history =
    station.envHistory && station.envHistory.length > 4
      ? station.envHistory
      : environmentalHistory;

  const metrics = [
    {
      label: "Temperature",
      value: `${station.temperature}\u00b0C`,
      change: station.temperatureChange,
      icon: Thermometer,
    },
    {
      label: "Wind Speed",
      value: `${station.windSpeed} km/h`,
      change: station.windChange,
      icon: Wind,
    },
    {
      label: "Humidity",
      value: `${station.humidity}%`,
      change: station.humidityChange,
      icon: Droplets,
    },
    {
      label: "Pressure",
      value: `${station.pressure} hPa`,
      change: station.pressureChange,
      icon: Gauge,
    },
  ];

  return (
    <section className="dashboard-card environment-card">
      <div className="environment-heading">
        <h2>ENVIRONMENTAL MONITORING</h2>

        <span className="environment-badge">
          {station.name}
        </span>
      </div>

      <div className="environment-metrics">
        {metrics.map(
          ({ label, value, change, icon: Icon }) => (
            <div
              className="environment-metric"
              key={label}
            >
              <div className="environment-value">
                <Icon size={17} />
                <strong>{value}</strong>
              </div>

              <span>{label}</span>

              <small>{change}</small>
            </div>
          )
        )}
      </div>

      <div className="environment-chart">
        <ResponsiveContainer
          width="100%"
          height={85}
        >
          <LineChart data={history}>
            <XAxis dataKey="time" hide />

            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "none",
              }}
            />

            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#4b83d7"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="wind"
              stroke="#7959dd"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="humidity"
              stroke="#71b8eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <span>
          <i className="legend-dot blue" />
          Temperature
        </span>

        <span>
          <i className="legend-dot purple" />
          Wind Speed
        </span>

        <span>
          <i className="legend-dot sky" />
          Humidity
        </span>
      </div>
    </section>
  );
}
