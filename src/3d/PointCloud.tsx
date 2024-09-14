// src/components/PointCloud.tsx
import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BufferGeometry } from "three";
import { PointMaterial, LineMaterial } from "./Shaders";
import {
  generateHeartShape,
  generateSmileyShape,
  generateSaturnShape,
} from "./Shapes";

interface PointCloudProps {
  shape: "heart" | "smiley" | "saturn";
  pointCount?: number;
  scale?: number;
}

export const PointCloud: React.FC<PointCloudProps> = ({
  shape,
  pointCount = 1000,
  scale = 1, // Default scale
}) => {
  const positionsRef = useRef<THREE.BufferAttribute>(null);
  const linePositionsRef = useRef<THREE.BufferAttribute>(null);
  const prevShape = useRef<string>(shape);
  const progressRef = useRef(0);
  const lineGeometryRef = useRef<THREE.BufferGeometry>(null);

  const shapes = useMemo(() => {
    return {
      heart: generateHeartShape(pointCount),
      smiley: generateSmileyShape(pointCount),
      saturn: generateSaturnShape(pointCount),
    };
  }, [pointCount]);

  const currentPositions = useMemo(() => shapes[shape], [shapes, shape]);
  const previousPositions = useMemo(
    () => shapes[prevShape.current as keyof typeof shapes],
    [shapes]
  );

  useFrame((state, delta) => {
    if (prevShape.current !== shape) {
      progressRef.current += delta;
      const progress = Math.min(progressRef.current / 1.0, 1); // Animation duration is 1 second
      const positions = positionsRef.current?.array as Float32Array;

      for (let i = 0; i < positions.length; i++) {
        positions[i] =
          previousPositions[i] +
          (currentPositions[i] - previousPositions[i]) * progress;
      }

      positionsRef.current!.needsUpdate = true;

      if (progress >= 1) {
        prevShape.current = shape;
        progressRef.current = 0;
      }
    } else {
      const positions = positionsRef.current?.array as Float32Array;
      for (let i = 0; i < positions.length; i++) {
        positions[i] = currentPositions[i];
      }
      positionsRef.current!.needsUpdate = true;
    }

    // Update line positions
    if (lineGeometryRef.current) {
      const linePositions = generateLinePositions(
        positionsRef.current!.array as Float32Array
      );
      const positionAttribute = new THREE.BufferAttribute(linePositions, 3);
      lineGeometryRef.current.setAttribute("position", positionAttribute);
    }
  });

  const generateLinePositions = (positions: Float32Array): Float32Array => {
    const threshold = 1.5;
    const posArray = [];
    const numPoints = positions.length / 3;
    for (let i = 0; i < numPoints; i++) {
      for (let j = i + 1; j < numPoints; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < threshold) {
          posArray.push(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2],
            positions[j * 3],
            positions[j * 3 + 1],
            positions[j * 3 + 2]
          );
        }
      }
    }
    return new Float32Array(posArray);
  };

  return (
    <group scale={[scale, scale, scale]}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            ref={positionsRef}
            attach="attributes-position"
            count={currentPositions.length / 3}
            array={currentPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <PointMaterial />
      </points>
      <lineSegments>
        <bufferGeometry ref={lineGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            count={0}
            array={new Float32Array()}
            itemSize={3}
          />
        </bufferGeometry>
        <LineMaterial />
      </lineSegments>
    </group>
  );
};
