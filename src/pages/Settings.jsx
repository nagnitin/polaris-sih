import { useState } from "react";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  SatelliteDish,
  Bug,
  ScrollText,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

import { PageHeader, Panel, SimBadge } from "../components/UI";
import { ROLES, usePolaris } from "../context/PolarisContext";
import { FAULT_KINDS, defaultThresholds } from "../data/simulator";

const AUDITED_EVENTS = [
  "Login / logout and failed authentication",
  "Role and permission changes",
  "Data exports",
  "Alert acknowledgement",
  "Configuration changes",
  "Simulation execution",
  "Administrative actions",
];

export default function Settings() {
  const {
    thresholds,
    setThresholds,
    assets,
    injectFault,
    clearFaults,
    twin,
    stationKey,
    paused,
    setPaused,
    linkOnline,
    dropLink,
    restoreLink,
    queuedPackets,
    auditLog,
    logAction,
    role,
    can,
  } = usePolaris();

  const [editType, setEditType] = useState("generator");
  const [faultAsset, setFaultAsset] = useState(assets[0]?.id || "");
  const [faultKind, setFaultKind] = useState("cooling");

  const rules = thresholds[editType] || {};

  function updateRule(field, key, value) {
    setThresholds((prev) => ({
      ...prev,
      [editType]: {
        ...prev[editType],
        [field]: {
          ...prev[editType][field],
          [key]: Number(value),
        },
      },
    }));
  }

  const activeFaults = twin.faults.filter((f) => f.station === stationKey);

  const compatibleAssets = assets.filter((a) =>
    FAULT_KINDS[faultKind]?.applies.includes(a.type)
  );

  return (
    <div className="page">
      <PageHeader
        icon={SettingsIcon}
        title="SETTINGS & GOVERNANCE"
        subtitle="Thresholds, access control, edge behaviour and the audit trail"
      >
        <span className="chip">Signed in as {role.label}</span>
      </PageHeader>

      <div className="split-grid">
        <Panel
          tone="dark"
          title="Health thresholds"
          subtitle="Configuration data, never hard-coded in the UI"
          actions={
            <button
              className="ghost-button"
              onClick={() => {
                setThresholds(defaultThresholds);
                logAction("Thresholds reset", "restored prototype defaults");
              }}
            >
              <RotateCcw size={14} /> Defaults
            </button>
          }
        >
          <div className="segmented wrap">
            {Object.keys(thresholds).map((type) => (
              <button
                key={type}
                className={editType === type ? "on" : ""}
                onClick={() => setEditType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="threshold-table">
            <div className="threshold-head">
              <span>Signal</span>
              <span>Warning</span>
              <span>Critical</span>
              <span>Weight</span>
            </div>

            {Object.entries(rules).map(([field, rule]) => (
              <div className="threshold-row" key={field}>
                <span>
                  {field}
                  {rule.lower && <em> (lower is worse)</em>}
                </span>

                {["warn", "crit", "weight"].map((key) => (
                  <input
                    key={key}
                    type="number"
                    step="0.1"
                    value={rule[key]}
                    disabled={!can("configure")}
                    onChange={(e) => updateRule(field, key, e.target.value)}
                    onBlur={() =>
                      logAction(
                        "Threshold changed",
                        `${editType}.${field}.${key}`
                      )
                    }
                  />
                ))}
              </div>
            ))}
          </div>

          <p className="panel-footnote">
            Prototype values. Replace with authorised NCPOR engineering limits
            before any operational use.
          </p>
        </Panel>

        <div className="stack-grid">
          <Panel
            tone="dark"
            title="Edge / offline mode"
            subtitle="Station keeps working when the satellite link drops"
            actions={<SatelliteDish size={17} />}
          >
            <div className="link-state">
              <div className={`link-dot ${linkOnline ? "on" : "off"}`} />

              <div>
                <strong>
                  {linkOnline ? "Link online" : "Link lost — store & forward"}
                </strong>

                <span>
                  {linkOnline
                    ? "Telemetry synchronising with mission control"
                    : `${queuedPackets} packets queued at the edge gateway`}
                </span>
              </div>
            </div>

            <div className="button-row">
              <button
                className="ghost-button"
                onClick={linkOnline ? dropLink : restoreLink}
              >
                {linkOnline ? "Simulate outage" : "Restore link"}
              </button>

              <button
                className="ghost-button"
                onClick={() => {
                  setPaused(!paused);
                  logAction(
                    paused ? "Simulator resumed" : "Simulator paused",
                    "prototype telemetry generator"
                  );
                }}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
                {paused ? "Resume telemetry" : "Pause telemetry"}
              </button>
            </div>
          </Panel>

          <Panel
            tone="dark"
            title="Fault injection"
            subtitle="Drive the demo story — prototype only"
            actions={<SimBadge label="PROTOTYPE" />}
          >
            <div className="sim-inputs">
              <label>
                Fault type
                <select
                  value={faultKind}
                  onChange={(e) => setFaultKind(e.target.value)}
                >
                  {Object.entries(FAULT_KINDS).map(([key, kind]) => (
                    <option key={key} value={key}>
                      {kind.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Asset
                <select
                  value={faultAsset}
                  onChange={(e) => setFaultAsset(e.target.value)}
                >
                  {compatibleAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="button-row">
              <button
                className="primary-button"
                disabled={!compatibleAssets.length}
                onClick={() =>
                  injectFault(
                    stationKey,
                    compatibleAssets.some((a) => a.id === faultAsset)
                      ? faultAsset
                      : compatibleAssets[0].id,
                    faultKind
                  )
                }
              >
                <Bug size={15} /> Inject fault
              </button>

              <button className="ghost-button" onClick={() => clearFaults()}>
                Clear all
              </button>
            </div>

            {activeFaults.length > 0 && (
              <div className="fault-list">
                {activeFaults.map((f) => (
                  <div key={f.id}>
                    <span>
                      {f.assetId} · {FAULT_KINDS[f.kind]?.label}
                    </span>

                    <em>{Math.round(f.progress * 100)}% progressed</em>

                    <button onClick={() => clearFaults(f.assetId)}>
                      clear
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Panel
        tone="mint"
        title="Role-based access control"
        subtitle="Prototype boundary: read, analyse and simulate — no equipment actuation"
        actions={<ShieldCheck size={18} />}
      >
        <div className="table-wrap">
          <table className="data-table light">
            <thead>
              <tr>
                <th>Role</th>
                <th>View</th>
                <th>Simulate</th>
                <th>Acknowledge</th>
                <th>Configure</th>
                <th>Admin</th>
              </tr>
            </thead>

            <tbody>
              {Object.values(ROLES).map((r) => (
                <tr key={r.id} className={r.id === role.id ? "is-selected" : ""}>
                  <td>
                    <strong>{r.label}</strong>
                  </td>

                  {["view", "simulate", "acknowledge", "configure", "admin"].map(
                    (perm) => (
                      <td key={perm}>
                        {r.can.includes(perm) ? "✔" : "—"}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="panel-footnote">
          Authentication design: institutional SSO (OAuth 2.0 / OpenID Connect),
          MFA for privileged accounts, short-lived tokens, TLS everywhere and
          account lockout on repeated failures.
        </p>
      </Panel>

      <div className="split-grid">
        <Panel
          tone="dark"
          title="Audit log"
          subtitle="Every important action is recorded"
          actions={<ScrollText size={17} />}
        >
          <div className="audit-list">
            {auditLog.map((entry, index) => (
              <div className="audit-row" key={index}>
                <span className="audit-time">{entry.at}</span>

                <div>
                  <strong>{entry.action}</strong>
                  <span>{entry.detail}</span>
                </div>

                <em>{entry.actor}</em>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          tone="dark"
          title="Audited events"
          subtitle="Mandatory entries required by the specification"
        >
          <ul className="tick-list">
            {AUDITED_EVENTS.map((event) => (
              <li key={event}>{event}</li>
            ))}
          </ul>

          <p className="panel-footnote">
            Actuation of generators, pumps or other equipment is deliberately
            out of scope. It would require explicit authorisation, safety
            interlocks and a separate secure control architecture.
          </p>
        </Panel>
      </div>
    </div>
  );
}
