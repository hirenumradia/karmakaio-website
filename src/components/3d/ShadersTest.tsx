// src/components/3d/ShadersTest.tsx

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { ReactThreeFiber } from '@react-three/fiber';

// Define the ColorShaderMaterial using shaderMaterial
const ColorShaderMaterial = shaderMaterial(
  {
    uMixValue: 0, // Uniform to control color mixing based on bass
    colorA: new THREE.Color(0x0000ff), // Blue color for low bass volumes
    colorB: new THREE.Color(0xff0000), // Red color for high bass volumes
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uMixValue;
    uniform vec3 colorA;
    uniform vec3 colorB;
    varying vec2 vUv;

    void main() {
      vec3 color = mix(colorA, colorB, uMixValue);
      gl_FragColor = vec4(color, 1.0);
    }
  `
);

// Extend R3F with ColorShaderMaterial
extend({ ColorShaderMaterial });

// TypeScript Module Augmentation for JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      colorShaderMaterial: ReactThreeFiber.Object3DNode<THREE.ShaderMaterial, typeof ColorShaderMaterial>;
    }
  }
}

export { ColorShaderMaterial };