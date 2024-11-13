// src/components/ParticleSwarm.tsx

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, extend, ReactThreeFiber, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import glsl from "babel-plugin-glsl/macro";

// Define the props for the shader material
type SwarmShaderMaterialProps = {
  uTime: number;
  pointTexture: THREE.Texture | null;
  uTrailLength: number;
  uRainbowIntensity: number;
  uNoiseScale: number;
  uNoiseSpeed: number;
  uSpiralSpeed: number;
  uSpiralTightness: number;
  uChaosAmount: number;
} & JSX.IntrinsicElements['shaderMaterial']; // This includes standard Three.js material properties

const SwarmShaderMaterial = shaderMaterial(
  { 
    uTime: 0, 
    pointTexture: null,
    uTrailLength: 5.0,
    uRainbowIntensity: 0.5,
    uNoiseScale: 0.1,
    uNoiseSpeed: 0.5,
    uSpiralSpeed: 0.5,
    uSpiralTightness: 2.0,
    uChaosAmount: 0.2
  },
  // Vertex Shader
  glsl`
    uniform float uTime;
    uniform float uTrailLength;
    uniform float uNoiseScale;
    uniform float uNoiseSpeed;
    uniform float uSpiralSpeed;
    uniform float uSpiralTightness;
    uniform float uChaosAmount;
    attribute float size;
    varying vec3 vColor;
    varying float vAlpha;

    //
    // Description : Array and textureless GLSL 2D/3D/4D simplex 
    //               noise functions.
    //      Author : Ian McEwan, Ashima Arts.
    //  Maintainer : stegu
    //     Lastmod : 20110822 (ijm)
    //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
    //               Distributed under the MIT License. See LICENSE file.
    //               https://github.com/ashima/webgl-noise
    //               https://github.com/stegu/webgl-noise
    // 

    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x) {
        return mod289(((x*34.0)+1.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r)
    {
      return 1.79284291400159 - 0.85373472095314 * r;
    }

    float snoise(vec3 v)
      { 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

    // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      //   x0 = x0 - 0.0 + 0.0 * C.xxx;
      //   x1 = x0 - i1  + 1.0 * C.xxx;
      //   x2 = x0 - i2  + 2.0 * C.xxx;
      //   x3 = x0 - 1.0 + 3.0 * C.xxx;
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
      vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

    // Permutations
      i = mod289(i); 
      vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
      float n_ = 0.142857142857; // 1.0/7.0
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
      //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

    //Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

    // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vec3 pos = position;
      
      // Calculate base spiral motion
      float angle = length(pos.xz) * uSpiralTightness - uTime * uSpiralSpeed;
      float radius = length(pos.xz);
      float height = pos.y;
      
      // Apply spiral motion
      vec3 spiralPos;
      spiralPos.x = radius * cos(angle);
      spiralPos.z = radius * sin(angle);
      spiralPos.y = height + sin(angle) * 0.5; // Add some vertical movement
      
      // Add noise-based chaos
      float noise = snoise(pos * uNoiseScale + uTime * uNoiseSpeed);
      vec3 chaosOffset = vec3(
        snoise(pos.yzx * uNoiseScale + uTime * uNoiseSpeed),
        snoise(pos.zxy * uNoiseScale + uTime * uNoiseSpeed),
        snoise(pos.xyz * uNoiseScale + uTime * uNoiseSpeed)
      );
      
      // Combine spiral motion with chaos
      pos = mix(spiralPos, pos + chaosOffset * uChaosAmount, uChaosAmount);

      vColor = color;
      vAlpha = 1.0 - length(pos - position) / uTrailLength; // Create trail effect

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (1.0 + noise * 0.5);
    }
  `,
  // Fragment Shader
  glsl`
    uniform sampler2D pointTexture;
    uniform float uTime;
    uniform float uRainbowIntensity;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec4 texColor = texture2D(pointTexture, gl_PointCoord);
      vec3 rainbow = 0.5 + 0.5 * cos(uTime * 0.5 + vColor + vec3(0, 2, 4));
      vec3 color = mix(vColor, rainbow, uRainbowIntensity);
      gl_FragColor = vec4(color, texColor.a * vAlpha);
    }
  `
);

extend({ SwarmShaderMaterial });

// Add this to help TypeScript understand the new JSX element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      swarmShaderMaterial: React.PropsWithChildren<
        Partial<SwarmShaderMaterialProps> & {
          ref?: React.Ref<THREE.ShaderMaterial>;
        }
      >;
    }
  }
}

declare module "@react-three/fiber" {
  interface ThreeElements {
    swarmShaderMaterial: ReactThreeFiber.ShaderMaterialProps & {
      pointTexture: THREE.Texture;
    };
  }
}

// Add this interface for the component props
interface ParticleSwarmProps {
  trailLength: number;
  rainbowIntensity: number;
  noiseScale: number;
  noiseSpeed: number;
  spiralSpeed: number;
  spiralTightness: number;
  chaosAmount: number;
}

export const ParticleSwarm: React.FC<ParticleSwarmProps> = ({   trailLength,
  rainbowIntensity,
  noiseScale,
  noiseSpeed,
  spiralSpeed,
  spiralTightness,
  chaosAmount }) => {
  const { scene } = useThree();
  const swarmRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  

  const particleCount = 10000;

  // Generate the particle texture
  const particleTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");

    if (context) {
      const gradient = context.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      gradient.addColorStop(0, "white");
      gradient.addColorStop(1, "transparent");

      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Generate initial positions and attributes
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random position in a sphere
      const radius = Math.random() * 50 + 25;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Rainbow colors
      color.setHSL(Math.random(), 0.7, 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 2 + Math.random() * 2;
    }

    return { positions, colors, sizes };
  }, []);

  useEffect(() => {
    // Assign ParticleSwarm to layer 1
    swarmRef.current.layers.set(1);

    // Add to scene
    scene.add(swarmRef.current);

    return () => {
      scene.remove(swarmRef.current);
      swarmRef.current.geometry.dispose();
    };
  }, [scene]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points ref={swarmRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={particles.positions}
          count={particleCount}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={particles.colors}
          count={particleCount}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={particles.sizes}
          count={particleCount}
          itemSize={1}
        />
      </bufferGeometry>
      <swarmShaderMaterial
        ref={materialRef}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        pointTexture={particleTexture}
        uTrailLength={trailLength}
        uRainbowIntensity={rainbowIntensity}
        uNoiseScale={noiseScale}
        uNoiseSpeed={noiseSpeed}
        uSpiralSpeed={spiralSpeed}
        uSpiralTightness={spiralTightness}
        uChaosAmount={chaosAmount}
      />
    </points>
  );
};
