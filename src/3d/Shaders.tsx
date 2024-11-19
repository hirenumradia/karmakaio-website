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

  precision highp float;

  uniform vec3 uCameraPosition;
  uniform float maxDistance;
  uniform float uTime;
  uniform float uAmplitude;

  varying float vDistance;
  varying vec3 vPosition;
  varying float vAmplitude;
  varying vec3 vNormal;

  // Noise function for organic movement
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
      vec3 pos = position;
      vAmplitude = uAmplitude;
      vNormal = normalize(pos);
      
      // Ferrofluid-like behavior
      float noiseTime = uTime * 0.5;
      float noise = snoise(vec3(pos.x * 0.3, pos.y * 0.3, noiseTime));
      
      // Radial wave effect
      float radialDistance = length(pos);
      float radialWave = sin(radialDistance * 0.8 - uTime * 2.0);
      
      // Combined displacement
      float baseDisplacement = uAmplitude * (0.3 + 0.7 * noise);
      float waveDisplacement = radialWave * uAmplitude * 0.3;
      
      // Smooth falloff from center
      float falloff = exp(-radialDistance * 0.1);
      
      // Apply displacement along normal
      pos += vNormal * (baseDisplacement + waveDisplacement) * falloff;
      
      // Add subtle rotation
      float rotationAngle = uTime * 0.2 * (1.0 - falloff);
      float cosA = cos(rotationAngle);
      float sinA = sin(rotationAngle);
      pos.xz = mat2(cosA, -sinA, sinA, cosA) * pos.xz;
      
      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vDistance = distance(worldPosition.xyz, uCameraPosition);
      vPosition = pos;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `,
  // Fragment Shader
  `
    precision highp float;

    uniform float maxDistance;
    uniform vec3 color;
    uniform float uTime;
    uniform float uAmplitude;

    varying float vDistance;
    varying vec3 vPosition;
    varying float vAmplitude;
    varying vec3 vNormal;

  void main() {
    float attenuation = 1.0 - clamp(vDistance / maxDistance, 0.0, 1.0);
    
    // Dynamic color based on amplitude and position
    vec3 baseColor = color;
    float energyFactor = pow(vAmplitude, 1.5);
    
    // Pulsing effect
    float pulse = smoothstep(0.0, 1.0, sin(uTime * 3.0) * 0.5 + 0.5);
    float energyPulse = mix(0.8, 1.2, pulse * energyFactor);
    
    // Color variation based on position and energy
    vec3 hotColor = vec3(1.0, 0.3, 0.1);
    vec3 coolColor = vec3(0.1, 0.3, 1.0);
    float colorMix = smoothstep(-1.0, 1.0, sin(length(vPosition) * 0.2 + uTime));
    vec3 dynamicColor = mix(coolColor, hotColor, colorMix);
    
    // Combine colors with energy
    vec3 finalColor = mix(baseColor, dynamicColor, energyFactor * 0.5) * energyPulse;
    
    // Edge glow
    float fresnel = pow(1.0 - abs(dot(normalize(vPosition), vNormal)), 2.0);
    vec3 glowColor = vec3(0.3, 0.8, 1.0) * fresnel * vAmplitude;
    
    finalColor += glowColor;
    
    // Apply distance attenuation with smooth falloff
    float smoothAttenuation = smoothstep(0.0, 1.0, attenuation);
    gl_FragColor = vec4(finalColor * smoothAttenuation, smoothAttenuation);
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
