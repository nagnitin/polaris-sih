/*
  3D Digital Twin scene (spec §6).

  The 3D model is a VISUAL INTERFACE to the twin, not the data model.
  Geometry is the station GLB (public/models/final.glb, exported from
  final.blend). Live behaviour is driven by semantic node-name mapping:
  Blender object names starting with known system prefixes (Genset_,
  Fuel_, Water_Tank, Mast_/Satcom_/Anemometer, Lab_, Exhaust_) are
  tinted by live status and clickable; the structural frame keeps its
  original materials. Status markers sit on anchors measured from the
  Blender scene.
*/

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { STATUS } from "../data/assets";

const MODEL_URL = "/models/final.glb";

/*
  Semantic mapping from Blender object-name prefix → twin asset id.
  Every GLB mesh whose name matches the regex is tinted/clicked as
  that asset.
*/
const NODE_TO_ASSET = [
  [/^(L[123]_|Flat_MainRoof|Roof_|Ribbon_|Prow_|Window_West)/, "MTR-BLD-01"],
  [/^Genset_1_/, "MTR-GEN-01"],
  [/^Genset_2_/, "MTR-GEN-02"],
  [/^Fuel_Tank_|^Fuel_ISO/, "MTR-FUEL-02"],
  [/^Water_Tank_/, "MTR-PMP-01"],
  [/^Mast_|^Satcom_|^Microwave_|^Dipole_|^AirSafety/, "MTR-COM-01"],
  [/^Anemometer_/, "MTR-AWS-01"],
  [/^Lab_Rack_|^Lab_Screen_/, "MTR-LAB-01"],
  [/^Exhaust_/, "MTR-HVAC-01"],
];

const isAssetNode = (name) => NODE_TO_ASSET.some(([re]) => re.test(name));

/*
  Marker anchors in Blender scene metres (x along building, y across),
  derived from the *_DT pin beacons and system centroids in final.blend.
*/
const ANCHORS = {
  "MTR-BLD-01": [0, 0],
  "MTR-GEN-01": [-23.9, 6.8],
  "MTR-GEN-02": [-18.2, 6.8],
  "MTR-FUEL-02": [-20.5, 0.0],
  "MTR-PMP-01": [-20.3, -6.8],
  "MTR-LAB-01": [12.8, -5.8],
  "MTR-HVAC-01": [-17.6, 2.5],
  "MTR-COM-01": [-4.8, 2.8],
  "MTR-AWS-01": [8.0, -5.85],
};

const ANCHOR_RADIUS = {
  "MTR-BLD-01": 7.5,
  "MTR-GEN-01": 2.1,
  "MTR-GEN-02": 2.1,
  "MTR-FUEL-02": 2.6,
  "MTR-PMP-01": 2.4,
  "MTR-LAB-01": 3.2,
  "MTR-HVAC-01": 2.4,
  "MTR-COM-01": 2.0,
  "MTR-AWS-01": 1.6,
};

/* Camera fly-to distance per asset (scene units). */
const ANCHOR_VIEW_DIST = {
  "MTR-BLD-01": 42,
  "MTR-GEN-01": 11,
  "MTR-GEN-02": 11,
  "MTR-FUEL-02": 13,
  "MTR-PMP-01": 12,
  "MTR-LAB-01": 14,
  "MTR-HVAC-01": 12,
  "MTR-COM-01": 10,
  "MTR-AWS-01": 8,
};

/*
  Camera fly-to: on selection, glide the camera toward the asset's
  anchor while keeping the user's current viewing direction.
*/
function CameraFly({ selectedAssetId, focusToken }) {
  const fit = useModelFit();
  const { camera, controls } = useThree();
  const goal = useRef(null);

  useEffect(() => {
    if (!controls) return;

    const anchor = selectedAssetId ? ANCHORS[selectedAssetId] : null;
    if (!anchor) {
      goal.current = null;
      return;
    }

    const tx = (anchor[0] - fit.cx) * fit.scale;
    const tz = (anchor[1] - fit.cz) * fit.scale;
    const target = new THREE.Vector3(tx, 1.6, tz);

    const dir = camera.position
      .clone()
      .sub(controls.target || new THREE.Vector3(0, 2, 0));
    if (dir.lengthSq() < 1e-4) dir.set(1, 0.85, 1);
    dir.normalize();

    const dist = ANCHOR_VIEW_DIST[selectedAssetId] || 12;

    goal.current = {
      pos: target
        .clone()
        .addScaledVector(dir, dist)
        .add(new THREE.Vector3(0, dist * 0.42, 0)),
      target,
    };
  }, [selectedAssetId, focusToken, fit, camera, controls]);

  useFrame((_, dt) => {
    const g = goal.current;
    if (!g || !controls) return;

    const k = 1 - Math.exp(-4.2 * Math.min(dt, 0.1));
    camera.position.lerp(g.pos, k);
    controls.target.lerp(g.target, k);
    controls.update();

    if (
      camera.position.distanceTo(g.pos) < 0.08 &&
      controls.target.distanceTo(g.target) < 0.08
    ) {
      goal.current = null;
    }
  });

  return null;
}

