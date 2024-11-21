// src/components/3d/PointCloudTest.tsx

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "src/components/3d/ShadersTest"; // Ensure ColorShaderMaterial is extended
import { useAudioContext } from "src/components/context/AudioContext"; // Import your Audio Context
import { updateNormalizedMix } from "src/components/utils/3d";

const PointCloudTest: React.FC = () => {
  // Typed ref for the shader material
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Access audio data from context
  const { amplitude, isPlaying, isPlayingTransitionedTo } = useAudioContext();

  const mixValueRef = useRef(0); // Controls the mix value of the shader
  const previousNormalizedMixRef = useRef(0); // Stores the previous normalized mix value for the fade-out effect
  const fadeOutFactor = 0.05; // Adjust this value to control the fade-out speed


  useFrame((state) => {
    if (materialRef.current) {
      // Apply logarithmic scaling to amplitude
      let normalizedMix = THREE.MathUtils.clamp(amplitude, 0, 1);
      normalizedMix = Math.log1p(normalizedMix * 10) / Math.log1p(10); // Adjust scaling factor as needed

      // Update normalizedMix based on playback state
      const currentNormalizedMix = updateNormalizedMix(normalizedMix, isPlaying, isPlayingTransitionedTo, fadeOutFactor, previousNormalizedMixRef);

      // Apply simple exponential smoothing for smoother transitions
      const smoothingFactor = 0.1; // Adjust between 0 (no smoothing) and 1 (no change)
      mixValueRef.current += (currentNormalizedMix - mixValueRef.current) * smoothingFactor;

      // Update the uMixValue uniform with the smoothed mix value
      (materialRef.current.uniforms.uMixValue as THREE.IUniform<number>).value = mixValueRef.current;
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