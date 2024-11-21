// src/components/3d/Shapes.ts

import * as THREE from "three";

export const generateHeartShape = (pointCount: number): Float32Array => {
  const positions = new Float32Array(pointCount * 3);
  const depth = 1;
  let i = 0;

  for (let p = 0; p < pointCount; p++) {
    // Generate random parameters for the original 2D heart
    const t = Math.PI * (Math.random() * 2 - 1);
    const s = Math.random();

    // Original 2D heart coordinates
    const x2D = 16 * Math.pow(Math.sin(t), 3);
    const y2D =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    // Scale down the heart size
    const scale = 0.2;
    const x = x2D * s * scale;
    const y = y2D * s * scale;

    // Assign a z-coordinate to add depth
    // You can choose different strategies for z:
    // 1. Random within a range
    // 2. Symmetrical points (front and back)
    // 3. Layered points for smoothness

    // Here, we'll assign z as a random value within [-depth/2, depth/2]
    const z = (Math.random() - 0.5) * depth;

    positions[i++] = x;
    positions[i++] = y;
    positions[i++] = z;
  }

  return positions;
};

export const generateSmileyShape = (
  pointCount: number,
  depth: number = 1.0
): Float32Array => {
  const positions = [];
  const faceRadius = 5;

  for (let p = 0; p < pointCount; p++) {
    // Determine which part of the smiley the point belongs to
    const portion = p / pointCount;
    let x2D = 0;
    let y2D = 0;

    if (portion < 0.5) {
      // Face Outline
      const theta = Math.random() * Math.PI * 2;
      x2D = faceRadius * Math.cos(theta);
      y2D = faceRadius * Math.sin(theta);
    } else if (portion < 0.6) {
      // Left Eye
      x2D = THREE.MathUtils.randFloat(-2, -1);
      y2D = THREE.MathUtils.randFloat(1, 2);
    } else if (portion < 0.7) {
      // Right Eye
      x2D = THREE.MathUtils.randFloat(1, 2);
      y2D = THREE.MathUtils.randFloat(1, 2);
    } else {
      // Mouth
      const theta = THREE.MathUtils.randFloat(Math.PI * 0.1, Math.PI * 0.9);
      x2D = faceRadius * 0.6 * Math.cos(theta);
      y2D = -faceRadius * 0.6 * Math.sin(theta) - 1;
    }

    // Scale if necessary (optional)
    // const scale = 0.2;
    // x2D *= scale;
    // y2D *= scale;

    // Assign a random z-coordinate for depth
    const z = (Math.random() - 0.5) * depth;

    positions.push(x2D, y2D, z);
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
