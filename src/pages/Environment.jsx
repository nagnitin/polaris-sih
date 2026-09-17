import {
  Activity,
  Thermometer,
  Wind,
  Droplets,
  Gauge,
  ShieldAlert,
} from "lucide-react";

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

import { PageHeader, Panel, Metric, SimBadge } from "../components/UI";
import { stationProfiles } from "../data/stationProfiles";
import { usePolaris } from "../context/PolarisContext";

/* Environment -> operations translation (spec: environmental intelligence). */
function operationalImpact(env, profile) {
  const impacts = [];

  if (env.wind >= 55) {
    impacts.push({
      level: "critical",
      title: "Outdoor movement restricted",
      text: `Wind ${env.wind} km/h. Suspend external maintenance and secure loose equipment. Recorded maximum at this station is ${profile.climate.find((c) => c.label.includes("Max"))?.value}.`,
    });
  } else if (env.wind >= 35) {
    impacts.push({
      level: "warning",
      title: "Exposed work needs a buddy system",
      text: `Wind ${env.wind} km/h increases wind-chill risk during outdoor tasks.`,
    });
  } else {
    impacts.push({
      level: "normal",
      title: "Outdoor operations normal",
      text: `Wind ${env.wind} km/h is within the routine working envelope.`,
    });
  }

  if (env.temp <= -28) {
    impacts.push({
      level: "critical",
      title: "Heating demand surge",
      text: `${env.temp} °C drives heating load well above baseline; verify reserve margin before scheduling heavy electrical work.`,
    });
  } else if (env.temp <= -20) {
    impacts.push({
      level: "warning",
      title: "Elevated heating load",
      text: `${env.temp} °C increases fuel burn. Pre-heating thermal mass smooths the evening peak.`,
    });
  } else {
    impacts.push({
      level: "normal",
      title: "Heating load nominal",
      text: `${env.temp} °C keeps heating within the planned envelope.`,
    });
  }

  if (env.pressure < 970) {
    impacts.push({
      level: "warning",
      title: "Pressure falling — weather front likely",
      text: `${env.pressure} hPa. Bring forward outdoor tasks and confirm vehicle recovery plans.`,
    });
  } else {
    impacts.push({
      level: "normal",
      title: "Stable pressure",
      text: `${env.pressure} hPa suggests settled conditions over the next window.`,
    });
  }

  return impacts;
}

export default function Environment() {
  const { station, stationKey } = usePolaris();

  const env = station.env;
  const profile = stationProfiles[stationKey];
  const history = station.envHistory.slice(-24);
  const impacts = operationalImpact(env, profile);

  return (
    <div className="page">
      <PageHeader
        icon={Activity}
        title="ENVIRONMENT"
        subtitle={`Live conditions at ${profile.name} and what they mean for operations`}
      >
        <SimBadge />
      </PageHeader>

      <div className="metric-row">
        <Metric
          label="Temperature"
          value={env.temp}
          unit="°C"
          hint={`Annual mean ${profile.climate[0].value}`}
          tone="blue"
        />

        <Metric
          label="Wind speed"
          value={env.wind}
          unit="km/h"
          hint={`Dominant ${profile.climate.find((c) => c.label.includes("Dominant"))?.value}`}
          tone="violet"
        />

        <Metric
          label="Humidity"
          value={env.humidity}
          unit="%"
          hint="Relative humidity"
          tone="aqua"
        />

        <Metric
          label="Pressure"
          value={env.pressure}
          unit="hPa"
          hint={env.pressure < 975 ? "Falling — watch for a front" : "Stable"}
          tone="green"
        />
      </div>

      <div className="split-grid">
        <Panel
          tone="dark"
          title="Temperature & wind"
          subtitle="Rolling 6-hour window from the automatic weather station"
        >
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#aabaff" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#aabaff" stopOpacity={0.04} />
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
                width={40}
              />

              <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />

              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#aabaff"
                strokeWidth={2}
                fill="url(#tempFill)"
                name="Temperature (°C)"
              />

              <Line
                type="monotone"
                dataKey="wind"
                stroke="#8de5f1"
                strokeWidth={2}
                dot={false}
                name="Wind (km/h)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          tone="dark"
          title="Humidity & pressure"
          subtitle="Secondary environmental channels"
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={history}>
              <CartesianGrid stroke="#3c4648" vertical={false} />

              <XAxis
                dataKey="time"
                tick={{ fill: "#9fb0b2", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                yAxisId="l"
                tick={{ fill: "#9fb0b2", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={38}
              />

              <YAxis
                yAxisId="r"
                orientation="right"
                domain={["dataMin - 4", "dataMax + 4"]}
                tick={{ fill: "#9fb0b2", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={44}
              />

              <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />

              <Line
                yAxisId="l"
                type="monotone"
                dataKey="humidity"
                stroke="#71b8eb"
                strokeWidth={2}
                dot={false}
                name="Humidity (%)"
              />

              <Line
                yAxisId="r"
                type="monotone"
                dataKey="pressure"
                stroke="#ffdf83"
                strokeWidth={2}
                dot={false}
                name="Pressure (hPa)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel
        tone="violet"
        title="Operational impact"
        subtitle="Environmental readings translated into decisions, not just graphs"
        actions={<ShieldAlert size={18} />}
      >
        <div className="impact-grid">
          {impacts.map((i) => (
            <div className={`impact-card level-${i.level}`} key={i.title}>
              <strong>{i.title}</strong>
              <p>{i.text}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        tone="dark"
        title="Station climate reference"
        subtitle="Published values used as the baseline envelope"
      >
        <div className="climate-strip">
          {profile.climate.map((c) => (
            <div key={c.label}>
              <span>{c.label}</span>
              <strong>{c.value}</strong>
            </div>
          ))}
        </div>

        <div className="env-icon-row">
          <span><Thermometer size={14} /> Temperature</span>
          <span><Wind size={14} /> Wind</span>
          <span><Droplets size={14} /> Humidity</span>
          <span><Gauge size={14} /> Pressure</span>
        </div>
      </Panel>
    </div>
  );
}
