import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import {
  Box,
  Layers,
  Rotate3d,
  Maximize2,
} from "lucide-react";

import { usePolaris } from "../context/PolarisContext";

/* Lightweight Blender station model (public/models/final.glb, ~1.1 MB).
   The heavy photoreal digi scene stays on the full 3D Twin page. */
const MODEL_URL = "models/final.glb";

function StationModel() {
  const { scene } = useGLTF(MODEL_URL);

  const model = useMemo(() => {
    const clone = scene.clone(true);

    // Drop the model's own oversized 360 m terrain sheet — the card's CSS
    // gradient provides the sky + snow ground.
    const remove = [];
    clone.traverse((o) => {
      if (/terrain/i.test(o.name)) remove.push(o);
    });
    remove.forEach((o) => o.parent?.remove(o));

    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = false;
        o.receiveShadow = false;
      }
    });

    return clone;
  }, [scene]);

  return <primitive object={model} />;
}

function Loader() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="twin-3d-loading">
      Loading 3D model · {Math.round(progress)}%
    </div>
  );
}

function TwinCanvas() {
  return (
    <div className="twin-scene-wrap">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [30, 18, 30], fov: 40 }}
        gl={{ antialias: true }}
        onCreated={(state) => {
          if (typeof window !== "undefined") window.__twinCard = state;
        }}
      >
        <color attach="background" args={["#c3d4e4"]} />
        <hemisphereLight args={["#e8f1fa", "#93a7b8", 1.05]} />
        <directionalLight position={[28, 34, 18]} intensity={2.1} color="#fff6e8" />
        <directionalLight position={[-24, 14, -20]} intensity={0.7} color="#bcd6ee" />

        <Suspense fallback={null}>
          <StationModel />
        </Suspense>

        <OrbitControls
          makeDefault
          target={[0, 2, 0]}
          autoRotate
          autoRotateSpeed={0.9}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={0.85}
          maxPolarAngle={1.4}
        />
      </Canvas>
    </div>
  );
}

export default function DigitalTwin({ station, onOpen }) {
  const { assets, station: live } = usePolaris();
  const downAt = useRef(null);
  const [gone, setGone] = useState(false);

  const attention = assets.filter((a) =>
    ["degraded", "critical"].includes(live.assets[a.id]?.status)
  ).length;

  /* Open the full twin on a plain click, but let users drag to orbit
     without triggering navigation. */
  function handlePointerDown(e) {
    downAt.current = { x: e.clientX, y: e.clientY };
  }

  function handlePointerUp(e) {
    if (!downAt.current) return;
    const dx = e.clientX - downAt.current.x;
    const dy = e.clientY - downAt.current.y;
    downAt.current = null;
    if (Math.hypot(dx, dy) < 6) onOpen();
  }

  /* WebGL context can be lost when many canvases mount/unmount quickly
     (e.g. back-and-forth navigation to the full twin). Offer a retry. */
  if (gone) {
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
        <div className="twin-select">{station.name}</div>
        <button
          className="twin-preview twin-preview-button twin-3d-retry"
          onClick={() => setGone(false)}
        >
          3D preview unavailable — click to retry
        </button>
      </section>
    );
  }

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

      <div
        className="twin-preview twin-preview-button"
        role="button"
        tabIndex={0}
        aria-label="Open interactive 3D digital twin"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen();
        }}
      >
        <TwinCanvas />
        <Loader />

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
      </div>
    </section>
  );
}
