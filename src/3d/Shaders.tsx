// src/3d/Shaders.tsx
import { shaderMaterial } from "@react-three/drei";
import { extend, MaterialNode  } from "@react-three/fiber";
import React from "react";
import { Vector3, Color, ColorRepresentation, ShaderMaterial } from "three";

// 1. Define Uniform Interfaces with Direct Value Types
interface PointUniforms {
  uTime: number;
}

interface LineUniforms {
  maxDistance: number;
  uCameraPosition: Float32Array;
  color: ColorRepresentation;
  linewidth: number;
  uTime: number;
  uAmplitude: number;
}

// 2. Create Shader Materials Using `shaderMaterial` with Correct Uniform Definitions
export const PointShaderMaterial = shaderMaterial(
  {
    uTime: 0 as number,
  },
  // Vertex Shader
  `
    precision mediump float;
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
    precision mediump float;
    uniform float uTime;
    varying vec3 vPosition;
    void main() {
      float intensity = length(vPosition) * 0.1;
      vec3 color = vec3(0.2 + 0.1 * sin(intensity + uTime), 0.2, 0.3);
      gl_FragColor = vec4(color, 1.0);
    }
  `
);

export const LineShaderMaterial = shaderMaterial(
  {
    maxDistance: 100.0,
    uCameraPosition: new Float32Array([0, 0, 0]),
    color: new Color(0xff0000),
    linewidth: 1.0,
    uTime: 0.0,
    uAmplitude: 0.0,
  },
  // Vertex Shader
  `
    precision mediump float;
    
    uniform vec3 uCameraPosition;
    uniform float maxDistance;
    uniform float uTime;
    uniform float uAmplitude;
    varying float vDistance;

    void main() {
      vec3 pos = position;

      // Calculate displacement
      float displacement = uAmplitude * 2.0 + 0.2 * sin(uTime * 2.0 + length(pos));

      // Displace the vertex radially
      pos += normalize(pos) * displacement;

      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vDistance = distance(worldPosition.xyz, uCameraPosition);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    precision mediump float;
    
    uniform float maxDistance;
    uniform vec3 color;
    uniform float uAmplitude;
    varying float vDistance;

    void main() {
      float attenuation = 1.0 - clamp(vDistance / maxDistance, 0.0, 1.0);

      // Adjust color intensity based on amplitude
      vec3 finalColor = color * (0.5 + 0.5 * uAmplitude);

      gl_FragColor = vec4(finalColor * attenuation, 1.0);
    }
  `
);

// 3. Extend React Three Fiber's Intrinsic Elements with Custom Materials
extend({ PointShaderMaterial, LineShaderMaterial });

// 4. Module Augmentation for TypeScript to Recognize Custom Materials
declare module '@react-three/fiber' {
  interface ThreeElements {
    pointShaderMaterial: JSX.IntrinsicElements['shaderMaterial'] & {
      uniforms: {
        uTime: { value: number };
      };
    };
    lineShaderMaterial: JSX.IntrinsicElements['shaderMaterial'] & {
      uniforms: {
        maxDistance: { value: number };
        uCameraPosition: { value: Float32Array };
        color: { value: ColorRepresentation };
        linewidth: { value: number };
        uTime: { value: number };
        uAmplitude: { value: number };
      };
    };
  }
}

// 5. Define Material Instance Types
type PointShaderMaterialType = InstanceType<typeof PointShaderMaterial>;
type LineShaderMaterialType = InstanceType<typeof LineShaderMaterial>;

// 6. Define Props Interfaces for React Components
interface PointMaterialProps {
  uTime?: number;
}

interface LineMaterialProps {
  maxDistance?: number;
  uCameraPosition?: Float32Array;
  color?: ColorRepresentation;
  linewidth?: number;
  uTime?: number;
  uAmplitude?: number;
}

// 7. Create React Components with Forwarded Refs and Correct Typing
export const PointMaterial = React.forwardRef<PointShaderMaterialType, PointMaterialProps>(
  ({ uTime = 0, ...props }, ref) => (
    <pointShaderMaterial
      ref={ref}
      {...props}
      uniforms={{
        uTime: { value: uTime }
      }}
    />
  )
);

export const LineMaterial = React.forwardRef<LineShaderMaterialType, LineMaterialProps>(
  ({ maxDistance = 100, uCameraPosition = new Float32Array([0, 0, 0]), color = 0xffffff, linewidth = 1, uTime = 0.0, uAmplitude = 0.0, ...props }, ref) => {
    const cameraPosition = new Float32Array(
      Array.isArray(uCameraPosition) ? uCameraPosition : [0, 0, 0]
    );

    return (
      <lineShaderMaterial
        ref={ref}
        {...props}
        uniforms={{
          maxDistance: { value: maxDistance },
          uCameraPosition: { value: cameraPosition },
          color: { value: new Color(color) },
          linewidth: { value: linewidth },
          uTime: { value: uTime },
          uAmplitude: { value: uAmplitude },
        }}
      />
    );
  }
);
