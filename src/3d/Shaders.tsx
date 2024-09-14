// src/components/Shaders.ts
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

const PointShaderMaterial = shaderMaterial(
  {},
  // Vertex Shader
  `
  void main() {
    gl_PointSize = 2.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  void main() {
    gl_FragColor = vec4(0.6, 0.8, 1.0, 1.0); // Soft blue color
  }
`
);

const LineShaderMaterial = shaderMaterial(
  {},
  // Vertex Shader
  `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  void main() {
    gl_FragColor = vec4(0.2, 0.5, 1.0, 0.6); // Transparent blue
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

export const PointMaterial = () => <pointShaderMaterial attach="material" />;
export const LineMaterial = () => <lineShaderMaterial attach="material" />;
