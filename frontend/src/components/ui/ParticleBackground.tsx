import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Number of particles
const PARTICLE_COUNT = 1500;

interface ParticleFieldProps {
  color?: string;
  size?: number;
  speed?: number;
}

/**
 * ParticleField - Animated particle system using InstancedMesh for performance
 * 
 * Uses InstancedMesh to render thousands of particles efficiently.
 * Particles move slowly and respond to mouse position.
 */
function ParticleField({ 
  color = '#3b82f6', 
  size = 0.02,
  speed = 0.0005 
}: ParticleFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport, pointer } = useThree();
  
  // Store particle data
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10 - 5
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * speed,
          (Math.random() - 0.5) * speed,
          (Math.random() - 0.5) * speed * 0.5
        ),
        scale: Math.random() * 0.5 + 0.5,
      });
    }
    return temp;
  }, [speed]);

  // Dummy object for matrix calculations
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Animation loop
  useFrame(() => {
    if (!meshRef.current) return;

    // Mouse influence
    const mouseX = pointer.x * viewport.width * 0.5;
    const mouseY = pointer.y * viewport.height * 0.5;

    particles.forEach((particle, i) => {
      // Update position
      particle.position.add(particle.velocity);

      // Mouse attraction (subtle)
      const dx = mouseX - particle.position.x;
      const dy = mouseY - particle.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 5) {
        particle.position.x += dx * 0.001;
        particle.position.y += dy * 0.001;
      }

      // Wrap around boundaries
      if (particle.position.x > 10) particle.position.x = -10;
      if (particle.position.x < -10) particle.position.x = 10;
      if (particle.position.y > 10) particle.position.y = -10;
      if (particle.position.y < -10) particle.position.y = 10;
      if (particle.position.z > 0) particle.position.z = -10;
      if (particle.position.z < -10) particle.position.z = 0;

      // Update instance matrix
      dummy.position.copy(particle.position);
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </instancedMesh>
  );
}

/**
 * ConnectionLines - Draws lines between nearby particles (reserved for future use)
 */
// function ConnectionLines({ color = '#3b82f6' }: { color?: string }) {
//   const linesRef = useRef<THREE.LineSegments>(null);
//   const { pointer, viewport } = useThree();
//   
//   // Create line geometry
//   const lineGeometry = useMemo(() => {
//     const geometry = new THREE.BufferGeometry();
//     const positions = new Float32Array(PARTICLE_COUNT * 6); // 2 points per line, 3 coords each
//     geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
//     return geometry;
//   }, []);
// 
//   const lineMaterial = useMemo(() => {
//     return new THREE.LineBasicMaterial({
//       color,
//       transparent: true,
//       opacity: 0.15,
//     });
//   }, [color]);
// 
//   return (
//     <lineSegments ref={linesRef} geometry={lineGeometry} material={lineMaterial} />
//   );
// }

interface ParticleBackgroundProps {
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * ParticleBackground - Full-screen animated particle background
 * 
 * Creates an immersive 3D particle effect for the homepage.
 * Features:
 * - Thousands of particles using InstancedMesh for performance
 * - Mouse interaction (particles attracted to cursor)
 * - Smooth floating animation
 * - Configurable colors
 * 
 * @example
 * ```tsx
 * <ParticleBackground 
 *   primaryColor="#3b82f6" 
 *   secondaryColor="#8b5cf6" 
 * />
 * ```
 */
export function ParticleBackground({
  className = '',
  primaryColor = '#3b82f6',
  secondaryColor = '#8b5cf6',
}: ParticleBackgroundProps) {
  return (
    <div className={`fixed inset-0 z-0 pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Ambient lighting */}
        <ambientLight intensity={0.3} />
        
        {/* Primary particle field */}
        <ParticleField color={primaryColor} size={0.025} speed={0.0003} />
        
        {/* Secondary particle field (smaller, different color) */}
        <ParticleField color={secondaryColor} size={0.015} speed={0.0002} />
        
        {/* Fog for depth effect */}
        <fog attach="fog" args={['#111827', 5, 20]} />
      </Canvas>
    </div>
  );
}

export default ParticleBackground;
