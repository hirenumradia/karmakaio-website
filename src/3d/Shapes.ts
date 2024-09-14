// src/components/Shapes.ts
import * as THREE from "three";

export const generateHeartShape = (pointCount: number): Float32Array => {
  const positions = new Float32Array(pointCount * 3);
  let i = 0;
  for (let p = 0; p < pointCount; p++) {
    const t = Math.PI * (Math.random() * 2 - 1);
    const s = Math.random();
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    const z = 0; // Flat heart shape in 2D plane
    positions[i++] = x * s * 0.2;
    positions[i++] = y * s * 0.2;
    positions[i++] = z;
  }
  return positions;
};

export const generateSmileyShape = (pointCount: number): Float32Array => {
  const positions = [];
  const faceRadius = 5;

  // Generate face outline points
  for (let i = 0; i < pointCount * 0.5; i++) {
    const theta = Math.random() * Math.PI * 2;
    const x = faceRadius * Math.cos(theta);
    const y = faceRadius * Math.sin(theta);
    positions.push(x, y, 0);
  }

  // Eyes
  for (let i = 0; i < pointCount * 0.1; i++) {
    const x = THREE.MathUtils.randFloat(-2, -1);
    const y = THREE.MathUtils.randFloat(1, 2);
    positions.push(x, y, 0);
  }
  for (let i = 0; i < pointCount * 0.1; i++) {
    const x = THREE.MathUtils.randFloat(1, 2);
    const y = THREE.MathUtils.randFloat(1, 2);
    positions.push(x, y, 0);
  }

  // Mouth
  for (let i = 0; i < pointCount * 0.3; i++) {
    const theta = THREE.MathUtils.randFloat(Math.PI * 0.1, Math.PI * 0.9);
    const x = faceRadius * 0.6 * Math.cos(theta);
    const y = -faceRadius * 0.6 * Math.sin(theta) - 1;
    positions.push(x, y, 0);
  }

  return new Float32Array(positions);
};

export const generateSaturnShape = (pointCount: number): Float32Array => {
  const positions = [];
  const planetRadius = 3;
  const ringInnerRadius = 5;
  const ringOuterRadius = 7;

  // Planet sphere points
  for (let i = 0; i < pointCount * 0.5; i++) {
    const phi = Math.acos(THREE.MathUtils.randFloat(-1, 1));
    const theta = Math.random() * Math.PI * 2;
    const x = planetRadius * Math.sin(phi) * Math.cos(theta);
    const y = planetRadius * Math.sin(phi) * Math.sin(theta);
    const z = planetRadius * Math.cos(phi);
    positions.push(x, y, z);
  }

  // Ring points
  for (let i = 0; i < pointCount * 0.5; i++) {
    const theta = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.randFloat(ringInnerRadius, ringOuterRadius);
    const x = radius * Math.cos(theta);
    const y = 0; // Flat ring in XZ plane
    const z = radius * Math.sin(theta);
    positions.push(x, y, z);
  }

  return new Float32Array(positions);
};
