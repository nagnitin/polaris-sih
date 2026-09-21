import { useState } from "react";
import { Box, RotateCcw, MousePointerClick } from "lucide-react";

import { PageHeader, SimBadge } from "../components/UI";
import { LAYERS, STATUS } from "../data/assets";
import { usePolaris } from "../context/PolarisContext";

/* Maps our layer chips to the demo's camera presets (public/digi/index.html). */
const LAYER_PRESETS = {
  energy: "generator",
  comms: "communication",
  environment: "sensors",
  fuel: "fuel",
  water: "water",
  structure: "overview",
};

export default function ThreeDTwin() {
  const { assets, station, stationKey, logAction } = usePolaris();

  const [frameKey, setFrameKey] = useState(0);
  const [activePreset, setActivePreset] = useState(null);

  const counts = Object.keys(STATUS).reduce((acc, key) => {
    acc[key] = assets.filter(
      (a) => station.assets[a.id]?.status === key
    ).length;
    return acc;
  }, {});

  function sendFocus(presetId) {
    setActivePreset(presetId);
    const frame = document.getElementById("digi-frame");
    if (!frame?.contentWindow) return;

    // The demo exposes focusCameraPreset() globally on window.
    frame.contentWindow.focusCameraPreset?.(presetId);
  }

  function resetView() {
    setFrameKey((k) => k + 1);
    setActivePreset(null);
    logAction("3D view reset", stationKey);
  }

  return (
    <div className="page page-twin">
      <PageHeader
        icon={Box}
        title="3D DIGITAL TWIN"
        subtitle={`Bharati station interior model · ${
          stationKey === "maitri" ? "Maitri" : "Bharati"
        } · click any highlighted zone for live state`}
      >
        <SimBadge />

        <button className="ghost-button" onClick={resetView}>
          <RotateCcw size={15} /> Reset view
        </button>
      </PageHeader>

      <div className="twin-embed">
        <iframe
          key={frameKey}
          id="digi-frame"
          src="digi/index.html"
          title="Bharati station 3D digital twin"
        />

        <div className="layer-bar">
          <span className="layer-bar-label">
            <MousePointerClick size={14} /> Twin assets
          </span>

          <button
            className={`layer-chip ${activePreset === "overview" ? "on" : ""}`}
            onClick={() => sendFocus("overview")}
          >
            <i style={{ background: "#8b9bb4" }} />
            Station overview
          </button>

          {LAYERS.filter((l) => LAYER_PRESETS[l.id]).map((layer) => (
            <button
              key={layer.id}
              className={`layer-chip ${
                activePreset === LAYER_PRESETS[layer.id] ? "on" : ""
              }`}
              onClick={() => sendFocus(LAYER_PRESETS[layer.id])}
            >
              <i style={{ background: layer.color }} />
              {layer.label}
            </button>
          ))}
        </div>

        <div className="twin-status-legend twin-embed-legend">
          {Object.entries(STATUS).map(([key, meta]) => (
            <span key={key}>
              <i style={{ background: meta.color }} />
              {meta.label} <b>{counts[key] || 0}</b>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
