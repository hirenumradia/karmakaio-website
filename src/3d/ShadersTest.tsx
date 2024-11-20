// ShaderMaterial.ts
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";
import { ReactThreeFiber } from "@react-three/fiber";

// Define the ColorShaderMaterial using shaderMaterial
const ColorShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    colorA: new THREE.Color(0xff0000),
    colorB: new THREE.Color(0x0000ff),
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
    uniform float uTime;
    uniform vec3 colorA;
    uniform vec3 colorB;
    varying vec2 vUv;

    void main() {
      float mixValue = (sin(uTime) * 0.5) + 0.5;
      vec3 color = mix(colorA, colorB, mixValue);
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