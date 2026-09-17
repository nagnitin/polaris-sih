import { MapPin, Users, Snowflake, Building2, ArrowUpRight } from "lucide-react";

import { PageHeader, Panel, Bar, StatusPill } from "../components/UI";
import { stationProfiles } from "../data/stationProfiles";
import { assetsByStation, statusFromScore } from "../data/assets";
import { usePolaris } from "../context/PolarisContext";

function StationCard({ profile, kpis, live, active, onSelect }) {
  const assets = assetsByStation[profile.id];

  const degraded = assets.filter((a) =>
    ["degraded", "critical"].includes(live.assets[a.id].status)
  ).length;

  return (
    <Panel
      tone={profile.id === "maitri" ? "aqua" : "violet"}
      className={`station-card ${active ? "is-active" : ""}`}
      title={profile.name}
      subtitle={`${profile.region} · ${profile.coordinates}`}
      actions={
        <button className="small-action-button" onClick={onSelect}>
          <ArrowUpRight size={17} />
        </button>
      }
    >
      <div className="station-kpis">
        <div>
          <span>Health</span>
          <strong>{kpis.health}%</strong>
          <Bar value={kpis.health} tone={kpis.health > 85 ? "green" : "amber"} />
        </div>

        <div>
          <span>Autonomy</span>
          <strong>{kpis.autonomy}%</strong>
          <Bar value={kpis.autonomy} tone="blue" />
        </div>

        <div>
          <span>Generation</span>
          <strong>{kpis.generation} kW</strong>
          <Bar value={kpis.generation} max={320} tone="green" />
        </div>

        <div>
          <span>Fuel endurance</span>
          <strong>{kpis.fuelDays} d</strong>
          <Bar value={kpis.fuelDays} max={260} tone="amber" />
        </div>
      </div>

      <div className="station-flags">
        <StatusPill status={statusFromScore(kpis.health)} />
        <span className="chip">{assets.length} modelled assets</span>
        <span className="chip">{degraded} needing attention</span>
        <span className="chip">Risk {kpis.riskLevel}</span>
      </div>

      <div className="fact-grid">
        <div>
          <Building2 size={15} />
          <span>Established</span>
          <b>{profile.established}</b>
        </div>

        <div>
          <Snowflake size={15} />
          <span>Altitude</span>
          <b>{profile.altitude}</b>
        </div>

        <div>
          <Users size={15} />
          <span>Winter crew</span>
          <b>
            {profile.personnel.winterStaff + profile.personnel.winterScientists}
          </b>
        </div>

        <div>
          <MapPin size={15} />
          <span>Operation</span>
          <b>{profile.operationalPeriod}</b>
        </div>
      </div>

      <p className="station-note">{profile.notes}</p>
    </Panel>
  );
}

function FactTable({ title, rows }) {
  return (
    <div className="fact-table">
      <h4>{title}</h4>

      <table>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Stations({ navigate }) {
  const { twin, allKpis, stationKey, setSelectedStation } = usePolaris();

  const profile = stationProfiles[stationKey];

  return (
    <div className="page">
      <PageHeader
        icon={MapPin}
        title="STATIONS"
        subtitle="Indian Antarctic research stations monitored by POLARIS"
      >
        <button
          className="ghost-button"
          onClick={() => navigate("3D Twin")}
        >
          Open 3D twin
        </button>
      </PageHeader>

      <div className="station-grid">
        {["maitri", "bharati"].map((key) => (
          <StationCard
            key={key}
            profile={stationProfiles[key]}
            kpis={allKpis[key]}
            live={twin.stations[key]}
            active={stationKey === key}
            onSelect={() => setSelectedStation(key)}
          />
        ))}
      </div>

      <Panel
        tone="dark"
        title={`${profile.name} — station record`}
        subtitle="Source: NCPOR / COMNAP Catalogue of Antarctic Stations (public material)"
      >
        <div className="record-grid">
          <FactTable title="Climate" rows={profile.climate} />
          <FactTable title="Facilities" rows={profile.facilities} />

          <div className="fact-table">
            <h4>Operations</h4>

            <table>
              <tbody>
                <tr>
                  <td>Operator</td>
                  <td>{profile.operator}</td>
                </tr>
                <tr>
                  <td>Laboratories</td>
                  <td>{profile.laboratories}</td>
                </tr>
                <tr>
                  <td>Transport</td>
                  <td>{profile.transport}</td>
                </tr>
                <tr>
                  <td>Summer crew</td>
                  <td>
                    {profile.personnel.summerStaff} staff ·{" "}
                    {profile.personnel.summerScientists} scientists
                  </td>
                </tr>
                <tr>
                  <td>Winter crew</td>
                  <td>
                    {profile.personnel.winterStaff} staff ·{" "}
                    {profile.personnel.winterScientists} scientists
                  </td>
                </tr>
                <tr>
                  <td>Climate zone</td>
                  <td>
                    {profile.climateZone} · permafrost {profile.permafrost}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="panel-footnote">
          Main science disciplines: {profile.disciplines}.
        </p>
      </Panel>
    </div>
  );
}
