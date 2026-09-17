import { useState } from "react";
import { FlaskConical, Play, ShieldCheck, ArrowRight } from "lucide-react";

import { PageHeader, Panel, SimBadge } from "../components/UI";
import { SCENARIOS, runScenario } from "../data/simulationEngine";
import { usePolaris } from "../context/PolarisContext";

export default function Simulation() {
  const { assets, station, stationKey, selectedAssetId, logAction, can } =
    usePolaris();

  const [scenario, setScenario] = useState("generator_failure");
  const [assetId, setAssetId] = useState(selectedAssetId || "");
  const [durationH, setDurationH] = useState(72);
  const [outsideTemp, setOutsideTemp] = useState(-31);
  const [personnel, setPersonnel] = useState(42);
  const [result, setResult] = useState(null);

  const definition = SCENARIOS.find((s) => s.id === scenario);

  const candidates = definition?.needsAsset
    ? assets.filter((a) => definition.assetTypes.includes(a.type))
    : [];

  function handleRun() {
    const out = runScenario({
      stationKey,
      stationState: station,
      scenario,
      assetId: assetId || candidates[0]?.id,
      durationH: Number(durationH),
      outsideTemp: Number(outsideTemp),
      personnel: Number(personnel),
    });

    setResult(out);

    logAction(
      "Simulation executed",
      `${definition.label} · ${durationH} h · ${outsideTemp} °C`
    );
  }

  return (
    <div className="page">
      <PageHeader
        icon={FlaskConical}
        title="WHAT-IF SIMULATION"
        subtitle="Sandboxed copy of the live twin — operational state is never modified"
      >
        <SimBadge label="SANDBOX" />
      </PageHeader>

      <div className="sim-layout">
        <Panel tone="dark" title="Scenario" subtitle="Select conditions to evaluate">
          <div className="scenario-list">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                className={`scenario-option ${scenario === s.id ? "on" : ""}`}
                onClick={() => {
                  setScenario(s.id);
                  setResult(null);
                }}
              >
                <strong>{s.label}</strong>
                <span>{s.description}</span>
              </button>
            ))}
          </div>

          <div className="sim-inputs">
            {definition?.needsAsset && (
              <label>
                Asset
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                >
                  <option value="">Auto-select</option>

                  {candidates.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Duration (hours)
              <input
                type="number"
                min="1"
                max="336"
                value={durationH}
                onChange={(e) => setDurationH(e.target.value)}
              />
            </label>

            <label>
              Outside temperature (°C)
              <input
                type="number"
                min="-60"
                max="5"
                value={outsideTemp}
                onChange={(e) => setOutsideTemp(e.target.value)}
              />
            </label>

            <label>
              Personnel on station
              <input
                type="number"
                min="5"
                max="70"
                value={personnel}
                onChange={(e) => setPersonnel(e.target.value)}
              />
            </label>
          </div>

          <button
            className="primary-button"
            onClick={handleRun}
            disabled={!can("simulate")}
          >
            <Play size={16} />
            {can("simulate") ? "Run simulation" : "Simulation not permitted for this role"}
          </button>
        </Panel>

        <div className="sim-results">
          {!result ? (
            <Panel tone="dark">
              <div className="empty-state">
                <FlaskConical size={26} />
                <strong>No scenario evaluated yet</strong>
                <p>
                  Choose a scenario and run it. The engine copies the current
                  twin state, applies the scenario and reports the impact on
                  power, heating, fuel, water and station autonomy.
                </p>
              </div>
            </Panel>
          ) : (
            <>
              <Panel
                tone={
                  result.risk === "HIGH"
                    ? "coral"
                    : result.risk === "ELEVATED"
                    ? "amber"
                    : "mint"
                }
                title={`Result — risk ${result.risk}`}
                subtitle={result.narrative}
              >
                <div className="sim-table">
                  {result.rows.map((row) => {
                    const delta = row.after - row.before;
                    const good = row.invert ? delta <= 0 : delta >= 0;

                    return (
                      <div className="sim-row" key={row.label}>
                        <span>{row.label}</span>

                        <div className="sim-values">
                          <b>
                            {row.before} {row.unit}
                          </b>

                          <ArrowRight size={14} />

                          <b className={good ? "good" : "bad"}>
                            {row.after} {row.unit}
                          </b>

                          <em className={good ? "good" : "bad"}>
                            {delta > 0 ? "+" : ""}
                            {delta}
                          </em>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <div className="split-grid">
                <Panel tone="dark" title="Affected systems">
                  <div className="chip-row">
                    {result.affected.length ? (
                      result.affected.map((a) => (
                        <span className="chip" key={a}>
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="chip">No dependent systems</span>
                    )}
                  </div>
                </Panel>

                <Panel
                  tone="dark"
                  title="Recommended response"
                  subtitle="Advisory output — no equipment is actuated"
                  actions={<ShieldCheck size={17} />}
                >
                  <ol className="action-list">
                    {result.actions.map((a) => (
                      <li key={a.action}>
                        <strong>{a.action}</strong>
                        <span>{a.effect}</span>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
