import { useState } from "react";
import {
  TriangleAlert,
  CheckCircle2,
  Activity,
  ArrowRight,
  Radio,
} from "lucide-react";

import { PageHeader, Panel, StatusPill, Metric, EmptyState } from "../components/UI";
import { usePolaris } from "../context/PolarisContext";

const SEVERITY_TONE = {
  critical: "coral",
  degraded: "amber",
  warning: "amber",
};

export default function Alerts({ navigate }) {
  const {
    incidents,
    fleetIncidents,
    acknowledged,
    acknowledgeIncident,
    setSelectedAssetId,
    stationKey,
    can,
  } = usePolaris();

  const [openId, setOpenId] = useState(incidents[0]?.id || null);

  const open = incidents.find((i) => i.id === openId) || incidents[0];

  const criticalCount = incidents.filter((i) => i.severity === "critical").length;

  return (
    <div className="page">
      <PageHeader
        icon={TriangleAlert}
        title="ALERTS & INCIDENTS"
        subtitle="Related signals correlated into single incidents with a probable cause"
      >
        <span className="chip">
          {fleetIncidents.length} fleet-wide
        </span>
      </PageHeader>

      <div className="metric-row">
        <Metric
          label="Active incidents"
          value={incidents.length}
          hint={`${stationKey === "maitri" ? "Maitri" : "Bharati"} station`}
          tone="coral"
        />

        <Metric
          label="Critical"
          value={criticalCount}
          hint="Threatening operation or safety"
          tone="amber"
        />

        <Metric
          label="Acknowledged"
          value={
            incidents.filter((i) => acknowledged.includes(i.id)).length
          }
          hint="Logged to the audit trail"
          tone="green"
        />

        <Metric
          label="Correlated signals"
          value={incidents.reduce((s, i) => s + i.signals.length, 0)}
          hint="Grouped instead of raised individually"
          tone="blue"
        />
      </div>

      {incidents.length === 0 ? (
        <Panel tone="dark">
          <EmptyState
            icon={CheckCircle2}
            title="No active incidents"
            text="Every monitored asset is inside its configured operating envelope."
          />
        </Panel>
      ) : (
        <div className="incident-layout">
          <div className="incident-list">
            {incidents.map((incident) => (
              <button
                key={incident.id}
                className={`incident-row severity-${incident.severity} ${
                  open?.id === incident.id ? "on" : ""
                }`}
                onClick={() => setOpenId(incident.id)}
              >
                <div className="incident-row-head">
                  <StatusPill status={incident.severity} />

                  {acknowledged.includes(incident.id) && (
                    <span className="ack-flag">
                      <CheckCircle2 size={12} /> ACK
                    </span>
                  )}
                </div>

                <strong>{incident.assetName}</strong>
                <span>{incident.cause}</span>

                <div className="incident-row-foot">
                  <em>{incident.signals.length} signals</em>
                  <em>{incident.failureProbability}% / 24 h</em>
                  <em>health {incident.health}</em>
                </div>
              </button>
            ))}
          </div>

          {open && (
            <Panel
              tone={SEVERITY_TONE[open.severity] || "dark"}
              title={open.assetName}
              subtitle={`${open.id} · ${open.zone}`}
              actions={<StatusPill status={open.severity} />}
              className="incident-detail"
            >
              <div className="incident-cause">
                <Activity size={16} />
                <div>
                  <span>Probable cause</span>
                  <strong>{open.cause}</strong>
                </div>
              </div>

              <div className="signal-table">
                <h4>Correlated signals</h4>

                {open.signals.map((s) => (
                  <div className="signal-row" key={s.field}>
                    <span>{s.label}</span>

                    <strong className={s.critical ? "bad" : ""}>
                      {s.value}
                    </strong>

                    <em>
                      {s.direction} limit {s.limit}
                    </em>
                  </div>
                ))}
              </div>

              <div className="incident-impact">
                <h4>Affected systems</h4>

                <div className="chip-row">
                  {open.affected.length ? (
                    open.affected.map((a) => (
                      <span className="chip" key={a}>
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="chip">Isolated asset</span>
                  )}
                </div>
              </div>

              <div className="incident-reco">
                <h4>Recommended response</h4>
                <p>{open.recommendation}</p>
              </div>

              <div className="incident-actions">
                <button
                  className="primary-button"
                  disabled={
                    !can("acknowledge") || acknowledged.includes(open.id)
                  }
                  onClick={() => acknowledgeIncident(open.id)}
                >
                  <CheckCircle2 size={15} />
                  {acknowledged.includes(open.id)
                    ? "Acknowledged"
                    : "Acknowledge incident"}
                </button>

                <button
                  className="ghost-button"
                  onClick={() => {
                    setSelectedAssetId(open.assetId);
                    navigate("3D Twin");
                  }}
                >
                  View in 3D twin <ArrowRight size={14} />
                </button>

                <button
                  className="ghost-button"
                  onClick={() => {
                    setSelectedAssetId(open.assetId);
                    navigate("Simulation");
                  }}
                >
                  Simulate failure <Radio size={14} />
                </button>
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
