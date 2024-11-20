// PointCloudTest.tsx
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./ShadersTest"; // Ensure ColorShaderMaterial is extended
import { useAudioContext } from "../context/AudioContext"; // Import your Audio Context

const PointCloudTest: React.FC = () => {
  // Typed ref for the shader material
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Access audio data from context
  const { frequencies, amplitude, isPlaying, isPlayingTransitionedTo } = useAudioContext();

  const mixValueRef = useRef(0);
  const previousNormalizedMixRef = useRef(0);
  const fadeOutFactor = 0.05;

  useFrame((state) => {
    if (materialRef.current) {
      // Define the number of bass frequency bins to consider
    const bassBinCount = 20; // Adjust based on FFT size and desired frequency range

    console.log("frequencies", frequencies);
    
    // Slice the frequencies array to focus on bass frequencies
    const bassFrequencies = frequencies.slice(0, bassBinCount);

    console.log("bassFrequencies", bassFrequencies);
    
    // Calculate the average amplitude of bass frequencies
    let averageBass = bassFrequencies.reduce((sum, freq) => sum + freq, 0) / bassFrequencies.length;

    if(!averageBass){
        averageBass = 0
    }
    
    console.log("averageBass", averageBass);
    
    // Normalize the average bass value to [0, 1]
    // Assuming frequencies are in the range [0, 255]
    let normalizedMix = THREE.MathUtils.clamp(averageBass / 255, 0, 1);

    console.log("normalizedMix", normalizedMix);

    normalizedMix = Math.log1p(normalizedMix * 255) / Math.log1p(255);

    console.log("normalizedMix2", normalizedMix);

    // Scale up the normalized mix value to enhance reactivity
    const scalingFactor = 10; // Adjust this factor as needed
    normalizedMix = THREE.MathUtils.clamp(normalizedMix * scalingFactor, 0, 1);

    console.log("normalizedMix3", normalizedMix);

    if(!isPlayingTransitionedTo.from && !isPlayingTransitionedTo.to){
        normalizedMix = 0
        previousNormalizedMixRef.current = 0
    }

    if(!isPlaying && !isPlayingTransitionedTo.to){
        previousNormalizedMixRef.current -= fadeOutFactor; // Gradually decrease mixValueRef
        previousNormalizedMixRef.current = Math.max(previousNormalizedMixRef.current, 0); // Ensure it doesn't go below 0
        normalizedMix = previousNormalizedMixRef.current
    }

    if(isPlaying){
        previousNormalizedMixRef.current = normalizedMix; // Gradually increase mixValueRef
    }

    console.log("normalizedMix4", normalizedMix);

    // Apply simple exponential smoothing for smoother transitions
    const smoothingFactor = 0.1; // Adjust between 0 (no smoothing) and 1 (no change)
    mixValueRef.current += (normalizedMix - mixValueRef.current) * smoothingFactor;

    console.log("mixValueRef", mixValueRef.current);
    
    // Update the uMixValue uniform with the normalized bass volume
    (materialRef.current.uniforms.uMixValue as THREE.IUniform<number>).value = normalizedMix;
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