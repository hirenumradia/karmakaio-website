// src/components/Controls.tsx
import React from "react";
import { OrbitControls } from "@react-three/drei";

export const Controls = () => (
  <OrbitControls
    enablePan={true}
    enableZoom={true}
    enableRotate={true}
    autoRotate={true}
    autoRotateSpeed={0.3}
  />
);
