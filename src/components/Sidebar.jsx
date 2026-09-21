import {
  Home,
  MapPin,
  Box,
  Zap,
  Boxes,
  Activity,
  ChartNoAxesCombined,
  FlaskConical,
  TriangleAlert,
  FileText,
  Settings,
  Compass,
} from "lucide-react";
import POLARIS_LOGO from "../assets/polaris-logo.png";

export const menuItems = [
  { label: "Home", icon: Home },
  { label: "Stations", icon: MapPin },
  { label: "3D Twin", icon: Box },
  { label: "Energy", icon: Zap },
  { label: "Logistics", icon: Boxes },
  { label: "Environment", icon: Activity },
  { label: "Analytics", icon: ChartNoAxesCombined },
  { label: "Simulation", icon: FlaskConical },
  { label: "Alerts", icon: TriangleAlert },
  { label: "Reports", icon: FileText },
  { label: "Settings", icon: Settings },
];

export default function Sidebar({
  activePage,
  setActivePage,
  alertCount = 0,
  initials = "BS",
}) {
  return (
    <aside className="sidebar">
      <div className="polaris-logo">
        <img src={POLARIS_LOGO} alt="POLARIS" />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${
              activePage === label ? "active" : ""
            }`}
            onClick={() => setActivePage(label)}
            aria-label={label}
          >
            <Icon size={21} strokeWidth={1.8} />
            <span>{label}</span>

            {label === "Alerts" && alertCount > 0 && (
              <i className="nav-badge">{alertCount}</i>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="profile-avatar">
          {initials}
        </div>

        <Compass size={22} />

        <span>
          Explore
          <br />
          for a safer
          <br />
          tomorrow
        </span>
      </div>
    </aside>
  );
}
