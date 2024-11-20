// PointCloudTest.tsx
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./ShadersTest"; // Import to ensure that ColorShaderMaterial is extended

const PointCloudTest: React.FC = () => {
  // Typed ref for the shader material
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state) => {
    if (materialRef.current) {
      // Update the uTime uniform
      (materialRef.current.uniforms.uTime as THREE.IUniform<number>).value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <colorShaderMaterial ref={materialRef} />
    </mesh>
  );
};

export default PointCloudTest;