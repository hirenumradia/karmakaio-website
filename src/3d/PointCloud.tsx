// src/components/PointCloud.tsx

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PointMaterial, LineMaterial } from "./Shaders";
import {
  generateHeartShape,
  generateSmileyShape,
  generateSaturnShape,
} from "./Shapes";
import { kdTree } from "kd-tree-javascript";

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

  const [linePositions, setLinePositions] = useState<Float32Array>(
    new Float32Array()
  );

  // Generate positionsArray once
  const positionsArray = useMemo(
    () => new Float32Array(shapes[shape].length),
    [shapes, shape]
  );

  // Move line generation to useEffect
  useEffect(() => {
    const positions = positionsRef.current?.array as Float32Array;
    // Copy currentPositions into positions array
    positions.set(currentPositions);
    positionsRef.current!.needsUpdate = true;

    // Generate line positions when the shape changes
    const newLinePositions = generateLinePositions(positions, 3);
    setLinePositions(newLinePositions);

    // Update the line geometry
    if (lineGeometryRef.current) {
      const positionAttribute = new THREE.BufferAttribute(newLinePositions, 3);
      lineGeometryRef.current.setAttribute("position", positionAttribute);
    }

    // Update previousPositions
    previousPositions.current = currentPositions;
  }, [shape]); // Run this effect when the shape changes

  // Update positions during animation
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
      }
    }
  });

  const generateLinePositions = (
    positions: Float32Array,
    k: number
  ): Float32Array => {
    const posArray = [];
    const numPoints = positions.length / 3;

    // Convert positions to point objects
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: positions[i * 3],
        y: positions[i * 3 + 1],
        z: positions[i * 3 + 2],
        index: i,
      });
    }

    // Define distance function
    function distance(a: any, b: any) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = a.z - b.z;
      return dx * dx + dy * dy + dz * dz;
    }

    // Build KD-Tree
    const tree = new kdTree(points, distance, ["x", "y", "z"]);

    // For each point, find the K nearest neighbors
    for (let i = 0; i < numPoints; i++) {
      const point = points[i];
      const neighbors = tree.nearest(point, k + 1); // +1 because the nearest neighbor is the point itself

      // Connect lines to the K nearest neighbors
      for (const neighbor of neighbors) {
        const neighborPoint = neighbor[0];
        if (neighborPoint.index !== point.index) {
          posArray.push(
            point.x,
            point.y,
            point.z,
            neighborPoint.x,
            neighborPoint.y,
            neighborPoint.z
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
