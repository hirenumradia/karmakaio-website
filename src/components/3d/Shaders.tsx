// src/components/3d/Shaders.tsx

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import React from 'react';
import { ColorRepresentation } from 'three';

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
    linewidth: 1.0,
    uTime: 0.0,
    uAmplitude: 0.0,
  },
  // Vertex Shader
  `
    precision highp float; // Define high precision for floats

    // Uniforms
    uniform float uTime;
    uniform float uAmplitude;
    uniform vec3 uCameraPosition;

    // Varyings
    varying float vAmplitude;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDistance;

    // Noise function declarations
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x) {
      return mod289(((x*34.0)+1.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r) {
      return 1.79284291400159 - 0.85373472095314 * r;
    }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      // First corner
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      // Permutations
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      // Gradients: 7x7 points over a square, mapped onto an octahedron.
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;

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

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      // Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
        vec3 pos = position;
        vAmplitude = uAmplitude;
        vNormal = normalize(pos);
        
        // Enhanced audio-reactive movement
        float noiseTime = uTime * 0.3;
        float noise = snoise(vec3(pos.x * 0.2, pos.y * 0.2, noiseTime));
        
        // Amplitude modulation
        float smoothAmplitude = uAmplitude * 0.7 +
                               (sin(uTime * 2.0) * 0.15 + 0.15) * uAmplitude +
                               (sin(uTime * 4.0) * 0.1 + 0.1) * uAmplitude;
        
        // Enhanced displacement calculation
        float radialDistance = length(pos);
        float radialWave = sin(radialDistance * 0.5 - uTime * 1.5) * 
                          exp(-radialDistance * 0.15);
        
        float baseDisplacement = smoothAmplitude * (0.5 + 0.5 * noise);
        float waveDisplacement = radialWave * smoothAmplitude * 0.4;
        
        float falloff = exp(-radialDistance * 0.08);
        
        vec3 displacement = vNormal * (
            baseDisplacement * falloff +
            waveDisplacement +
            noise * smoothAmplitude * 0.3
        );
        
        pos += displacement;
        
        // Position updates
        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vDistance = distance(worldPosition.xyz, uCameraPosition);
        vPosition = pos;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
  // Fragment Shader
  
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    
    uniform float uAmplitude;

    void main() {

      // Define colors
      vec3 lowColor = vec3(0.0, 1.0, 0.4);    // Bright green
      vec3 midColor = vec3(0.0, 0.8, 1.0);    // Cyan
      vec3 highColor = vec3(1.0, 0.0, 0.8);   // Pink
      vec3 peakColor = vec3(1.0, 1.0, 1.0);   // White

      // Determine color based on amplitude
      vec3 finalColor;
      float amp = clamp(uAmplitude, 0.0, 1.0);

      if(amp  < 0.33) {
          finalColor = mix(lowColor, midColor, amp  / 0.33);
      } else if(amp  < 0.66) {
          finalColor = mix(midColor, highColor, (amp  - 0.33) / 0.33);
      } else {
          finalColor = mix(highColor, peakColor, (amp  - 0.66) / 0.34);
      }

      // Output final color
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// 3. Extend React Three Fiber's Intrinsic Elements with Custom Materials
extend({ PointShaderMaterial, LineShaderMaterial });

// 4. Module Augmentation for TypeScript to Recognize Custom Materials
declare module '@react-three/fiber' {
  interface ThreeElements {
    pointShaderMaterial: JSX.IntrinsicElements['shaderMaterial'] & {
      uTime?: number;
    };
    lineShaderMaterial: JSX.IntrinsicElements['shaderMaterial'] & {
      maxDistance?: number;
      uCameraPosition?: Float32Array;
      linewidth?: number;
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
  linewidth?: number; 
}

// 7. Create React Components with Forwarded Refs and Correct Typing
export const PointMaterial = React.forwardRef<PointShaderMaterialType, PointMaterialProps>(
  ({ uTime = 0, ...props }, ref) => (
    <pointShaderMaterial ref={ref} uTime={uTime} {...props} />
  )
);

export const LineMaterial = React.forwardRef<LineShaderMaterialType, LineMaterialProps>(
  (
    {
      maxDistance = 100,
      uCameraPosition = new Float32Array([0, 0, 0]),
      linewidth = 1

    }, 
    ref
  ) => {
    return (
      <lineShaderMaterial
        ref={ref}
        maxDistance={maxDistance}
        uCameraPosition={uCameraPosition}
        linewidth={linewidth}
        needsUpdate={true}
    />
    );
  }
);
