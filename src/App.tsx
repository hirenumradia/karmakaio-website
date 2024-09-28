// src/App.tsx
import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PointCloud } from "./3d/PointCloud";
import { Controls } from "./3d/Controls";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Stars } from "@react-three/drei";

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

  return (
    <Canvas
      camera={{ position: [0, 0, 30], fov: 75 }}
      onClick={handleCanvasClick}
    >
      <ambientLight intensity={0.5} />
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
      <PointCloud shape={shape} pointCount={500} scale={5} />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0}
          luminanceSmoothing={0.9}
          intensity={1.5}
          height={300}
        />
      </EffectComposer>
    </Canvas>
  );
};

export default App;
