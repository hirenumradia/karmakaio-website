// src/3d/Shaders.tsx
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import React from "react";
import { ShaderMaterial, Vector3, IUniform, Color, ColorRepresentation  } from "three";

// Define the material types
export interface PointShaderMaterialType extends ShaderMaterial {
  uniforms: {
    uTime: IUniform<number>;
  };
}

export interface LineShaderMaterialType extends ShaderMaterial {
  uniforms: {
    maxDistance: IUniform<number>;
    uCameraPosition: IUniform<Vector3>;
    color: IUniform<number>;
    linewidth: IUniform<number>;
  };
}

export const PointShaderMaterial = shaderMaterial(
  {
    uTime: 0,
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
) as unknown as new () => ShaderMaterial;

export const LineShaderMaterial = shaderMaterial(
  {
    maxDistance: 100.0,
    uCameraPosition: new Vector3(),
    color: 0xff0000,
    linewidth: 1.0,
  },
  // Vertex Shader
  `
    uniform vec3 uCameraPosition;
    uniform float maxDistance;
    varying float vDistance;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vDistance = distance(worldPosition.xyz, uCameraPosition);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    precision mediump float;
    uniform float maxDistance;
    uniform vec3 color;
    uniform float linewidth;
    varying float vDistance;

    void main() {
      float attenuation = 1.0 - clamp(vDistance / maxDistance, 0.0, 1.0);
      gl_FragColor = vec4(color * attenuation, 1.0);
    }
  `
) as unknown as new () => ShaderMaterial;

extend({ PointShaderMaterial, LineShaderMaterial });

// Declare module augmentation
declare module "@react-three/fiber" {
  interface ThreeElements {
    pointShaderMaterial: JSX.IntrinsicElements["shaderMaterial"] & {
      uniforms?: Partial<PointShaderMaterialType["uniforms"]>;
    };
    lineShaderMaterial: JSX.IntrinsicElements["shaderMaterial"] & {
      uniforms?: Partial<LineShaderMaterialType["uniforms"]>;
    };
  }
}

// Props interfaces
interface PointMaterialProps {
  uTime?: number;
}

interface LineMaterialProps {
  maxDistance?: number;
  uCameraPosition?: Vector3;
  color?: ColorRepresentation;
  linewidth?: number;
}

// Create typed components
export const PointMaterial = React.forwardRef<PointShaderMaterialType, PointMaterialProps>(
  ({ uTime, ...props }, ref) => (
    <pointShaderMaterial
      ref={ref}
      {...props}
      uniforms-uTime-value={uTime}
    />
  )
);

export const LineMaterial = React.forwardRef<LineShaderMaterialType, LineMaterialProps>(
  ({ maxDistance = 100, uCameraPosition, color = 0xff0000, linewidth = 1, ...props }, ref) => {
    // Ensure color is a THREE.Color object
    const colorValue = color instanceof Color ? color : new Color(color);

    // Ensure uCameraPosition is initialized
    const cameraPositionValue = uCameraPosition || new Vector3();

    return (
      <lineShaderMaterial
        ref={ref}
        {...props}
        uniforms-maxDistance-value={maxDistance}
        uniforms-uCameraPosition-value={cameraPositionValue}
        uniforms-color-value={colorValue}
        uniforms-linewidth-value={linewidth}
      />
    );
  }
);

const checkShaderErrors = (shader: WebGLShader, gl: WebGLRenderingContext) => {
  const info = gl.getShaderInfoLog(shader);
  if (info) {
    console.error('Shader compilation error:', info);
  }
};
