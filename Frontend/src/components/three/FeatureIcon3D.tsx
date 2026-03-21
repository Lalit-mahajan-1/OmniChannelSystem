import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CYAN = "#00d4ff";
const PURPLE = "#a855f7";
const PINK = "#f472b6";
const YELLOW = "#eab308";

function InboxShape() {
  const ref = useRef<THREE.Mesh>(null!);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 0.6, 0.1), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.4;
    ref.current.position.y = Math.sin(t * 0.8) * 0.1;
  });

  return (
    <mesh ref={ref} geometry={geo}>
      <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.3} />
    </mesh>
  );
}

function BrainShape() {
  const ref = useRef<THREE.Mesh>(null!);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.6, 1), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.rotation.x = t * 0.3;
    ref.current.rotation.y = t * 0.4;
    ref.current.rotation.z = t * 0.2;
  });

  return (
    <mesh ref={ref} geometry={geo}>
      <meshStandardMaterial color={PURPLE} emissive={PURPLE} emissiveIntensity={0.3} />
    </mesh>
  );
}

function LightningShape() {
  const ref = useRef<THREE.Mesh>(null!);
  const geo = useMemo(() => new THREE.ConeGeometry(0.4, 1, 4), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.5;
    const s = 0.9 + 0.1 * Math.sin(t * 2);
    ref.current.scale.setScalar(s);
  });

  return (
    <mesh ref={ref} geometry={geo} rotation={[0, 0, Math.PI]}>
      <meshStandardMaterial color={PINK} emissive={PINK} emissiveIntensity={0.3} />
    </mesh>
  );
}

function DatabaseShape() {
  const ref = useRef<THREE.Group>(null!);
  const geo = useMemo(() => new THREE.CylinderGeometry(0.4, 0.4, 0.2, 24), []);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.4;
  });

  return (
    <group ref={ref}>
      <mesh geometry={geo} position={[0, 0.25, 0]}>
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.3} />
      </mesh>
      <mesh geometry={geo} position={[0, 0, 0]}>
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.2} />
      </mesh>
      <mesh geometry={geo} position={[0, -0.25, 0]}>
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

const SHAPES: Record<string, React.FC> = {
  inbox: InboxShape,
  brain: BrainShape,
  lightning: LightningShape,
  database: DatabaseShape,
};

export default function FeatureIcon3D({ shape }: { shape: string }) {
  const ShapeComponent = SHAPES[shape];
  if (!ShapeComponent) return null;

  return (
    <div className="w-[150px] h-[150px] hidden md:block">
      <Suspense fallback={null}>
        <Canvas
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0, 2.5], fov: 45 }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[3, 3, 3]} intensity={1} />
          <ShapeComponent />
        </Canvas>
      </Suspense>
    </div>
  );
}