/*
  Model fit: computed from the STATION meshes only (the GLB also
  contains a 360×360 m terrain sheet which must not drive the scale).
  The long axis is normalised to ~46 scene units; Y-up comes from the
  glTF export, so Blender (x, y, z-up) maps to scene (x, z) horizontally.
*/
function useModelFit() {
  const { scene } = useGLTF(MODEL_URL);

  return useMemo(() => {
    const box = new THREE.Box3();
    const tmp = new THREE.Box3();

    scene.traverse((o) => {
      if (o.isMesh && o.name !== "Antarctic_Terrain") {
        tmp.setFromObject(o);
        box.union(tmp);
      }
    });

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 46 / Math.max(size.x, size.z, 0.001);

    return { scale, cx: center.x, cz: center.z, minY: box.min.y };
  }, [scene]);
}

/*
  The imported station. Original node transforms are preserved by
  cloning the glTF scene; mapped asset meshes get shared live materials
  whose colour/emissive follow the asset's real-time status.
*/
function StationModel({
  liveAssets,
  visibleAssetIds,
  selectedAssetId,
  onSelect,
  onHover,
}) {
  const { scene } = useGLTF(MODEL_URL);
  const fit = useModelFit();
  const [hoveredId, setHoveredId] = useState(null);

  const model = useMemo(() => scene.clone(true), [scene]);

  /* assetId → cloned meshes (transforms preserved) */
  const classified = useMemo(() => {
    const map = {};
    model.traverse((o) => {
      if (!o.isMesh) return;
      const hit = NODE_TO_ASSET.find(([re]) => re.test(o.name));
      if (hit) (map[hit[1]] ||= []).push(o);
    });
    return map;
  }, [model]);

  /* one shared material per asset */
  const materials = useMemo(() => {
    const m = {};
    Object.keys(classified).forEach((id) => {
      m[id] = new THREE.MeshStandardMaterial({
        roughness: 0.55,
        metalness: 0.15,
      });
    });
    return m;
  }, [classified]);

  /* assign materials + shadow flags once; hide the GLB's own terrain
     sheet (the app provides terrain + grid) */
  useEffect(() => {
    Object.entries(classified).forEach(([id, meshes]) =>
      meshes.forEach((mesh) => {
        mesh.material = materials[id];
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      })
    );

    model.traverse((o) => {
      if (o.name === "Antarctic_Terrain") o.visible = false;
    });
  }, [classified, materials, model]);

  /* per-frame live status + layer visibility */
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    Object.entries(materials).forEach(([id, mat]) => {
      const status = liveAssets[id]?.status || "offline";
      const color = STATUS[status].color;
      mat.color.set(color);
      mat.emissive.set(color);

      if (status === "critical" || status === "degraded") {
        const pulse = 0.5 + Math.sin(t * 3.2) * 0.5;
        mat.emissiveIntensity = 0.25 + pulse * 0.55;
      } else if (selectedAssetId === id) {
        mat.emissiveIntensity = 0.6;
      } else if (status === "offline") {
        mat.emissiveIntensity = 0.06;
      } else {
        mat.emissiveIntensity = 0.14;
      }
    });

    Object.entries(classified).forEach(([id, meshes]) =>
      meshes.forEach((mesh) => {
        mesh.visible = visibleAssetIds.has(id);
      })
    );
  });

  /*
    click / hover → asset id. Structure meshes can sit in front of an
    asset, so scan ALL intersections for the first mapped hit instead
    of trusting only the closest object.
  */
  const assetFromEvent = (e) => {
    for (const hit of e.intersections || []) {
      let obj = hit.object;
      while (obj) {
        const found = NODE_TO_ASSET.find(([re]) => re.test(obj.name));
        if (found) return found[1];
        obj = obj.parent;
      }
    }
    return null;
  };

  return (
    <group
      position={[-fit.cx * fit.scale, -fit.minY * fit.scale, -fit.cz * fit.scale]}
      scale={fit.scale}
      onClick={(e) => {
        e.stopPropagation();
        const id = assetFromEvent(e);
        if (id) onSelect(id);
      }}
      onPointerMove={(e) => {
        const id = assetFromEvent(e);
        if (id) {
          e.stopPropagation();
          setHoveredId(id);
          onHover?.({
            id,
            x: e.clientX ?? e.nativeEvent?.clientX ?? 0,
            y: e.clientY ?? e.nativeEvent?.clientY ?? 0,
          });
        }
      }}
      onPointerOver={(e) => {
        const id = assetFromEvent(e);
        if (id) {
          e.stopPropagation();
          setHoveredId(id);
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={(e) => {
        const id = assetFromEvent(e);
        if (id) {
          setHoveredId(null);
          onHover?.(null);
          document.body.style.cursor = "auto";
        }
      }}
    >
      <primitive object={model} />
    </group>
  );
}

/*
  Status pillar + ground ring at an asset's anchor. Anchor coords go
  through the same fit transform as the model so overlays hug it.
*/
function AssetMarker({ def, live, selected, onSelect }) {
  const fit = useModelFit();
  const pillar = useRef();

  const anchor = ANCHORS[def.id];

  /* pulse via emissive (a scale pulse would sink the pillar underground) */
  useFrame((state) => {
    const mat = pillar.current?.material;
    if (!mat) return;
    const status = live?.status || "offline";
    const critical = status === "critical" || status === "degraded";
    if (critical) {
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 3.2) * 0.5;
      mat.emissiveIntensity = 0.4 + pulse * 0.8;
    } else {
      mat.emissiveIntensity = selected ? 1.1 : status === "offline" ? 0.2 : 0.5;
    }
  });

  if (!anchor) return null;

  const x = (anchor[0] - fit.cx) * fit.scale;
  const z = (anchor[1] - fit.cz) * fit.scale;
  const radius = ANCHOR_RADIUS[def.id] || 2.4;
  const color = STATUS[live?.status || "offline"].color;

  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(def.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <mesh ref={pillar} position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 2.2, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.82}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 0.5, 44]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.95 : 0.55}
        />
      </mesh>

      {selected && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius + 0.9, radius + 1.3, 44]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

