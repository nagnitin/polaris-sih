import { useState } from "react";
import { Box, Layers, RotateCcw, MousePointerClick } from "lucide-react";

import StationScene from "../components/StationScene";
import AssetDetailPanel from "../components/AssetDetailPanel";
import { PageHeader, SimBadge, StatusDot } from "../components/UI";
import { LAYERS, STATUS } from "../data/assets";
import { usePolaris } from "../context/PolarisContext";

export default function ThreeDTwin({ navigate }) {
  const {
    assets,
    station,
    stationKey,
    selectedAssetId,
    setSelectedAssetId,
    logAction,
  } = usePolaris();

  const [visibleLayers, setVisibleLayers] = useState(
    LAYERS.map((l) => l.id)
  );

  const [sceneKey, setSceneKey] = useState(0);

  const selected = assets.find((a) => a.id === selectedAssetId);

  function toggleLayer(id) {
    setVisibleLayers((prev) =>
      prev.includes(id)
        ? prev.filter((l) => l !== id)
        : [...prev, id]
    );
  }

  const counts = Object.keys(STATUS).reduce((acc, key) => {
    acc[key] = assets.filter(
      (a) => station.assets[a.id]?.status === key
    ).length;
    return acc;
  }, {});

  return (
    <div className="page">
      <PageHeader
        icon={Box}
        title="3D DIGITAL TWIN"
        subtitle={`Interactive station model · ${
          stationKey === "maitri" ? "Maitri" : "Bharati"
        } · click any asset for live state`}
      >
        <SimBadge />

        <button
          className="ghost-button"
          onClick={() => {
            setSceneKey((k) => k + 1);
            setSelectedAssetId(null);
            logAction("3D view reset", stationKey);
          }}
        >
          <RotateCcw size={15} /> Reset view
        </button>
      </PageHeader>

      <div className="twin-layout">
        <div className="twin-stage">
          <div className="layer-bar">
            <span className="layer-bar-label">
              <Layers size={14} /> Layers
            </span>

            {LAYERS.map((layer) => (
              <button
                key={layer.id}
                className={`layer-chip ${
                  visibleLayers.includes(layer.id) ? "on" : ""
                }`}
                onClick={() => toggleLayer(layer.id)}
              >
                <i style={{ background: layer.color }} />
                {layer.label}
              </button>
            ))}
          </div>

          <div className="twin-canvas">
            <StationScene
              key={`${stationKey}-${sceneKey}`}
              assets={assets}
              liveAssets={station.assets}
              visibleLayers={visibleLayers}
              selectedAssetId={selectedAssetId}
              onSelect={setSelectedAssetId}
            />

            {!selected && (
              <div className="twin-hint">
                <MousePointerClick size={15} />
                Drag to orbit · scroll to zoom · click an asset
              </div>
            )}

            <div className="twin-status-legend">
              {Object.entries(STATUS).map(([key, meta]) => (
                <span key={key}>
                  <i style={{ background: meta.color }} />
                  {meta.label} <b>{counts[key] || 0}</b>
                </span>
              ))}
            </div>
          </div>

          <div className="asset-strip">
            {assets
              .filter((a) => visibleLayers.includes(a.layer))
              .map((a) => {
                const live = station.assets[a.id];

                return (
                  <button
                    key={a.id}
                    className={`asset-chip ${
                      selectedAssetId === a.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedAssetId(a.id)}
                  >
                    <StatusDot status={live?.status} />
                    <span>{a.name}</span>
                    <b>{live?.health}</b>
                  </button>
                );
              })}
          </div>
        </div>

        {selected ? (
          <AssetDetailPanel
            asset={selected}
            onClose={() => setSelectedAssetId(null)}
            onSimulate={() => navigate("Simulation")}
            onHistory={() => navigate("Analytics")}
          />
        ) : (
          <aside className="asset-panel asset-panel-empty">
            <h3>Asset inspector</h3>

            <p>
              Select any component in the scene to see live telemetry, its
              health score, predicted failure probability and the systems
              that depend on it.
            </p>

            <div className="inspector-legend">
              {LAYERS.map((l) => (
                <div key={l.id}>
                  <i style={{ background: l.color }} />
                  <span>{l.label}</span>
                  <b>
                    {assets.filter((a) => a.layer === l.id).length}
                  </b>
                </div>
              ))}
            </div>

            <p className="asset-footnote">
              Geometry is a simplified representation for operational
              awareness, based on published NCPOR station descriptions.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
