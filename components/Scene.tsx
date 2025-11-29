import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { Avatar3D } from './Avatar3D';

interface SceneProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

export const Scene: React.FC<SceneProps> = ({ analyser, isActive }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]} // Optimize for pixel ratio
    >
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#ffaa00" />
      {/* Fire colors: Red/Orange spotlights */}
      <spotLight position={[-10, 10, -10]} intensity={2} color="#ff4400" />
      <spotLight position={[10, -10, 10]} intensity={2} color="#ffaa00" />
      
      <Avatar3D analyser={analyser} isActive={isActive} />
      
      <ContactShadows 
        opacity={0.4} 
        scale={10} 
        blur={2} 
        far={4.5} 
        color="#330000" 
      />
      
      {/* Warm environment */}
      <Environment preset="sunset" />
    </Canvas>
  );
};