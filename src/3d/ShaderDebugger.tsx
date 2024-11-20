import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { ShaderMaterial } from "three";

interface DebugValues {
  // Frequency and Amplitude
  dominantFrequency: number;
  amplitude: number;
  
  // Color Values
  lowColor: number[];
  midColor: number[];
  highColor: number[];
  peakColor: number[];
  
  // Mix Calculations
  freq: number;
  freqRange: string;
  mixRatio: number;
  
  // Final Color Components
  finalColorR: number;
  finalColorG: number;
  finalColorB: number;
  
  // Glow
  glowFactor: number;
  
  // Final Output
  outputColorR: number;
  outputColorG: number;
  outputColorB: number;
  outputAlpha: number;
}

export const ShaderDebugger = ({ material }: { material: React.MutableRefObject<ShaderMaterial | null> }) => {
  const debugValues = useRef<DebugValues[]>([]);
  
  useFrame(() => {
    if (material?.current) {
      const freq = material.current.uniforms.uDominantFrequency.value;
      const amp = material.current.uniforms.uAmplitude.value;
      
      // Calculate mix ratio
      const mixRatio = freq < 0.33 
        ? freq / 0.33 
        : freq < 0.66 
          ? (freq - 0.33) / 0.33
          : (freq - 0.66) / 0.34;
          
      // Determine frequency range
      const freqRange = freq < 0.33 
        ? "LOW (green->cyan)" 
        : freq < 0.66 
          ? "MID (cyan->pink)" 
          : "HIGH (pink->white)";
          
      // Calculate final colors based on shader logic
      const lowColor = [0.0, 1.0, 0.4];
      const midColor = [0.0, 0.8, 1.0];
      const highColor = [1.0, 0.0, 0.8];
      const peakColor = [1.0, 1.0, 1.0];
      
      // Calculate final color components
      let finalColor;
      if (freq < 0.33) {
        finalColor = lowColor.map((l, i) => l + (midColor[i] - l) * (freq / 0.33));
      } else if (freq < 0.66) {
        finalColor = midColor.map((m, i) => m + (highColor[i] - m) * ((freq - 0.33) / 0.33));
      } else {
        finalColor = highColor.map((h, i) => h + (peakColor[i] - h) * ((freq - 0.66) / 0.34));
      }
      
      // Calculate glow
      const glowFactor = 1.0 + (amp * 0.5);
      
      // Calculate final output color
      const outputColor = finalColor.map(c => c * glowFactor);
      
      console.table({
        // Input Values
        dominantFrequency: freq,
        amplitude: amp,
        
        // Color Definitions
        lowColor,
        midColor,
        highColor,
        peakColor,
        
        // Calculations
        freqRange,
        mixRatio,
        
        // Color Components
        finalColorR: finalColor[0],
        finalColorG: finalColor[1],
        finalColorB: finalColor[2],
        
        // Glow
        glowFactor,
        
        // Final Output
        outputColorR: outputColor[0],
        outputColorG: outputColor[1],
        outputColorB: outputColor[2],
        outputAlpha: 1.0
      });
    }
  });

  return null;
};