// src/components/ParticleSwarm.tsx

import React, { useRef, useMemo } from "react";
import { useFrame, extend, ReactThreeFiber } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import glsl from "babel-plugin-glsl/macro";

const SwarmShaderMaterial = shaderMaterial(
  { uTime: 0, pointTexture: null },
  // Vertex Shader
  glsl`
      uniform float uTime;
      attribute float size;
      varying vec3 vColor;
  
      #pragma glslify: noise = require('glsl-noise/simplex/3d');
  
      void main() {
        vec3 pos = position;
  
        float n = noise(vec3(pos * 0.02 + uTime * 0.1));
        pos += normalize(pos) * n * 2.0;
  
        vColor = color;
  
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (0.8 + 0.2 * sin(uTime + position.x * 0.1));
      }
    `,
  // Fragment Shader
  glsl`
      uniform sampler2D pointTexture;
      varying vec3 vColor;
      uniform float uTime;
  
      void main() {
        // Create an organic flicker effect
        float flicker = 0.5 + 0.5 * sin(uTime * 5.0);
        vec4 textureColor = texture2D(pointTexture, gl_PointCoord);
        if (textureColor.a < 0.1) discard;
        gl_FragColor = vec4(vColor * flicker, textureColor.a) * textureColor;
      }
    `
);

extend({ SwarmShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    swarmShaderMaterial: ReactThreeFiber.ShaderMaterialProps & {
      pointTexture: THREE.Texture;
    };
  }
}

export const ParticleSwarm: React.FC = () => {
  const swarmRef = useRef<THREE.Points>(null);
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
      const radius = Math.random() * 100 + 50;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Dark, desaturated colors with subtle variations
      color.setHSL(0.6 + 0.1 * Math.random(), 0.2, 0.1 + 0.1 * Math.random());
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 2 + Math.random() * 2;
    }

    return { positions, colors, sizes };
  }, []);

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
      />
    </points>
  );
};
