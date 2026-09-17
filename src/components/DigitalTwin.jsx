import {
  Box,
  Layers,
  Rotate3d,
  Maximize2,
} from "lucide-react";

import { usePolaris } from "../context/PolarisContext";

export default function DigitalTwin({ station, onOpen }) {
  const { assets, station: live } = usePolaris();

  const attention = assets.filter((a) =>
    ["degraded", "critical"].includes(live.assets[a.id]?.status)
  ).length;

  return (
    <section className="dashboard-card twin-card">
      <div className="mini-card-header">
        <h2>3D DIGITAL TWIN</h2>

        <button
          className="small-action-button"
          aria-label="Expand digital twin"
          onClick={onOpen}
        >
          <Maximize2 size={17} />
        </button>
      </div>

      <div className="twin-select">
        {station.name}
      </div>

      <button
        className="twin-preview twin-preview-button"
        onClick={onOpen}
        aria-label="Open interactive 3D digital twin"
      >
        <div className="mountain mountain-one" />
        <div className="mountain mountain-two" />

        <div className="research-station">
          <div className="station-roof" />

          <div className="station-windows">
            {Array.from({ length: 10 }).map(
              (_, i) => (
                <span key={i} />
              )
            )}
          </div>
        </div>

        <div className="station-tower">
          <div />
        </div>

        <div className="snow-ground" />

        <div className="twin-controls">
          <span aria-hidden="true">
            <Rotate3d size={16} />
          </span>

          <span aria-hidden="true">
            <Box size={16} />
          </span>

          <span aria-hidden="true">
            <Layers size={16} />
          </span>
        </div>

        <div className="twin-caption">
          Interactive 3D model · {assets.length} assets ·{" "}
          {attention ? `${attention} need attention` : "all nominal"}
        </div>
      </button>
    </section>
  );
}
