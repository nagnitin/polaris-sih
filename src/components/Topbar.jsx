import {
  Search,
  Bell,
  MapPin,
  ChevronDown,
  Wifi,
  WifiOff,
  LogOut,
} from "lucide-react";

export default function Topbar({
  selectedStation,
  setSelectedStation,
  activePage,
  user,
  onLogout,
  alertCount = 0,
  linkOnline = true,
  queuedPackets = 0,
  onOpenAlerts,
}) {
  const initials = (user?.name || "BS")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="brand">
        <h1>POLARIS</h1>
        <p>Antarctic Digital Twin Platform</p>
      </div>

      <div className="breadcrumb">
        <span>Dashboard</span>
        <span>/</span>
        <strong>{activePage === "Home" ? "Overview" : activePage}</strong>
      </div>

      <div className="topbar-actions">
        <span
          className={`link-status ${linkOnline ? "on" : "off"}`}
          title={
            linkOnline
              ? "Satellite link online — telemetry synchronising"
              : `Link lost — ${queuedPackets} packets queued at the edge gateway`
          }
        >
          {linkOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {linkOnline ? "LINK ONLINE" : `QUEUED ${queuedPackets}`}
        </span>

        <button
          className="icon-button"
          aria-label="Search"
        >
          <Search size={19} />
        </button>

        <div className="station-select-wrapper">
          <MapPin size={16} />

          <select
            value={selectedStation}
            onChange={(e) =>
              setSelectedStation(e.target.value)
            }
            aria-label="Select station"
          >
            <option value="maitri">
              Maitri Station
            </option>

            <option value="bharati">
              Bharati Station
            </option>
          </select>

          <ChevronDown size={15} />
        </div>

        <button
          className="icon-button notification"
          aria-label="Notifications"
          onClick={onOpenAlerts}
        >
          <Bell size={19} />
          {alertCount > 0 && <span className="notification-dot" />}
        </button>

        <div className="profile-avatar" title={user?.name || ""}>
          {initials}
        </div>

        <button
          className="icon-button"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
