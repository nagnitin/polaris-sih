import {
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

export default function CriticalAlerts({ station, onOpen }) {
  return (
    <section className="dashboard-card alert-card">
      <div className="alert-icon">
        <AlertTriangle size={27} />
      </div>

      <div className="alert-content">
        <h2>CRITICAL ALERTS</h2>

        <p>
          <strong>{station.alerts}</strong>{" "}
          active alert{station.alerts === 1 ? "" : "s"} require attention
        </p>

        <span>{station.topAlert}</span>
      </div>

      <button
        className="white-round-button"
        aria-label="View alerts"
        onClick={onOpen}
      >
        <ArrowUpRight size={20} />
      </button>
    </section>
  );
}
