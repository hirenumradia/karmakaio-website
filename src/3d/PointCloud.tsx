// src/components/PointCloud.tsx

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
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
  scale = 1,
}) => {
  const positionsRef = useRef<THREE.BufferAttribute>(null);
  const lineGeometryRef = useRef<THREE.BufferGeometry>(null);
  const prevShape = useRef<string>(shape);
  const progressRef = useRef(0);

  const shapes = useMemo(() => {
    return {
      heart: generateHeartShape(pointCount),
      smiley: generateSmileyShape(pointCount),
      saturn: generateSaturnShape(pointCount),
    };
  }, [pointCount]);

  const currentPositions = useMemo(() => shapes[shape], [shapes, shape]);
  const previousPositions = useRef<Float32Array>(currentPositions);

  const positionsArray = useMemo(
    () => new Float32Array(currentPositions.length),
    [currentPositions.length]
  );

  useFrame((state, delta) => {
    const positions = positionsRef.current?.array as Float32Array;

    if (prevShape.current !== shape) {
      progressRef.current += delta;
      const progress = Math.min(progressRef.current / 1.0, 1); // Animation duration is 1 second

      for (let i = 0; i < positions.length; i++) {
        positions[i] =
          previousPositions.current[i] +
          (currentPositions[i] - previousPositions.current[i]) * progress;
      }

      positionsRef.current!.needsUpdate = true;

      if (progress >= 1) {
        prevShape.current = shape;
        progressRef.current = 0;
        previousPositions.current = currentPositions;
      }
    } else {
      // Copy currentPositions into positions array without modifying currentPositions
      positions.set(currentPositions);
      positionsRef.current!.needsUpdate = true;
    }

    // Update line positions
    if (lineGeometryRef.current) {
      const linePositions = generateLinePositions(positions, 3);
      const positionAttribute = new THREE.BufferAttribute(linePositions, 3);
      lineGeometryRef.current.setAttribute("position", positionAttribute);
    }
  });

  const generateLinePositions = (
    positions: Float32Array,
    k: number
  ): Float32Array => {
    const posArray = [];
    const numPoints = positions.length / 3;

    // Convert positions to Vector3 objects
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      points.push(
        new THREE.Vector3(
          positions[i * 3],
          positions[i * 3 + 1],
          positions[i * 3 + 2]
        )
      );
    }

    // For each point, find the K nearest neighbors
    for (let i = 0; i < numPoints; i++) {
      const distances = [];
      for (let j = 0; j < numPoints; j++) {
        if (i !== j) {
          const dist = points[i].distanceToSquared(points[j]);
          distances.push({ index: j, distance: dist });
        }
      }

      // Sort distances and select the K nearest neighbors
      distances.sort((a, b) => a.distance - b.distance);
      const neighbors = distances.slice(0, k);

      // Connect lines to the K nearest neighbors
      for (const neighbor of neighbors) {
        const j = neighbor.index;
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

    return new Float32Array(posArray);
  };

  return (
    <group scale={[scale, scale, scale]}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            ref={positionsRef}
            attach="attributes-position"
            count={positionsArray.length / 3}
            array={positionsArray}
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
