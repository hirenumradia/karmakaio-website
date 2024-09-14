// src/App.tsx
import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PointCloud } from "./3d/PointCloud";
import { Controls } from "./3d/Controls";

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
      <PointCloud shape={shape} pointCount={1000} scale={5} />
    </Canvas>
  );
};

export default App;
