import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  advance,
  createInitialState,
  defaultThresholds,
  stationKpis,
} from "../data/simulator";

import { deriveIncidents } from "../data/incidents";
import { assetsByStation } from "../data/assets";

const PolarisContext = createContext(null);

export const ROLES = {
  operations: {
    id: "operations",
    label: "Station Operations Manager",
    icon: "📊",
    desc: "Full station overview + control",
    can: ["view", "simulate", "acknowledge", "configure"],
  },
  scientist: {
    id: "scientist",
    label: "Lead Research Scientist",
    icon: "🔬",
    desc: "Science payloads, environment, analytics",
    can: ["view", "simulate"],
  },
  logistics: {
    id: "logistics",
    label: "Logistics Coordinator",
    icon: "📦",
    desc: "Supply levels, fuel, run-of-motion",
    can: ["view", "simulate"],
  },
  engineer: {
    id: "engineer",
    label: "Maintenance Engineer",
    icon: "🔧",
    desc: "Asset faults, maintenance, acknowledge",
    can: ["view", "simulate", "acknowledge"],
  },
  analyst: {
    id: "analyst",
    label: "Data Analyst",
    icon: "📈",
    desc: "Historical trends and reports",
    can: ["view"],
  },
  hse: {
    id: "hse",
    label: "HSE Officer",
    icon: "🛡️",
    desc: "Safety systems, alerts, environment",
    can: ["view", "acknowledge"],
  },
  admin: {
    id: "admin",
    label: "System Administrator",
    icon: "⚙️",
    desc: "Everything incl. users and thresholds",
    can: ["view", "simulate", "acknowledge", "configure", "admin"],
  },
};

const TICK_MS = 2500;

export function PolarisProvider({ children, user, initialStation }) {
  const [twin, setTwin] = useState(() => {
    const seed = createInitialState();

    /* Seeded prototype faults so the demo opens with live incidents. */
    seed.faults = [
      {
        id: "F-MTR-GEN-02",
        station: "maitri",
        assetId: "MTR-GEN-02",
        kind: "cooling",
        progress: 0.34,
        rate: 0.004,
        origin: "seeded",
      },
      {
        id: "F-BHR-CHP-02",
        station: "bharati",
        assetId: "BHR-CHP-02",
        kind: "bearing",
        progress: 0.41,
        rate: 0.005,
        origin: "seeded",
      },
      {
        id: "F-BHR-AWS-01",
        station: "bharati",
        assetId: "BHR-AWS-01",
        kind: "link_loss",
        progress: 0,
        rate: 0,
        origin: "seeded",
      },
    ];

    /* Materialise the seeded degradation so the first paint already
       shows the live incidents rather than an all-green station. */
    return advance(advance(seed));
  });

  const [selectedStation, setSelectedStation] = useState(initialStation || "maitri");
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [acknowledged, setAcknowledged] = useState([]);
  const [paused, setPaused] = useState(false);
  const [linkOnline, setLinkOnline] = useState(true);
  const [queuedPackets, setQueuedPackets] = useState(0);
  const [auditLog, setAuditLog] = useState([
    {
      at: new Date().toLocaleTimeString(),
      actor: user?.name || "operator",
      action: "Session started",
      detail: "Authenticated via institutional login (prototype)",
    },
  ]);

  const thresholdRef = useRef(thresholds);
  thresholdRef.current = thresholds;

  /* live tick: simulator -> ingestion -> twin state */
  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      setTwin((prev) => advance(prev, thresholdRef.current));
      if (!linkOnline) setQueuedPackets((q) => q + 14);
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [paused, linkOnline]);

  function logAction(action, detail) {
    setAuditLog((prev) =>
      [
        {
          at: new Date().toLocaleTimeString(),
          actor: user?.name || "operator",
          action,
          detail,
        },
        ...prev,
      ].slice(0, 60)
    );
  }

  function injectFault(station, assetId, kind) {
    const id = `F-${assetId}-${kind}`;

    setTwin((prev) => ({
      ...prev,
      faults: [
        ...prev.faults.filter((f) => f.id !== id),
        { id, station, assetId, kind, progress: 0.05, rate: 0.06, origin: "manual" },
      ],
    }));

    logAction("Fault injected (prototype)", `${assetId} · ${kind}`);
  }

  function clearFaults(assetId) {
    setTwin((prev) => ({
      ...prev,
      faults: prev.faults.filter((f) =>
        assetId ? f.assetId !== assetId : false
      ),
    }));

    logAction("Fault cleared", assetId || "all simulated faults");
  }

  function acknowledgeIncident(incidentId) {
    setAcknowledged((prev) =>
      prev.includes(incidentId) ? prev : [...prev, incidentId]
    );
    logAction("Alert acknowledged", incidentId);
  }

  function restoreLink() {
    setLinkOnline(true);
    logAction(
      "Link restored",
      `${queuedPackets} queued packets synchronised from edge buffer`
    );
    setQueuedPackets(0);
  }

  function dropLink() {
    setLinkOnline(false);
    logAction("Link lost", "Edge gateway switched to store-and-forward");
  }

  const station = twin.stations[selectedStation];

  const kpis = useMemo(
    () => stationKpis(selectedStation, station),
    [selectedStation, station]
  );

  const allKpis = useMemo(
    () => ({
      maitri: stationKpis("maitri", twin.stations.maitri),
      bharati: stationKpis("bharati", twin.stations.bharati),
    }),
    [twin]
  );

  const incidents = useMemo(
    () => deriveIncidents(selectedStation, station, thresholds),
    [selectedStation, station, thresholds]
  );

  const fleetIncidents = useMemo(
    () => [
      ...deriveIncidents("maitri", twin.stations.maitri, thresholds),
      ...deriveIncidents("bharati", twin.stations.bharati, thresholds),
    ],
    [twin, thresholds]
  );

  const assets = assetsByStation[selectedStation];

  const role = ROLES[user?.role || "operations"];

  const value = {
    twin,
    station,
    stationKey: selectedStation,
    setSelectedStation: (key) => {
      setSelectedStation(key);
      setSelectedAssetId(null);
    },
    assets,
    kpis,
    allKpis,
    incidents,
    fleetIncidents,
    acknowledged,
    acknowledgeIncident,
    selectedAssetId,
    setSelectedAssetId,
    thresholds,
    setThresholds,
    injectFault,
    clearFaults,
    paused,
    setPaused,
    linkOnline,
    dropLink,
    restoreLink,
    queuedPackets,
    auditLog,
    logAction,
    user,
    role,
    can: (permission) => role.can.includes(permission),
  };

  return (
    <PolarisContext.Provider value={value}>
      {children}
    </PolarisContext.Provider>
  );
}

export function usePolaris() {
  const ctx = useContext(PolarisContext);

  if (!ctx) {
    throw new Error("usePolaris must be used inside <PolarisProvider>");
  }

  return ctx;
}
