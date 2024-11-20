import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { ShaderMaterial } from "three";

interface DebugValues {
  freqValue: number;
  localFreq: number;
  freqIndex: number;
}

export const ShaderDebugger = ({ material }: { material: React.MutableRefObject<ShaderMaterial | null> }) => {
  const debugValues = useRef<DebugValues[]>([]);
  
  useFrame(() => {
    if (material?.current?.userData?.debug) {
      debugValues.current.push({
        freqValue: material.current.userData.debug.freqValue,
        localFreq: material.current.userData.debug.localFreq,
        freqIndex: material.current.userData.debug.freqIndex
      });
      
      // Keep last 100 frames of debug data
      if (debugValues.current.length > 100) {
        debugValues.current.shift();
      }
      
      console.table({
        freqValue: material.current.userData.debug.freqValue,
        localFreq: material.current.userData.debug.localFreq,
        freqIndex: material.current.userData.debug.freqIndex,
        mixRatio: material.current.userData.debug.freqValue < 0.33 
          ? material.current.userData.debug.freqValue / 0.33 
          : material.current.userData.debug.freqValue < 0.66 
            ? (material.current.userData.debug.freqValue - 0.33) / 0.33
            : (material.current.userData.debug.freqValue - 0.66) / 0.34
      });
    }
  });

  return null;
};