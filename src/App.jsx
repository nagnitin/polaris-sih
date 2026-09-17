import { useEffect, useRef, useState } from "react";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import Stations from "./pages/Stations";
import ThreeDTwin from "./pages/ThreeDTwin";
import Energy from "./pages/Energy";
import Logistics from "./pages/Logistics";
import Environment from "./pages/Environment";
import Analytics from "./pages/Analytics";
import Simulation from "./pages/Simulation";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import PolarisLogin from "./pages/PolarisLogin";

import { PolarisProvider, usePolaris } from "./context/PolarisContext";
import { stationProfiles } from "./data/stationProfiles";

/* Rolling station-level health series for the dashboard bar chart. */
function useHealthSeries(stationKey, health, tick) {
  const [series, setSeries] = useState([]);
  const lastKey = useRef(stationKey);

  useEffect(() => {
    if (lastKey.current !== stationKey) {
      lastKey.current = stationKey;
      setSeries([]);
      return;
    }

    setSeries((prev) => {
      const label = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      return [...prev, { day: label, health }].slice(-7);
    });
    /* one sample per simulator tick, so the bars always advance */
  }, [stationKey, tick]);

  return series;
}

function delta(current, previous, digits = 0) {
  if (previous === undefined || previous === null) return "–";
  const d = current - previous;
  const sign = d >= 0 ? "↑ +" : "↓ ";
  return `${sign}${d.toFixed(digits)}`;
}

function Shell({ onLogout }) {
  const {
    stationKey,
    setSelectedStation,
    station,
    kpis,
    incidents,
    user,
    linkOnline,
    queuedPackets,
    twin,
  } = usePolaris();

  const [activePage, setActivePage] = useState("Home");

  const healthSeries = useHealthSeries(stationKey, kpis.health, twin.tick);
  const previous = station.envHistory[station.envHistory.length - 2];

  const profile = stationProfiles[stationKey];

  const stationView = {
    id: stationKey,
    name: profile.name,
    shortName: profile.shortName,

    health: kpis.health,
    degraded: kpis.degraded,
    healthTrend:
      healthSeries.length > 1
        ? kpis.health - healthSeries[0].health
        : 0,
    sensorTrend: 0,
    sensorsOnline: kpis.sensorsOnline,
    totalSensors: kpis.totalSensors,
    healthHistory: healthSeries,

    temperature: station.env.temp,
    windSpeed: station.env.wind,
    humidity: station.env.humidity,
    pressure: station.env.pressure,
    temperatureChange: `${delta(station.env.temp, previous?.temperature, 1)}°C`,
    windChange: `${delta(station.env.wind, previous?.wind)} km/h`,
    humidityChange: `${delta(station.env.humidity, previous?.humidity)}%`,
    pressureChange: `${delta(station.env.pressure, previous?.pressure)} hPa`,
    envHistory: station.envHistory.slice(-12),

    autonomy: kpis.autonomy,
    powerBackup: kpis.powerBackupDays,
    waterSupply: kpis.waterDays,
    fuelSupply: kpis.fuelDays,
    foodSupply: kpis.foodDays,

    alerts: incidents.length,
    topAlert: incidents.length
      ? `${incidents[0].assetName}: ${incidents[0].cause}`
      : "No active alerts — all assets nominal",
  };

  const navigate = (page) => setActivePage(page);

  const pages = {
    Home: <Dashboard station={stationView} navigate={navigate} />,
    Stations: <Stations navigate={navigate} />,
    "3D Twin": <ThreeDTwin navigate={navigate} />,
    Energy: <Energy navigate={navigate} />,
    Logistics: <Logistics navigate={navigate} />,
    Environment: <Environment navigate={navigate} />,
    Analytics: <Analytics navigate={navigate} />,
    Simulation: <Simulation navigate={navigate} />,
    Alerts: <Alerts navigate={navigate} />,
    Reports: <Reports navigate={navigate} />,
    Settings: <Settings navigate={navigate} />,
  };

  return (
    <div className="app-wrapper">
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          alertCount={incidents.length}
          initials={(user?.name || "BS").slice(0, 2).toUpperCase()}
        />

        <main className="main-content">
          <Topbar
            selectedStation={stationKey}
            setSelectedStation={setSelectedStation}
            activePage={activePage}
            user={user}
            onLogout={onLogout}
            alertCount={incidents.length}
            linkOnline={linkOnline}
            queuedPackets={queuedPackets}
            onOpenAlerts={() => setActivePage("Alerts")}
          />

          {pages[activePage] || pages.Home}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return (
      <PolarisLogin
        onLogin={(username) =>
          setUser({ name: username, role: "operations" })
        }
      />
    );
  }

  return (
    <PolarisProvider user={user}>
      <Shell onLogout={() => setUser(null)} />
    </PolarisProvider>
  );
}
