import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Torus, Cylinder, Octahedron, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface Avatar3DProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

export const Avatar3D: React.FC<Avatar3DProps> = ({ analyser, isActive }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  
  // Data array for audio analysis
  const dataArray = useMemo(() => new Uint8Array(128), []);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Gentle floating animation
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.2;
    
    // Idle rotation
    if (outerRingRef.current) {
        outerRingRef.current.rotation.x = t * 0.2;
        outerRingRef.current.rotation.y = t * 0.1;
    }

    // Audio reactivity
    let audioValue = 0;
    if (analyser && isActive) {
      analyser.getByteFrequencyData(dataArray);
      // Average frequency for general energy
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      audioValue = avg / 255; // Normalized 0-1
    }

    // Animate Core (Pulse)
    if (coreRef.current) {
      const targetScale = 1 + (audioValue * 0.5);
      coreRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
      
      // Color shift based on activity
      const material = coreRef.current.material as THREE.MeshStandardMaterial;
      
      // FIRE THEME: Orange idle, Bright Yellow/White active
      const targetColor = isActive ? new THREE.Color('#ff4400') : new THREE.Color('#331100');
      if (audioValue > 0.1) {
          targetColor.set('#ffcc00'); // Speaking color (Gold/Yellow)
      }
      material.emissive.lerp(targetColor, 0.1);
    }

    // Animate Mouth (Height scale)
    if (mouthRef.current) {
        // Map audio value to mouth opening
        const openY = 0.1 + (audioValue * 2);
        mouthRef.current.scale.lerp(new THREE.Vector3(1, openY, 1), 0.3);
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Main Head Structure */}
        
        {/* The Core Brain - Fire Heart */}
        <Octahedron ref={coreRef} args={[1, 2]} position={[0, 0, 0]}>
            <meshStandardMaterial 
                color="#220000" 
                wireframe={true} 
                emissive="#ff4400" 
                emissiveIntensity={0.8} 
            />
        </Octahedron>

        {/* Glossy Shell */}
        <Sphere args={[1.2, 32, 32]} position={[0, 0, 0]}>
            <meshPhysicalMaterial 
                color="#330000" 
                transmission={0.6} 
                opacity={0.3} 
                roughness={0} 
                thickness={1} 
                transparent 
            />
        </Sphere>

        {/* Eyes */}
        <group position={[0, 0.3, 1]}>
            <Sphere args={[0.15, 32, 32]} position={[-0.4, 0, 0]}>
                <meshStandardMaterial color={isActive ? "#ffaa00" : "#331100"} emissive={isActive ? "#ffaa00" : "#000"} emissiveIntensity={2} />
            </Sphere>
            <Sphere args={[0.15, 32, 32]} position={[0.4, 0, 0]}>
                <meshStandardMaterial color={isActive ? "#ffaa00" : "#331100"} emissive={isActive ? "#ffaa00" : "#000"} emissiveIntensity={2} />
            </Sphere>
        </group>

        {/* Mouth Visualization */}
        <group position={[0, -0.4, 1]}>
             <Cylinder ref={mouthRef} args={[0.05, 0.05, 1, 8]} rotation={[0, 0, Math.PI / 2]}>
                <meshStandardMaterial color="#fff" emissive="#ffaa00" emissiveIntensity={1} />
             </Cylinder>
        </group>

        {/* Outer Ring */}
        <Torus ref={outerRingRef} args={[1.8, 0.05, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#552200" metalness={1} roughness={0.2} />
        </Torus>
      </Float>

      {/* Environment Decoration */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
};