import {
  BatteryCharging,
  Droplets,
  Fuel,
  Package,
} from "lucide-react";

export default function StationAutonomy({ station, onOpen }) {
  const supplies = [
    {
      label: "Power Backup",
      days: station.powerBackup,
      icon: BatteryCharging,
    },
    {
      label: "Water Supply",
      days: station.waterSupply,
      icon: Droplets,
    },
    {
      label: "Fuel Supply",
      days: station.fuelSupply,
      icon: Fuel,
    },
    {
      label: "Food Supplies",
      days: station.foodSupply,
      icon: Package,
    },
  ];

  const circumference = 2 * Math.PI * 49;

  const progress =
    circumference * (station.autonomy / 100);

  return (
    <section className="dashboard-card autonomy-card">
      <div className="mini-card-header">
        <h2>STATION AUTONOMY</h2>

        <button
          className="small-action-button"
          aria-label="View autonomy details"
        >
          ↗
        </button>
      </div>

      <div className="autonomy-content">
        <div className="autonomy-gauge">
          <svg viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="49"
              fill="none"
              stroke="#b5ddca"
              strokeWidth="11"
            />

            <circle
              cx="60"
              cy="60"
              r="49"
              fill="none"
              stroke="#20945c"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
              transform="rotate(-90 60 60)"
            />
          </svg>

          <div className="gauge-text">
            <strong>{station.autonomy}%</strong>
            <span>Autonomy</span>
          </div>
        </div>

        <div className="supply-list">
          {supplies.map(
            ({ label, days, icon: Icon }) => (
              <div className="supply-item" key={label}>
                <div className="supply-icon">
                  <Icon size={18} />
                </div>

                <div>
                  <strong>{days} days</strong>
                  <span>{label}</span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}