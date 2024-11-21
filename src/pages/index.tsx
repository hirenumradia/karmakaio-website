// pages/index.tsx
import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointCloud } from 'src/components/3d/PointCloud';
import { Controls } from 'src/components/3d/Controls';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { ParticleSwarm } from 'src/components/3d/ParticleSwarm';
import { Stars } from '@react-three/drei';
import { Leva, useControls } from 'leva';
import KarmaHeading from 'src/components/3d/KarmaHeading';
import * as THREE from 'three';
// import 'src/styles/Home.module.css'; // Update CSS import
import ResponsiveCamera from 'src/components/3d/ResponsiveCamera'; // Adjust path if necessary
import AudioPlayer from '@/components/components/AudioPlayer';

const shapes = ['heart', 'smiley', 'saturn'] as const;
type ShapeType = (typeof shapes)[number];

// Development flag - you can set this based on your environment
const isDev = false

// Default production values
const DEFAULT_CONTROLS = {
  trailLength: 16.2,
  rainbowIntensity: 0.91,
  noiseScale: 0.88,
  noiseSpeed: 0.2,
  spiralSpeed: 0.4,
  spiralTightness: 0.9,
  chaosAmount: 0.6,
};

const Home: React.FC = () => {
  // Fix the shape to "saturn" by setting a constant
  const fixedShape: ShapeType = 'saturn';
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

  // Use controls in development, default values in production
  const controls = isDev
    ? useControls({
        trailLength: { value: DEFAULT_CONTROLS.trailLength, min: 1, max: 20, step: 0.1 },
        rainbowIntensity: { value: DEFAULT_CONTROLS.rainbowIntensity, min: 0, max: 1, step: 0.01 },
        noiseScale: { value: DEFAULT_CONTROLS.noiseScale, min: 0.01, max: 1, step: 0.01 },
        noiseSpeed: { value: DEFAULT_CONTROLS.noiseSpeed, min: 0, max: 2, step: 0.1 },
        spiralSpeed: { value: DEFAULT_CONTROLS.spiralSpeed, min: 0, max: 2, step: 0.1 },
        spiralTightness: { value: DEFAULT_CONTROLS.spiralTightness, min: 0.1, max: 5, step: 0.1 },
        chaosAmount: { value: DEFAULT_CONTROLS.chaosAmount, min: 0, max: 1, step: 0.01 },
      })
    : DEFAULT_CONTROLS;

  // References for lights to attach helpers
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const pointLight1Ref = useRef<THREE.PointLight>(null);
  const pointLight2Ref = useRef<THREE.PointLight>(null);

  return (
    <div className="App">
      {isDev && <Leva collapsed={true} />}
      {/* Audio Player anchored at the bottom */}
      <AudioPlayer />

      {/* Glass-like Button */}
      <button
        className="glass-button"
        onClick={() => window.open('https://linktr.ee/karmakaio', '_blank')}
        aria-label="ENTER"
      >
        ENTER
      </button>

      <Canvas
        className="canvas"
        onClick={handleCanvasClick}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          outputColorSpace: 'srgb',
          // shadowMap: {
          //   enabled: true,
          //   type: THREE.PCFSoftShadowMap,
          //   autoUpdate: true,
          //   needsUpdate: false,
          // },
        }}
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
          trailLength={controls.trailLength}
          rainbowIntensity={controls.rainbowIntensity}
          noiseScale={controls.noiseScale}
          noiseSpeed={controls.noiseSpeed}
          spiralSpeed={controls.spiralSpeed}
          spiralTightness={controls.spiralTightness}
          chaosAmount={controls.chaosAmount}
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
  );
};

export default Home;