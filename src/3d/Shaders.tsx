// src/components/Shaders.ts
import { shaderMaterial } from "@react-three/drei";
import { extend, ReactThreeFiber } from "@react-three/fiber";
import React from "react";
import { ShaderMaterial } from "three";

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
      vec3 color = vec3(0.2 + 0.1 * sin(intensity + uTime), 0.2, 0.3);
      gl_FragColor = vec4(color, 1.0);
    }
  `
) as unknown as new () => ShaderMaterial;

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
) as unknown as new () => ShaderMaterial;

extend({ PointShaderMaterial, LineShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    pointShaderMaterial: ReactThreeFiber.Object3DNode<
      ShaderMaterial,
      typeof PointShaderMaterial
    >;
    lineShaderMaterial: ReactThreeFiber.Object3DNode<
      ShaderMaterial,
      typeof LineShaderMaterial
    >;
  }
}

type ShaderMaterialProps = JSX.IntrinsicElements["shaderMaterial"] & {
  [key: string]: any;
};

export const PointMaterial = React.forwardRef<
  ShaderMaterial,
  ShaderMaterialProps
>((props, ref) => <pointShaderMaterial ref={ref} {...props} />);

export const LineMaterial = React.forwardRef<
  ShaderMaterial,
  ShaderMaterialProps
>((props, ref) => <lineShaderMaterial ref={ref} {...props} />);
