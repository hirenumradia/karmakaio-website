// src/3d/PointCloud.tsx

import React, { useMemo, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PointMaterial, LineMaterial } from "./Shaders";
import {
  generateHeartShape,
  generateSmileyShape,
  generateSaturnShape,
} from "./Shapes";
import { kdTree } from "kd-tree-javascript";
import { useAudioContext } from "../context/AudioContext";

interface PointCloudProps {
  shape: "heart" | "smiley" | "saturn";
  pointCount?: number;
  scale?: number;
}

export const PointCloud: React.FC<PointCloudProps> = ({
  shape,
  pointCount = 1000,
  scale = 8,
}) => {
  const positionsRef = useRef<THREE.BufferAttribute | null>(null);
  const lineGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const lineMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const pointMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const prevShape = useRef<string>(shape);
  const progressRef = useRef(0);
  const previousPositions = useRef<Float32Array>(new Float32Array());
  const homePositions = useRef<THREE.Vector3[]>([]);
  const lastLogTime = useRef(0);
  const { camera, clock } = useThree();

  const { amplitude, frequencies } = useAudioContext();

  // Define variables for displacement (modifiable for tweaking)
  const displacementScale = useRef(1.0); // Base scale for displacement
  const scatterProbability = useRef(0.3); // Base probability for scatter
  const scatterScale = useRef(0.2); // Scale factor for scatter displacement
  const nonLinearExponent = useRef(1.5); // Exponent for non-linear scaling

  // Add this new ref to store the initial neighbor indices
  const neighborIndicesRef = useRef<number[]>([]);

  // Add these new refs for position interpolation
  const currentPositions = useRef<Float32Array>(new Float32Array());
  const targetPositions = useRef<Float32Array>(new Float32Array());
  const interpolationSpeed = useRef(0.15); // Adjust this value to control smoothness (0.1-0.3 range)

  // Generate initial shape
  const initialShape = useMemo(() => {
    let positions: Float32Array;
    switch (shape) {
      case "heart":
        positions = generateHeartShape(pointCount);
        break;
      case "smiley":
        positions = generateSmileyShape(pointCount);
        break;
      case "saturn":
      default:
        positions = generateSaturnShape(pointCount);
        break;
    }
    
    // Apply scale directly to the initial positions
    const scaledPositions = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i++) {
      scaledPositions[i] = positions[i] * scale;
    }
    return scaledPositions;
  }, [shape, pointCount, scale]);

  // Initialize home positions and buffer attributes
  useEffect(() => {
    homePositions.current = [];
    for (let i = 0; i < initialShape.length; i += 3) {
      homePositions.current.push(
        new THREE.Vector3(
          initialShape[i],
          initialShape[i + 1],
          initialShape[i + 2]
        )
      );
    }

    // Set positions in buffer
    if (!positionsRef.current) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(initialShape, 3).setUsage(
          THREE.DynamicDrawUsage
        )
      );
      positionsRef.current = geometry.getAttribute("position") as THREE.BufferAttribute;
    } else {
      positionsRef.current.array = initialShape;
      positionsRef.current.needsUpdate = true;
    }
  }, [initialShape]);

  // Modify the line positions effect to only calculate KNN once
  useEffect(() => {
    if (!positionsRef.current) return;

    const generateLineIndices = (positionsArray: Float32Array, K: number): number[] => {
      const points = [];
      for (let i = 0; i < positionsArray.length; i += 3) {
        points.push({
          x: positionsArray[i],
          y: positionsArray[i + 1],
          z: positionsArray[i + 2],
          index: i / 3,
        });
      }

      const distance = (a: any, b: any) => {
        return Math.sqrt(
          (a.x - b.x) ** 2 +
          (a.y - b.y) ** 2 +
          (a.z - b.z) ** 2
        );
      };

      const tree = new kdTree(points, distance, ["x", "y", "z"]);
      const indices: number[] = [];
      
      points.forEach((point) => {
        const nearest = tree.nearest(point, K + 1);
        nearest.forEach((neighbor: any[]) => {
          if (neighbor[0] !== point) {
            indices.push(point.index, neighbor[0].index);
          }
        });
      });

      return indices;
    };

    // Store the neighbor indices
    neighborIndicesRef.current = generateLineIndices(
      positionsRef.current.array as Float32Array,
      6
    );

    // Create initial line geometry
    const linePositions = new Float32Array(neighborIndicesRef.current.length * 3);
    if (!lineGeometryRef.current) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage)
      );
      lineGeometryRef.current = geometry;
    }
  }, [initialShape]); // Only run when initial shape changes

  // Animation frame update
  useFrame((state, delta) => {
    if (!positionsRef.current || !lineGeometryRef.current) return;

    const positions = positionsRef.current.array as Float32Array;
    
    // Initialize current and target positions if not already set
    if (currentPositions.current.length === 0) {
      currentPositions.current = new Float32Array(positions.length);
      targetPositions.current = new Float32Array(positions.length);
      positions.forEach((v, i) => {
        currentPositions.current[i] = v;
        targetPositions.current[i] = v;
      });
    }

    // Calculate new target positions
    const scaledAmplitude = Math.pow(amplitude * 2, nonLinearExponent.current) * displacementScale.current;
    const dynamicScatterProbability = scatterProbability.current * (1 + amplitude);
    
    for (let i = 0; i < positions.length; i += 3) {
      const home = homePositions.current[i / 3];
      const shouldScatter = Math.random() < dynamicScatterProbability;
      
      if (shouldScatter) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = scaledAmplitude * scatterScale.current * 3;
        
        targetPositions.current[i] = home.x + r * Math.sin(phi) * Math.cos(theta);
        targetPositions.current[i + 1] = home.y + r * Math.sin(phi) * Math.sin(theta);
        targetPositions.current[i + 2] = home.z + r * Math.cos(phi);
      } else {
        const pulseFreq = 2.0;
        const time = state.clock.elapsedTime;
        const pulseFactor = 1 + Math.sin(time * pulseFreq) * 0.2;
        
        const dir = home.clone().normalize();
        const displacement = dir.multiplyScalar(scaledAmplitude * pulseFactor);
        
        targetPositions.current[i] = home.x + displacement.x;
        targetPositions.current[i + 1] = home.y + displacement.y;
        targetPositions.current[i + 2] = home.z + displacement.z;
      }
    }

    // Smoothly interpolate current positions towards target positions
    for (let i = 0; i < positions.length; i++) {
      currentPositions.current[i] += (targetPositions.current[i] - currentPositions.current[i]) * interpolationSpeed.current;
      positions[i] = currentPositions.current[i];
    }

    // Update line positions using interpolated positions
    const linePositions = lineGeometryRef.current.getAttribute("position").array as Float32Array;
    neighborIndicesRef.current.forEach((pointIndex, i) => {
      const posIndex = pointIndex * 3;
      const lineIndex = i * 3;
      linePositions[lineIndex] = positions[posIndex];
      linePositions[lineIndex + 1] = positions[posIndex + 1];
      linePositions[lineIndex + 2] = positions[posIndex + 2];
    });

    // Update materials and geometries
    lineGeometryRef.current.getAttribute("position").needsUpdate = true;
    
    if (lineMaterialRef.current?.uniforms) {
      lineMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      lineMaterialRef.current.uniforms.uAmplitude.value = amplitude;
      lineMaterialRef.current.uniforms.uFrequencies.value = frequencies;

      // Add debug logging
      if (frequencies && frequencies.length > 0) {
        console.log('Frequency Data:', {
          min: Math.min.apply(null, Array.from(frequencies)),
          max: Math.max.apply(null, Array.from(frequencies)),
          avg: Array.from(frequencies).reduce((sum, val) => sum + val, 0) / frequencies.length,
          length: frequencies.length,
          firstFew: frequencies.slice(0, 5),  // Show first 5 values
        });
      } else {
        console.log('No frequency data available');
      }
    }

    if (pointMaterialRef.current?.uniforms) {
      pointMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    positionsRef.current.needsUpdate = true;
  });

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute
            ref={positionsRef}
            attach="attributes-position"
            count={initialShape.length / 3}
            array={initialShape}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <PointMaterial
          ref={pointMaterialRef}
          uTime={clock.getElapsedTime()}
        />
      </points>

      {lineGeometryRef.current && (
        <lineSegments geometry={lineGeometryRef.current}>
          <LineMaterial
            ref={lineMaterialRef}
            color={0x00ff44}
            maxDistance={100}
            linewidth={1}
            uTime={clock.getElapsedTime()}
            uAmplitude={amplitude}
            uFrequencies={frequencies}
            uCameraPosition={new Float32Array(camera.position.toArray())}
          />
        </lineSegments>
      )}
    </group>
  );
};
