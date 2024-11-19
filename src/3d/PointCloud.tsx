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
  const { camera } = useThree();

  const { amplitude } = useAudioContext();

  // Define variables for displacement (modifiable for tweaking)
  const displacementScale = useRef(1.0); // Base scale for displacement
  const scatterProbability = useRef(0.3); // Base probability for scatter
  const scatterScale = useRef(0.2); // Scale factor for scatter displacement
  const nonLinearExponent = useRef(1.5); // Exponent for non-linear scaling

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

  // Generate line positions based on KD-Tree
  useEffect(() => {
    if (!positionsRef.current) return;

    const generateLinePositions = (positionsArray: Float32Array, K: number): Float32Array => {
      const points = [];
      for (let i = 0; i < positionsArray.length; i += 3) {
        points.push({
          x: positionsArray[i],
          y: positionsArray[i + 1],
          z: positionsArray[i + 2],
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

      const posArray: number[] = [];
      points.forEach((point, index) => {
        const nearest = tree.nearest(point, K + 1);
        nearest.forEach((neighbor: any[]) => {
          if (neighbor[0] !== point) {
            posArray.push(point.x, point.y, point.z);
            posArray.push(neighbor[0].x, neighbor[0].y, neighbor[0].z);
          }
        });
      });

      return new Float32Array(posArray);
    };

    const linePositions = generateLinePositions(
      positionsRef.current.array as Float32Array,
      6
    ); // K=6 nearest neighbors

    if (!lineGeometryRef.current) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(linePositions, 3).setUsage(
          THREE.DynamicDrawUsage
        )
      );
      lineGeometryRef.current = geometry;
    } else {
      lineGeometryRef.current.setAttribute(
        "position",
        new THREE.BufferAttribute(linePositions, 3).setUsage(
          THREE.DynamicDrawUsage
        )
      );
    }
  }, []);

  // Animation frame update
  useFrame((state, delta) => {
    if (!positionsRef.current) return;

    // Debug log to verify amplitude is being received
    console.log("PointCloud receiving amplitude:", amplitude);

    const positions = positionsRef.current.array as Float32Array;

    // Reduce the displacement effects
    const scaledAmplitude = Math.pow(amplitude * 2, nonLinearExponent.current) * displacementScale.current;
    const dynamicScatterProbability = scatterProbability.current * (1 + amplitude);
    
    // Apply audio-reactive displacement to each point
    for (let i = 0; i < positions.length; i += 3) {
      const home = homePositions.current[i / 3];
      
      const shouldScatter = Math.random() < dynamicScatterProbability;
      
      if (shouldScatter) {
        // Generate random displacement direction with increased range
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = scaledAmplitude * scatterScale.current * 3; // Increased scatter range
        
        // Convert spherical to Cartesian coordinates with more dramatic movement
        positions[i] = home.x + r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = home.y + r * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = home.z + r * Math.cos(phi);
      } else {
        // Radial displacement from home position with pulsing effect
        const pulseFreq = 2.0; // Adjust for faster/slower pulsing
        const time = state.clock.elapsedTime;
        const pulseFactor = 1 + Math.sin(time * pulseFreq) * 0.2; // Subtle pulsing
        
        const dir = home.clone().normalize();
        const displacement = dir.multiplyScalar(scaledAmplitude * pulseFactor);
        
        positions[i] = home.x + displacement.x;
        positions[i + 1] = home.y + displacement.y;
        positions[i + 2] = home.z + displacement.z;
      }
    }

    positionsRef.current.needsUpdate = true;

    // Update line positions if needed
    if (lineGeometryRef.current) {
      const linePositions = lineGeometryRef.current.getAttribute("position") as THREE.BufferAttribute;
      linePositions.needsUpdate = true;
    }
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
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.8}
          color="#00ff44"

        />
      </points>

      <lineSegments>
        <bufferGeometry ref={lineGeometryRef} />
        <lineBasicMaterial 
          color="#00ff44"
          transparent 
          opacity={0.3} 
        />
      </lineSegments>
    </group>
  );
};
