import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Line } from "@react-three/drei";
import * as THREE from "three";

const BRAND_BLUE = "#1a3cc4";
const TEAL = "#007a8c";
const ACCENT = "#2d55f5";

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(2.5, 3), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: BRAND_BLUE,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      }),
    []
  );

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.001;
  });

  return <mesh ref={meshRef} geometry={geo} material={mat} />;
}

function MessageNodes() {
  const groupRef = useRef<THREE.Group>(null!);
  const positions = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 12; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 2.5;
      pts.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ]);
    }
    return pts;
  }, []);

  const offsets = useMemo(() => positions.map(() => Math.random() * Math.PI * 2), [positions]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const s = 0.8 + 0.4 * Math.sin(t * 0.8 + offsets[i]);
      child.scale.setScalar(s);
    });
  });

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <Sphere key={i} args={[0.06, 16, 16]} position={pos}>
          <meshBasicMaterial
            color={i % 2 === 0 ? BRAND_BLUE : TEAL}
            toneMapped={false}
          />
        </Sphere>
      ))}
    </group>
  );
}

function DataStreams() {
  const lines = useMemo(() => {
    const result: { points: THREE.Vector3[]; speed: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const phi1 = Math.acos(2 * Math.random() - 1);
      const theta1 = Math.random() * Math.PI * 2;
      const phi2 = Math.acos(2 * Math.random() - 1);
      const theta2 = Math.random() * Math.PI * 2;
      const r = 2.5;
      const p1 = new THREE.Vector3(
        r * Math.sin(phi1) * Math.cos(theta1),
        r * Math.sin(phi1) * Math.sin(theta1),
        r * Math.cos(phi1)
      );
      const p2 = new THREE.Vector3(
        r * Math.sin(phi2) * Math.cos(theta2),
        r * Math.sin(phi2) * Math.sin(theta2),
        r * Math.cos(phi2)
      );
      const mid = p1.clone().add(p2).multiplyScalar(0.5).multiplyScalar(1.3);
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      result.push({ points: curve.getPoints(32), speed: 0.3 + Math.random() * 0.5 });
    }
    return result;
  }, []);

  return (
    <>
      {lines.map((line, i) => (
        <AnimatedLine key={i} points={line.points} speed={line.speed} />
      ))}
    </>
  );
}

function AnimatedLine({ points, speed }: { points: THREE.Vector3[]; speed: number }) {
  const matRef = useRef<THREE.LineBasicMaterial>(null!);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.opacity = 0.1 + 0.5 * (0.5 + 0.5 * Math.sin(clock.getElapsedTime() * speed));
    }
  });

  return (
    <Line
      points={points}
      color={ACCENT}
      lineWidth={1}
      transparent
      opacity={0.3}
      ref={(line: any) => {
        if (line?.material) matRef.current = line.material;
      }}
    />
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null!);
  const { positions, geo } = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { positions: pos, geo: g };
  }, []);

  useFrame(() => {
    for (let i = 0; i < 200; i++) {
      positions[i * 3 + 1] += 0.001;
      if (positions[i * 3 + 1] > 3) positions[i * 3 + 1] = -3;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial color={BRAND_BLUE} size={0.02} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function Scene() {
  return (
    <>
      <Globe />
      <MessageNodes />
      <DataStreams />
      <ParticleField />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function HeroCanvas() {
  return (
    <div className="absolute inset-0 z-0 hidden md:block">
      <Suspense fallback={null}>
        <Canvas
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0, 6], fov: 50 }}
          style={{ background: "transparent" }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
