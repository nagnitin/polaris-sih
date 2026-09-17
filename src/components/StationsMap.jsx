import { MapPin, Maximize2 } from "lucide-react";

import { usePolaris } from "../context/PolarisContext";

export default function StationsMap({ onOpen }) {
  const { allKpis, stationKey, setSelectedStation } = usePolaris();

  const pinColour = (health) =>
    health >= 88 ? "#27a567" : health >= 72 ? "#e8b53a" : "#ff625a";

  const stations = [
    {
      key: "maitri",
      name: "Maitri Station",
      coords: "70° 45′ S, 11° 44′ E",
      pinClass: "maitri-pin",
      labelClass: "maitri-label",
    },
    {
      key: "bharati",
      name: "Bharati Station",
      coords: "69° 24′ S, 76° 12′ E",
      pinClass: "bharati-pin",
      labelClass: "bharati-label",
    },
  ];

  return (
    <section className="dashboard-card stations-card">
      <div className="mini-card-header">
        <h2>STATIONS MAP</h2>

        <button
          className="small-action-button"
          aria-label="Expand map"
          onClick={onOpen}
        >
          <Maximize2 size={17} />
        </button>
      </div>

      <div className="map-preview">
        <div className="map-grid" />

        <div className="antarctica-label">
          ANTARCTICA
        </div>

        {stations.map((s) => {
          const colour = pinColour(allKpis[s.key].health);

          return (
            <button
              key={s.key}
              className={`map-pin ${s.pinClass} map-pin-button ${
                stationKey === s.key ? "is-active" : ""
              }`}
              onClick={() => setSelectedStation(s.key)}
              aria-label={`Select ${s.name}`}
            >
              <MapPin size={26} fill={colour} color={colour} />
            </button>
          );
        })}

        {stations.map((s) => (
          <div className={`map-label ${s.labelClass}`} key={s.key}>
            <strong>{s.name}</strong>
            <span>{s.coords}</span>
            <span className="map-health">
              health {allKpis[s.key].health}% · risk{" "}
              {allKpis[s.key].riskLevel.toLowerCase()}
            </span>
          </div>
        ))}
      </div>

      <div className="map-legend">
        <span>
          <i className="legend-dot red" />
          Indian Stations
        </span>

        <span>
          <i className="legend-dot blue" />
          Other Research Stations
        </span>
      </div>
    </section>
  );
}
