import { Boxes, Fuel, Droplets, Package, Wrench, TriangleAlert } from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar as RBar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { PageHeader, Panel, Metric, Bar, SimBadge } from "../components/UI";
import { usePolaris } from "../context/PolarisContext";

const ICONS = {
  fuel: Fuel,
  water: Droplets,
  food: Package,
  spares: Wrench,
};

export default function Logistics() {
  const { station, kpis } = usePolaris();

  const inventory = station.inventory;

  const endurance = [
    { name: "Fuel", days: kpis.fuelDays, colour: "#ffdf83" },
    { name: "Water", days: kpis.waterDays, colour: "#aabaff" },
    { name: "Food", days: kpis.foodDays, colour: "#b7e9f4" },
    {
      name: "Spares",
      days: Math.round(inventory.spares.volume / Math.max(0.1, inventory.spares.rate)),
      colour: "#ff9b8e",
    },
  ];

  const priorities = [...endurance]
    .sort((a, b) => a.days - b.days)
    .map((item, index) => ({
      ...item,
      priority: index + 1,
      action:
        index === 0
          ? "Include in the next resupply window — first priority"
          : index === 1
          ? "Monitor closely, prepare requisition"
          : "Within planned replenishment cycle",
    }));

  return (
    <div className="page">
      <PageHeader
        icon={Boxes}
        title="LOGISTICS & STATION AUTONOMY"
        subtitle="Inventory converted into operational endurance"
      >
        <SimBadge />
      </PageHeader>

      <div className="metric-row">
        <Metric
          label="Station autonomy"
          value={kpis.autonomy}
          unit="%"
          hint={`Limited by ${kpis.limitingResource.toLowerCase()}`}
          tone="green"
        />

        <Metric
          label="Fuel endurance"
          value={kpis.fuelDays}
          unit="days"
          hint={`${kpis.fuelRate} L/h current burn`}
          tone="amber"
        />

        <Metric
          label="Water endurance"
          value={kpis.waterDays}
          unit="days"
          hint={`${inventory.water.rate} L/day consumption`}
          tone="blue"
        />

        <Metric
          label="Food endurance"
          value={kpis.foodDays}
          unit="days"
          hint="Provisions at current crew size"
          tone="aqua"
        />
      </div>

      <div className="split-grid">
        <Panel
          tone="dark"
          title="Inventory levels"
          subtitle="Live consumption applied to the twin every tick"
        >
          <div className="inventory-list">
            {Object.entries(inventory).map(([key, item]) => {
              const Icon = ICONS[key] || Package;
              const low = item.pct < 35;

              return (
                <div className="inventory-row" key={key}>
                  <div className="inventory-icon">
                    <Icon size={18} />
                  </div>

                  <div className="inventory-body">
                    <div className="inventory-head">
                      <strong>{item.label}</strong>

                      <span>
                        {Math.round(item.volume).toLocaleString()} {item.unit}
                      </span>
                    </div>

                    <Bar
                      value={item.pct}
                      tone={low ? "coral" : item.pct < 55 ? "amber" : "green"}
                    />

                    <small>
                      {item.pct.toFixed
                        ? item.pct.toFixed(0)
                        : item.pct}
                      % remaining · {Math.round(item.rate).toLocaleString()}{" "}
                      {item.unit === "days" ? "per day" : `${item.unit}/day`}
                      {low && (
                        <em className="warn-inline">
                          <TriangleAlert size={12} /> below reserve policy
                        </em>
                      )}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          tone="dark"
          title="Endurance by resource"
          subtitle="Days of operation at the current consumption rate"
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={endurance} layout="vertical">
              <CartesianGrid stroke="#3c4648" horizontal={false} />

              <XAxis
                type="number"
                tick={{ fill: "#9fb0b2", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#cfdad9", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={64}
              />

              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
                contentStyle={{ borderRadius: 12, border: "none" }}
              />

              <RBar
                dataKey="days"
                fill="#8de5f1"
                radius={[8, 8, 8, 8]}
                maxBarSize={26}
                name="Days"
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel
        tone="amber"
        title="Replenishment priority"
        subtitle="Ordered by remaining endurance against the critical reserve policy"
      >
        <div className="priority-list">
          {priorities.map((p) => (
            <div className="priority-row" key={p.name}>
              <span className="priority-index">{p.priority}</span>

              <div>
                <strong>{p.name}</strong>
                <p>{p.action}</p>
              </div>

              <span className="priority-days">{p.days} days</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
