import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import type { CanvasProps } from '@react-three/fiber';
import { Preload } from '@react-three/drei';

interface ThreeSceneProps extends Omit<CanvasProps, 'children'> {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  // Performance options
  dpr?: [number, number] | number;
  frameloop?: 'always' | 'demand' | 'never';
  // Camera options
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  // Lighting options
  ambientIntensity?: number;
  directionalIntensity?: number;
}

/**
 * ThreeScene - A reusable container component for Three.js scenes
 * 
 * This component provides a standardized way to create Three.js scenes
 * with React Three Fiber. It includes:
 * - Suspense boundary for async loading
 * - Preload for assets
 * - Configurable camera and lighting
 * - Performance optimizations
 * 
 * @example
 * ```tsx
 * <ThreeScene cameraPosition={[0, 0, 5]} className="w-full h-screen">
 *   <mesh>
 *     <boxGeometry />
 *     <meshStandardMaterial color="blue" />
 *   </mesh>
 * </ThreeScene>
 * ```
 */
export function ThreeScene({
  children,
  className = '',
  fallback = null,
  dpr = [1, 2],
  frameloop = 'always',
  cameraPosition = [0, 0, 5],
  cameraFov = 75,
  ambientIntensity = 0.5,
  directionalIntensity = 1,
  ...canvasProps
}: ThreeSceneProps) {
  return (
    <div className={`relative ${className}`}>
      <Canvas
        dpr={dpr}
        frameloop={frameloop}
        camera={{
          position: cameraPosition,
          fov: cameraFov,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        {...canvasProps}
      >
        <Suspense fallback={fallback}>
          {/* Default lighting setup */}
          <ambientLight intensity={ambientIntensity} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={directionalIntensity}
            castShadow
          />
          
          {/* Scene content */}
          {children}
          
          {/* Preload all assets */}
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}

/**
 * ThreeSceneBackground - A full-screen background Three.js scene
 * 
 * This component creates a fixed, full-screen Three.js scene that sits
 * behind other content. Useful for animated backgrounds.
 * 
 * @example
 * ```tsx
 * <ThreeSceneBackground>
 *   <ParticleField />
 * </ThreeSceneBackground>
 * ```
 */
export function ThreeSceneBackground({
  children,
  className = '',
  ...props
}: ThreeSceneProps) {
  return (
    <ThreeScene
      className={`fixed inset-0 z-0 pointer-events-none ${className}`}
      frameloop="always"
      {...props}
    >
      {children}
    </ThreeScene>
  );
}

export default ThreeScene;
