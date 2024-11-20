// src/App.tsx
import React, { useRef, useState } from "react";
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
import AudioPlayer from "./components/AudioPlayer"; // Import the AudioPlayer component
import { AudioProvider } from "./context/AudioContext"; // Import the AudioProvider
import AudioPlayerTest from "./components/AudioPlayerTest";
import { Leva } from 'leva'
import PointCloudTest from "./3d/PointCloudTest";

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
     chaosAmount: { value: 0.6, min: 0, max: 1, step: 0.01 },
  });

  // References for lights to attach helpers
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const pointLight1Ref = useRef<THREE.PointLight>(null);
  const pointLight2Ref = useRef<THREE.PointLight>(null);

  return (
    <AudioProvider>
      <div className="App">
        <Leva />
        {/* Audio Player anchored at the bottom */}
        <AudioPlayer />

        {/* Glass-like Button */}
        <button
          className="glass-button"
          onClick={() => window.open('https://linktr.ee/karmakaio', '_blank')}
          aria-label="OPEN" // Added for accessibility
        >
          OPEN 
        </button>
        <Canvas
          onClick={handleCanvasClick}
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1,
            outputColorSpace: 'srgb',
            shadowMap: {
              enabled: true,
              type: THREE.PCFSoftShadowMap,
              autoUpdate: true,
              needsUpdate: false,
            },
          } as Partial<THREE.WebGLRendererParameters>}
          camera={{ position: [0, 1, 35], fov: 80 }}
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
          
          {/* Optional: Add helpers for debugging */}
          {directionalLightRef.current && (
            <directionalLightHelper args={[directionalLightRef.current, 1]} />
          )}
          {pointLight1Ref.current && (
            <pointLightHelper args={[pointLight1Ref.current, 0.5]} />
          )}
          {pointLight2Ref.current && (
            <pointLightHelper args={[pointLight2Ref.current, 0.5]} />
          )}

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
          {/* <PointCloudTest /> */}
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
    </AudioProvider>
  );
};

export default App;
