import StationHealth from "../components/StationHealth";
import CriticalAlerts from "../components/CriticalAlerts";
import EnvironmentalMonitoring from "../components/EnvironmentalMonitoring";
import StationsMap from "../components/StationsMap";
import StationAutonomy from "../components/StationAutonomy";
import DigitalTwin from "../components/DigitalTwin";
import MissionCopilot from "../components/MissionCopilot";

export default function Dashboard({ station, navigate }) {
  return (
    <div className="dashboard-content">
      <div className="dashboard-top-grid">
        <StationHealth station={station} />

        <div className="dashboard-right-stack">
          <CriticalAlerts
            station={station}
            onOpen={() => navigate("Alerts")}
          />

          <EnvironmentalMonitoring
            station={station}
          />
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <StationsMap onOpen={() => navigate("Stations")} />

        <StationAutonomy
          station={station}
          onOpen={() => navigate("Logistics")}
        />

        <DigitalTwin
          station={station}
          onOpen={() => navigate("3D Twin")}
        />
      </div>

      <MissionCopilot station={station} />
    </div>
  );
}
