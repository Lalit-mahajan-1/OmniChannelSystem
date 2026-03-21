import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

const BRAND_BLUE = "#1a3cc4";
const TEAL = "#007a8c";

const STEPS = [
  { label: "Connect", x: -4.5 },
  { label: "Analyze", x: -1.5 },
  { label: "Route", x: 1.5 },
  { label: "Respond", x: 4.5 },
];

function StepNode({ position, label }: { position: [number, number, number]; label: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  const geo = useMemo(() => new THREE.SphereGeometry(0.3, 24, 24), []);

  useFrame(({ clock }) => {
    ref.current.scale.setScalar(1 + 0.05 * Math.sin(clock.getElapsedTime() * 1.5));
  });

  return (
    <group position={position}>
      <mesh ref={ref} geometry={geo}>
        <meshStandardMaterial color={BRAND_BLUE} emissive={BRAND_BLUE} emissiveIntensity={0.4} />
      </mesh>
      <Text
        position={[0, -0.6, 0]}
        fontSize={0.25}
        color={TEAL}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
    </group>
  );
}

function FlowTube({ from, to, delay }: { from: [number, number, number]; to: [number, number, number]; delay: number }) {
  const ballRef = useRef<THREE.Mesh>(null!);

  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      0.5,
      0,
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    );
  }, [from, to]);

  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 32, 0.03, 8, false), [curve]);

  useFrame(({ clock }) => {
    const t = ((clock.getElapsedTime() * 0.3 + delay) % 1);
    const pt = curve.getPoint(t);
    if (ballRef.current) ballRef.current.position.copy(pt);
  });

  return (
    <>
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial color={TEAL} transparent opacity={0.3} />
      </mesh>
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.8} />
      </mesh>
    </>
  );
}

function FlowScene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 5, 5]} intensity={1} />
      {STEPS.map((s) => (
        <StepNode key={s.label} position={[s.x, 0, 0]} label={s.label} />
      ))}
      {STEPS.slice(0, -1).map((s, i) => (
        <FlowTube
          key={i}
          from={[s.x, 0, 0]}
          to={[STEPS[i + 1].x, 0, 0]}
          delay={i * 0.33}
        />
      ))}
    </>
  );
}

export default function FlowCanvas() {
  return (
    <div className="w-full h-[300px] hidden md:block">
      <Suspense fallback={null}>
        <Canvas
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 3, 8], fov: 40 }}
          style={{ background: "transparent" }}
        >
          <FlowScene />
        </Canvas>
      </Suspense>
    </div>
  );
}
