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

const shapes = ["heart", "smiley", "saturn"] as const;
type ShapeType = (typeof shapes)[number];

const App: React.FC = () => {
  const [shapeIndex, setShapeIndex] = useState(0);
  const [shape, setShape] = useState<ShapeType>("heart");

  const handleCanvasClick = () => {
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
    <Canvas
      camera={{ position: [0, 0, 30], fov: 75 }}
      onClick={handleCanvasClick}
    >
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
      />
      <pointLight position={[-5, -5, -5]} intensity={0.5} />

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
          luminanceThreshold={0.2}
          luminanceSmoothing={0.5}
          intensity={0.8}
          height={300}
        />
      </EffectComposer>
    </Canvas>
  );
};

export default App;
