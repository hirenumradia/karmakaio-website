// src/App.tsx
import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PointCloud } from "./3d/PointCloud";
import { Controls } from "./3d/Controls";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { ParticleSwarm } from "./3d/ParticleSwarm";
import { Stars } from "@react-three/drei";
import { useControls } from 'leva';
import KarmaHeading from "./3d/KarmaHeading";
import ResponsiveCamera from "./3d/ResponsiveCamera"; // Import the ResponsiveCamera
import * as THREE from 'three';
import "./App.css"; // Ensure you import the CSS

const shapes = ["heart", "smiley", "saturn"] as const;
type ShapeType = (typeof shapes)[number];

const App: React.FC = () => {
  // Fix the shape to "saturn" by setting a constant
  const fixedShape: ShapeType = "saturn";
  const [shapeIndex, setShapeIndex] = useState(2);
  const [shape, setShape] = useState<ShapeType>(fixedShape);

  const handleCanvasClick = () => {
    if (fixedShape) {
      return;
    }
    const nextIndex = (shapeIndex + 1) % shapes.length;
    setShapeIndex(nextIndex);
    setShape(shapes[nextIndex]);
  };

  const {
    trailLength,
    rainbowIntensity,
    noiseScale,
    noiseSpeed,
    spiralSpeed,
    spiralTightness,
    chaosAmount
  } = useControls({
     trailLength: { value: 16.2, min: 1, max: 20, step: 0.1 },
     rainbowIntensity: { value: 0.91, min: 0, max: 1, step: 0.01 },
     noiseScale: { value: 0.88, min: 0.01, max: 1, step: 0.01 },
     noiseSpeed: { value: 0.2, min: 0, max: 2, step: 0.1 },
     spiralSpeed: { value: 0.4, min: 0, max: 2, step: 0.1 },
     spiralTightness: { value: 0.9, min: 0.1, max: 5, step: 0.1 },
     chaosAmount: { value: 0.60, min: 0, max: 1, step: 0.01 },
  });

  return (
    <div className="App">
      {/* Glass-like Button */}
      <button
        className="glass-button"
        onClick={() => window.open('https://linktr.ee/karmakaio', '_blank')}
        aria-label="Stream Now" // Added for accessibility
      >
        STREAM NOW
      </button>
      <Canvas
        onClick={handleCanvasClick}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          outputColorSpace: 'srgb',
        }}
      >
        {/* Responsive Camera */}
        <ResponsiveCamera />

        {/* Lighting Setup */}
        <hemisphereLight 
          color={0xffffff} 
          groundColor={0x444444} 
          intensity={0.6} 
        />
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 10, 7.5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={500}
        />
        <pointLight 
          position={[-10, -10, -10]} 
          intensity={0.5} 
          color={0xffaa00} 
        />
        <pointLight 
          position={[10, 10, 10]} 
          intensity={0.5} 
          color={0x00aaff} 
        />

        <Controls />
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        <ParticleSwarm   
          trailLength={trailLength}
          rainbowIntensity={rainbowIntensity}
          noiseScale={noiseScale}
          noiseSpeed={noiseSpeed}
          spiralSpeed={spiralSpeed}
          spiralTightness={spiralTightness}
          chaosAmount={chaosAmount} 
        />
        <PointCloud shape={shape} pointCount={500} scale={5} />
        <KarmaHeading />
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.4}
            luminanceSmoothing={0.3}
            intensity={1.0}
            height={300}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default App;
