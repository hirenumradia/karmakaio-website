// src/components/PointCloud.tsx

import React, { useMemo, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PointMaterial, LineMaterial, LineShaderMaterialType, PointShaderMaterialType } from "./Shaders";
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
  const lineGeometryRef = useRef<THREE.LineSegments>(null);
  const lineMaterialRef = useRef<LineShaderMaterialType>(null);
  const prevShape = useRef<string>(shape);
  const progressRef = useRef(0);
  const pointMaterialRef = useRef<PointShaderMaterialType>(null);
  const previousPositions = useRef<Float32Array>(new Float32Array());

  const { camera } = useThree();

  // Function to generate line positions based on KD-Tree
  const generateLinePositions = (
    positions: Float32Array,
    k: number
  ): Float32Array => {
    const posArray: number[] = [];
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

  // Initialize positionsArray and linePositions
  const [positionsArray, setPositionsArray] = React.useState<Float32Array>(
    new Float32Array()
  );
  const [linePositions, setLinePositions] = React.useState<Float32Array>(
    new Float32Array()
  );

  useEffect(() => {
    // Generate initial positions based on shape
    let currentPositions: Float32Array;
    switch (shape) {
      case "heart":
        currentPositions = generateHeartShape(pointCount);
        break;
      case "smiley":
        currentPositions = generateSmileyShape(pointCount);
        break;
      case "saturn":
        currentPositions = generateSaturnShape(pointCount);
        break;
      default:
        currentPositions = new Float32Array(pointCount * 3);
    }

    setPositionsArray(currentPositions);
    setLinePositions(generateLinePositions(currentPositions, 5)); // Example: k=5
    previousPositions.current = currentPositions.slice();
    prevShape.current = shape;
    progressRef.current = 0;
  }, [shape, pointCount]);

  useEffect(() => {
    if (lineGeometryRef.current && linePositions.length > 0) {
      const positionAttribute = new THREE.BufferAttribute(linePositions, 3);
      lineGeometryRef.current.geometry.setAttribute("position", positionAttribute);
    }
  }, [linePositions]);

  // Update uniforms and positions during animation
  useFrame((state, delta) => {
    const positions = positionsRef.current?.array as Float32Array;

    // Update uCameraPosition uniform in LineMaterial
    if (lineMaterialRef.current) {
      (lineMaterialRef.current as any).uniforms.uCameraPosition.value.copy(
        camera.position
      );
    }

    // Update uTime uniform in PointMaterial
    if (pointMaterialRef.current) {
      (pointMaterialRef.current as any).uniforms.uTime.value += delta;
    }

    if (prevShape.current !== shape) {
      progressRef.current += delta;
      const progress = Math.min(progressRef.current / 1.0, 1); // Animation duration is 1 second

      for (let i = 0; i < positions.length; i++) {
        positions[i] =
          previousPositions.current[i] +
          (positionsArray[i] - previousPositions.current[i]) * progress;
      }

      positionsRef.current!.needsUpdate = true;

      if (progress >= 1) {
        prevShape.current = shape;
        progressRef.current = 0;
        previousPositions.current = positionsArray.slice();
      }
    }
  });

  return (
    <group scale={[scale, scale, scale]}>
      {/* Points */}
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
        <PointMaterial ref={pointMaterialRef} />
      </points>

      {/* Glowing Lines */}
      <lineSegments ref={lineGeometryRef}>
        <bufferGeometry />
        <LineMaterial
          ref={lineMaterialRef}
          color={0x39FF14}
          linewidth={2}
          maxDistance={100.0}
        />
      </lineSegments>
    </group>
  );
};
