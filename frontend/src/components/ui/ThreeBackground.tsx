import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedShape = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.1;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;

      // Mouse interaction (smooth follow)
      const { x, y } = state.pointer;
      // Move towards mouse position but keep it generally on the right side
      // Base position is [4, 0, 0]
      const targetX = 4 + x * 2; 
      const targetY = y * 2;
      
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.05);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.4}>
      <Sphere args={[2.5, 100, 100]} ref={meshRef} position={[4, 0, 0]}>
        <MeshDistortMaterial
          color="#00f2fe" // Cyan
          attach="material"
          distort={0.5} // Stronger distortion for fluid look
          speed={2}
          roughness={0.1}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </Sphere>
    </Float>
  );
};

const SecondaryShape = () => {
    const meshRef = useRef<THREE.Mesh>(null);
  
    useFrame((state) => {
      if (meshRef.current) {
        meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.05;
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
        
        const { x, y } = state.pointer;
        const targetX = -5 + x * 1; 
        const targetY = -2 + y * 1;
        
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.03);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.03);
      }
    });
  
    return (
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
        <Sphere args={[1.8, 64, 64]} ref={meshRef} position={[-5, -2, -2]}>
          <MeshDistortMaterial
            color="#4facfe" // Blue
            attach="material"
            distort={0.3}
            speed={1.5}
            roughness={0.2}
            metalness={0.1}
          />
        </Sphere>
      </Float>
    );
  };

export const ThreeBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#00f2fe" />
        
        <AnimatedShape />
        <SecondaryShape />
      </Canvas>
    </div>
  );
};
