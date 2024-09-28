// src/components/Shaders.ts
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import React from "react";

const PointShaderMaterial = shaderMaterial(
  {
    uTime: 0,
  },
  // Vertex Shader
  `
  uniform float uTime;
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    vec3 pos = position;
    pos += 0.1 * sin(uTime + position);
    gl_PointSize = 4.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `,
  // Fragment Shader
  `
  uniform float uTime;
  varying vec3 vPosition;
  void main() {
    float intensity = length(vPosition) * 0.1;
    vec3 color = vec3(0.5 + 0.5 * sin(intensity + uTime), 0.5, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`
);

const LineShaderMaterial = shaderMaterial(
  {},
  // Vertex Shader
  `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  varying vec3 vPosition;
  vec3 color = vec3(1.0, 0.0, 1.0); // Neon magenta
  void main() {
    gl_FragColor = vec4(color, 1.0);
  }
`
);

extend({ PointShaderMaterial, LineShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    pointShaderMaterial: any;
    lineShaderMaterial: any;
  }
}

export const PointMaterial = React.forwardRef((props, ref) => (
  <pointShaderMaterial ref={ref} attach="material" />
));
export const LineMaterial = () => <lineShaderMaterial attach="material" />;
