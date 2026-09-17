/*
  3D Digital Twin scene (spec §6).

  The 3D model is a VISUAL INTERFACE to the twin, not the data model.
  Geometry is deliberately simplified and recognisable rather than an
  engineering CAD replica — published NCPOR descriptions are used for the
  physical basis and nothing is invented as an engineering drawing.
*/

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";

import { STATUS } from "../data/assets";

function AssetMesh({ def, live, selected, onSelect }) {
  const mesh = useRef();
  const [hovered, setHovered] = useState(false);

  const color = STATUS[live?.status || "offline"].color;
  const [w, h, d] = def.size;

  const critical =
    live?.status === "critical" || live?.status === "degraded";

  useFrame((state) => {
    if (!mesh.current) return;

    if (critical) {
      const pulse =
        0.5 + Math.sin(state.clock.elapsedTime * 3.2) * 0.5;
      mesh.current.material.emissiveIntensity = 0.25 + pulse * 0.55;
    } else {
      mesh.current.material.emissiveIntensity = selected
        ? 0.55
        : hovered
        ? 0.35
        : 0.12;
    }
  });

  const y = def.mast ? h / 2 : h / 2 + (def.stilts ? 1.2 : 0);

  return (
    <group
      position={[def.pos[0], 0, def.pos[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(def.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <mesh ref={mesh} position={[0, y, 0]} castShadow receiveShadow>
        {def.round ? (
          <cylinderGeometry args={[w / 2, w / 2, h, 22]} />
        ) : def.mast ? (
          <cylinderGeometry args={[0.18, 0.26, h, 10]} />
        ) : (
          <boxGeometry args={[w, h, d]} />
        )}

        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.12}
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>

      {/* roof cap for buildings so blocks read as structures */}
      {!def.round && !def.mast && (
        <mesh position={[0, y + h / 2 + 0.22, 0]}>
          <boxGeometry args={[w * 1.04, 0.45, d * 1.04]} />
          <meshStandardMaterial
            color="#e7f0ef"
            roughness={0.8}
            metalness={0.05}
          />
        </mesh>
      )}

      {/* stilts, as used by the elevated Bharati modules */}
      {def.stilts &&
        [
          [-w / 2 + 1, -d / 2 + 1],
          [w / 2 - 1, -d / 2 + 1],
          [-w / 2 + 1, d / 2 - 1],
          [w / 2 - 1, d / 2 - 1],
        ].map(([sx, sz], i) => (
          <mesh key={i} position={[sx, 0.6, sz]}>
            <cylinderGeometry args={[0.22, 0.22, 1.2, 8]} />
            <meshStandardMaterial color="#8b9aa0" />
          </mesh>
        ))}

      {/* mast crossbars */}
      {def.mast && (
        <>
          <mesh position={[0, h * 0.78, 0]}>
            <boxGeometry args={[2.6, 0.12, 0.12]} />
            <meshStandardMaterial color={color} />
          </mesh>

          <mesh position={[0, h * 0.58, 0]}>
            <boxGeometry args={[2, 0.12, 0.12]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </>
      )}

      {/* selection ring */}
      {(selected || hovered) && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) * 0.72, Math.max(w, d) * 0.85, 40]} />
          <meshBasicMaterial
            color={selected ? "#ffffff" : color}
            transparent
            opacity={selected ? 0.95 : 0.6}
          />
        </mesh>
      )}
    </group>
  );
}

function Terrain() {
  const rocks = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        x: Math.sin(i * 2.7) * 26 + Math.cos(i * 1.3) * 6,
        z: Math.cos(i * 1.9) * 22 + Math.sin(i * 2.1) * 5,
        s: 0.8 + ((i * 37) % 13) / 9,
      })),
    []
  );

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[130, 130]} />
        <meshStandardMaterial color="#e4edf0" roughness={1} />
      </mesh>

      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, r.s * 0.25, r.z]}
          rotation={[0, i, 0]}
        >
          <dodecahedronGeometry args={[r.s, 0]} />
          <meshStandardMaterial color="#b6bfc2" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

export default function StationScene({
  assets,
  liveAssets,
  visibleLayers,
  selectedAssetId,
  onSelect,
}) {
  const shown = assets.filter((a) => visibleLayers.includes(a.layer));

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [30, 22, 32], fov: 42 }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#1e2426"]} />
      <fog attach="fog" args={["#1e2426", 70, 135]} />

      <hemisphereLight
        intensity={0.85}
        color="#dcecf2"
        groundColor="#5c6a70"
      />

      <directionalLight
        position={[26, 30, 18]}
        intensity={1.25}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Suspense fallback={null}>
        <Terrain />

        <Grid
          args={[130, 130]}
          cellSize={4}
          cellThickness={0.6}
          cellColor="#9fb3ba"
          sectionSize={20}
          sectionThickness={1}
          sectionColor="#7d949c"
          fadeDistance={110}
          fadeStrength={1.2}
          position={[0, 0.01, 0]}
          infiniteGrid={false}
        />

        {shown.map((def) => (
          <AssetMesh
            key={def.id}
            def={def}
            live={liveAssets[def.id]}
            selected={selectedAssetId === def.id}
            onSelect={onSelect}
          />
        ))}
      </Suspense>

      <OrbitControls
        enablePan
        maxPolarAngle={Math.PI / 2.15}
        minDistance={14}
        maxDistance={80}
        target={[0, 2, 0]}
      />
    </Canvas>
  );
}