function Terrain() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 0]}
      receiveShadow
    >
      <planeGeometry args={[130, 130]} />
      <meshStandardMaterial color="#e4edf0" roughness={1} />
    </mesh>
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
  const shownIds = useMemo(() => new Set(shown.map((a) => a.id)), [shown]);
  const [hover, setHover] = useState(null);
  const [focusToken, setFocusToken] = useState(0);
  const wrapRef = useRef(null);

  /* "Center camera on asset" button re-triggers the fly-to */
  useEffect(() => {
    const handler = () => setFocusToken((t) => t + 1);
    window.addEventListener("polaris-refocus", handler);
    return () => window.removeEventListener("polaris-refocus", handler);
  }, []);

  const tooltipData = useMemo(() => {
    if (!hover || !wrapRef.current) return null;
    const def = assets.find((a) => a.id === hover.id);
    if (!def) return null;
    const rect = wrapRef.current.getBoundingClientRect();
    return {
      def,
      status: STATUS[liveAssets[def.id]?.status || "offline"],
      x: hover.x - rect.left,
      y: hover.y - rect.top,
    };
  }, [hover, assets, liveAssets]);

  return (
    <div className="twin-scene-wrap" ref={wrapRef}>
      <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [34, 25, 36], fov: 42 }}
      onPointerMissed={() => {
        setHover(null);
        onSelect(null);
      }}
      onCreated={(state) => {
        if (typeof window !== "undefined") window.__polaris3d = state;
      }}
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
        <CameraFly
          selectedAssetId={selectedAssetId}
          focusToken={focusToken}
        />

        <StationModel
          liveAssets={liveAssets}
          visibleAssetIds={shownIds}
          selectedAssetId={selectedAssetId}
          onSelect={onSelect}
          onHover={setHover}
        />

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
          <AssetMarker
            key={def.id}
            def={def}
            live={liveAssets[def.id]}
            selected={selectedAssetId === def.id}
            onSelect={onSelect}
          />
        ))}
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan
        maxPolarAngle={Math.PI / 2.15}
        minDistance={8}
        maxDistance={90}
        target={[0, 2, 0]}
      />
    </Canvas>

      {tooltipData && (
        <div
          className="twin-tooltip"
          style={{ left: tooltipData.x, top: tooltipData.y }}
        >
          <strong>{tooltipData.def.name}</strong>
          <span style={{ color: tooltipData.status.color }}>
            {tooltipData.status.label}
          </span>
        </div>
      )}
    </div>
  );
}

useGLTF.preload(MODEL_URL);
