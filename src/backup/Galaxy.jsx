import * as React from "react";
import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import * as TWEEN from '@tweenjs/tween.js';
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  BufferGeometry,
  BufferAttribute,
  Color,
  Points,
  RawShaderMaterial,
  AdditiveBlending,
  CanvasTexture,
} from "three";



const shaderUtils =
  `
float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 scatter (vec3 seed) {
  float u = random(seed.xy);
  float v = random(seed.yz);
  float theta = u * 6.28318530718;
  float phi = acos(2.0 * v - 1.0);

  float sinTheta = sin(theta);
  float cosTheta = cos(theta);
  float sinPhi = sin(phi);
  float cosPhi = cos(phi);

  float x = sinPhi * cosTheta;
  float y = sinPhi * sinTheta;
  float z = cosPhi;

  return vec3(x, y, z);
}
`

function useAlphaTexture() {
  const [alphaMap, setAlphaMap] = React.useState(null);

  React.useEffect(() => {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = ctx.canvas.height = 32;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 32, 32);

    let grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0.0, "#fff");
    grd.addColorStop(1.0, "#000");
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.rect(15, 0, 2, 32); ctx.fill();
    ctx.beginPath(); ctx.rect(0, 15, 32, 2); ctx.fill();

    grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0.1, "#ffff");
    grd.addColorStop(0.6, "#0000");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new CanvasTexture(ctx.canvas);
    setAlphaMap(texture);
  });

  return alphaMap;
}

// ------------------------ //
// GALAXY

function Galaxy({ galaxyRef, guiRef, cRadiusRef, cSpinRef, cRandomnessRef }) {
  const count = 128 ** 2
  const { scene, gl } = useThree();
  const galaxy = useRef(null);

  const alphaMap = useAlphaTexture();

  const innColor = new THREE.Color("#f40");
  const outColor = new THREE.Color("#a7f");

  const galaxyMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: gl.getPixelRatio() },
      uBranches: { value: 2 },
      uRadius: { value: 0 },
      uSpin: { value: Math.PI * 0.25 },
      uRandomness: { value: 0 },
      uAlphaMap: { value: alphaMap },
      uColorInn: { value: innColor },
      uColorOut: { value: outColor },
    },

    vertexShader:
      `
  precision highp float;
  
  attribute vec3 position;
  attribute float size;
  attribute vec3 seed;
  uniform mat4 projectionMatrix;
  uniform mat4 modelViewMatrix;
  
  uniform float uTime;
  uniform float uSize;
  uniform float uBranches;
  uniform float uRadius;
  uniform float uSpin;
  uniform float uRandomness;
  
  varying float vDistance;
  
  #define PI  3.14159265359
  #define PI2 6.28318530718
  
  ${shaderUtils}
  
  void main() {
  
    vec3 p = position;
    float st = sqrt(p.x);
    float qt = p.x * p.x;
    float mt = mix(st, qt, p.x);
  
    // Offset positions by spin (farther wider) and branch num
    float angle = qt * uSpin * (2.0 - sqrt(1.0 - qt));
    float branchOffset = (PI2 / uBranches) * floor(seed.x * uBranches);
    p.x = position.x * cos(angle + branchOffset) * uRadius;
    p.z = position.x * sin(angle + branchOffset) * uRadius;
  
    // Scatter positions & scale down by Y-axis
    p += scatter(seed) * random(seed.zx) * uRandomness * mt;
    p.y *= 0.5 + qt * 0.5;
  
    // Rotate (center faster)
    vec3 temp = p;
    float ac = cos(-uTime * (2.0 - st) * 0.5);
    float as = sin(-uTime * (2.0 - st) * 0.5);
    p.x = temp.x * ac - temp.z * as;
    p.z = temp.x * as + temp.z * ac;
  
  
  
    vDistance = mt;
  
    vec4 mvp = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvp;
    gl_PointSize = (10.0 * size * uSize) / -mvp.z;
  }
  `,

    fragmentShader:
      `
  precision highp float;
  
  uniform vec3 uColorInn;
  uniform vec3 uColorOut;
  uniform sampler2D uAlphaMap;
  
  varying float vDistance;
  
  #define PI  3.14159265359
  
  
  
  void main() {
    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
    float a = texture2D(uAlphaMap, uv).g;
    if (a < 0.1) discard;
  
    vec3 color = mix(uColorInn, uColorOut, vDistance);
    float c = step(0.99, (sin(gl_PointCoord.x * PI) + sin(gl_PointCoord.y * PI)) * 0.5);
    color = max(color, vec3(c));
  
    gl_FragColor = vec4(color, a);
  }
  `,

    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  React.useEffect(() => {
    if (!alphaMap) return;

    const galaxyGeometry = new THREE.BufferGeometry();

    const galaxyPosition = new Float32Array(count * 3);
    const galaxySeed = new Float32Array(count * 3);
    const galaxySize = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      galaxyPosition[i * 3] = i / count;
      galaxySeed[i * 3 + 0] = Math.random();
      galaxySeed[i * 3 + 1] = Math.random();
      galaxySeed[i * 3 + 2] = Math.random();
      galaxySize[i] = Math.random() * 2 + 0.5;
    }

    galaxyGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(galaxyPosition, 3)
    );
    galaxyGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(galaxySize, 1)
    );
    galaxyGeometry.setAttribute(
      "seed",
      new THREE.BufferAttribute(galaxySeed, 3)
    );



    galaxyRef.current = new THREE.Points(galaxyGeometry, galaxyMaterial);
    galaxyRef.current.material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <random, scatter>",
        shaderUtils
      );
    };
    scene.add(galaxyRef.current);

    return () => {
      scene.remove(galaxyRef.current);
      galaxyGeometry.dispose();
      galaxyMaterial.dispose();
    };
  }, [alphaMap, scene, gl]);

  useFrame(({ clock }) => {
    if (galaxyRef.current) {
      galaxyRef.current.material.uniforms.uTime.value += clock.getDelta() / 2;
    }
  });

  // Add GUI

  // Create the GUI instance
  const gui = new GUI().close();

  React.useEffect(() => {
    if (!galaxyRef.current) return;



    // Assign the GUI instance to the ref
    guiRef.current = gui;

    const u = galaxyMaterial.uniforms;

    gui.add(u.uSize, "value", 0, 4, 0.01).name("star size");
    gui.add(u.uBranches, "value", 1, 5, 1).name("branch num");

    cRadiusRef.current = gui.add(u.uRadius, "value", 0, 5, 0.01).name("scale");
    cSpinRef.current = gui.add(u.uSpin, "value", -12.57, 12.57, 0.01).name("spin");
    cRandomnessRef.current = gui
      .add(u.uRandomness, "value", 0, 1, 0.01)
      .name("scatter");

    gui
      .addColor({ color: innColor.getHexString() }, "color")
      .name("inn color")
      .onChange((hex) => {
        const { r, g, b } = new Color(hex);
        u.uColorInn.value = [r, g, b];
      });

    gui
      .addColor({ color: outColor.getHexString() }, "color")
      .name("out color")
      .onChange((hex) => {
        const { r, g, b } = new Color(hex);
        u.uColorOut.value = [r, g, b];
      });
  });

  return null;
}

// ------------------------ //
// UNIVERSE

function Universe({ universeRef, guiRef, cRadiusRef, cSpinRef, cRandomnessRef }) {
  const count = 128 ** 2;
  const { scene, gl } = useThree();
  const universe = useRef(null);

  const alphaMap = useAlphaTexture();

  const innColor = new THREE.Color("#f40");
  const outColor = new THREE.Color("#a7f");

  const galaxyMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: gl.getPixelRatio() },
      uBranches: { value: 2 },
      uRadius: { value: 0 },
      uSpin: { value: Math.PI * 0.25 },
      uRandomness: { value: 0 },
      uAlphaMap: { value: alphaMap },
      uColorInn: { value: innColor },
      uColorOut: { value: outColor },
    },

    vertexShader:
      `
  precision highp float;
  
  attribute vec3 position;
  attribute float size;
  attribute vec3 seed;
  uniform mat4 projectionMatrix;
  uniform mat4 modelViewMatrix;
  
  uniform float uTime;
  uniform float uSize;
  uniform float uBranches;
  uniform float uRadius;
  uniform float uSpin;
  uniform float uRandomness;
  
  varying float vDistance;
  
  #define PI  3.14159265359
  #define PI2 6.28318530718
  
  ${shaderUtils}
  
  void main() {
  
    vec3 p = position;
    float st = sqrt(p.x);
    float qt = p.x * p.x;
    float mt = mix(st, qt, p.x);
  
    // Offset positions by spin (farther wider) and branch num
    float angle = qt * uSpin * (2.0 - sqrt(1.0 - qt));
    float branchOffset = (PI2 / uBranches) * floor(seed.x * uBranches);
    p.x = position.x * cos(angle + branchOffset) * uRadius;
    p.z = position.x * sin(angle + branchOffset) * uRadius;
  
    // Scatter positions & scale down by Y-axis
    p += scatter(seed) * random(seed.zx) * uRandomness * mt;
    p.y *= 0.5 + qt * 0.5;
  
    // Rotate (center faster)
    vec3 temp = p;
    float ac = cos(-uTime * (2.0 - st) * 0.5);
    float as = sin(-uTime * (2.0 - st) * 0.5);
    p.x = temp.x * ac - temp.z * as;
    p.z = temp.x * as + temp.z * ac;
  
  
  
    vDistance = mt;
  
    vec4 mvp = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvp;
    gl_PointSize = (10.0 * size * uSize) / -mvp.z;
  }
  `,

    fragmentShader:
      `
  precision highp float;
  
  uniform vec3 uColorInn;
  uniform vec3 uColorOut;
  uniform sampler2D uAlphaMap;
  
  varying float vDistance;
  
  #define PI  3.14159265359
  
  
  
  void main() {
    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
    float a = texture2D(uAlphaMap, uv).g;
    if (a < 0.1) discard;
  
    vec3 color = mix(uColorInn, uColorOut, vDistance);
    float c = step(0.99, (sin(gl_PointCoord.x * PI) + sin(gl_PointCoord.y * PI)) * 0.5);
    color = max(color, vec3(c));
  
    gl_FragColor = vec4(color, a);
  }
  `,

    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  React.useEffect(() => {
    const universeGeometry = new BufferGeometry();

    const universePosition = new Float32Array(count * 3 / 2);
    const universeSeed = new Float32Array(count * 3 / 2);
    const universeSize = new Float32Array(count / 2);

    for (let i = 0; i < count / 2; i++) {
      universeSeed[i * 3 + 0] = Math.random();
      universeSeed[i * 3 + 1] = Math.random();
      universeSeed[i * 3 + 2] = Math.random();
      universeSize[i] = Math.random() * 2 + 0.5;
    }

    universeGeometry.setAttribute(
      "position",
      new BufferAttribute(universePosition, 3)
    );
    universeGeometry.setAttribute(
      "seed",
      new BufferAttribute(universeSeed, 3)
    );
    universeGeometry.setAttribute(
      "size",
      new BufferAttribute(universeSize, 1)
    );

    const universeMaterial = new RawShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: galaxyMaterial.uniforms.uSize,
        uRadius: galaxyMaterial.uniforms.uRadius,
        uAlphaMap: galaxyMaterial.uniforms.uAlphaMap,
      },

      vertexShader:
        `
precision highp float;

attribute vec3 seed;
attribute float size;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

uniform float uTime;
uniform float uSize;
uniform float uRadius;

#define PI  3.14159265359
#define PI2 6.28318530718

#include <random, scatter>

// Universe size factor
const float r = 3.0;
// Scale universe sphere 
const vec3 s = vec3(2.1, 1.3, 2.1);



void main() {

  vec3 p = scatter(seed) * r * s;

  // Sweep to center
  float q = random(seed.zx);
  for (int i = 0; i < 3; i++) q *= q;
  p *= q;

  // Sweep to surface
  float l = length(p) / (s.x * r);
  p = l < 0.001 ? (p / l) : p;

  // Rotate (center faster)
  vec3 temp = p;
  float ql = 1.0 - l;
  for (int i = 0; i < 3; i++) ql *= ql;
  float ac = cos(-uTime * ql);
  float as = sin(-uTime * ql);
  p.x = temp.x * ac - temp.z * as;
  p.z = temp.x * as + temp.z * ac;



  vec4 mvp = modelViewMatrix * vec4(p * uRadius, 1.0);
  gl_Position = projectionMatrix * mvp;

  // Scale up core stars
  l = (2.0 - l) * (2.0 - l);

  gl_PointSize = (r * size * uSize * l) / -mvp.z;
}
`,

      fragmentShader:
        `
precision highp float;

uniform sampler2D uAlphaMap;

#define PI 3.14159265359

void main() {
  vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
  float a = texture2D(uAlphaMap, uv).g;
  if (a < 0.1) discard;

  gl_FragColor = vec4(vec3(1.0), a);
}
`,

      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    universeRef.current = new Points(universeGeometry, universeMaterial);
    universeRef.current.material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <random, scatter>",
        shaderUtils
      );
    };
    scene.add(universeRef.current);

    return () => {
      scene.remove(universeRef.current);
      universeGeometry.dispose();
      universeMaterial.dispose();
    };
  });

  useFrame(({ clock }) => {
    if (universeRef.current) {
      universeRef.current.material.uniforms.uTime.value += clock.getDelta() / 2;
    }
  });

  return null;
}

/// Controls 

const OrbitControlsWrapper = React.forwardRef((props, ref) => {
  const controls = new OrbitControls(...props.args);
  React.useImperativeHandle(ref, () => controls);
  useFrame(() => controls.update());
  return null;
});

function Controls() {
  const { camera, gl } = useThree();
  const controls = useRef();

  return (
    <OrbitControlsWrapper
      ref={controls}
      args={[camera, gl.domElement]}
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.5}
      maxPolarAngle={Math.PI / 2}
      minPolarAngle={Math.PI / 2}
    />
  );
}

function SceneWrapper(props) {
  useFrame(() => {
    // Update TWEEN animations on each frame
    TWEEN.update();
  });

  return (
    <mesh >{props.children} </mesh>
  );
}

export default function GalaxyComponent() {



  // Create references for GUI controls
  const cRadius = useRef();
  const cSpin = useRef();
  const cRandomness = useRef();

  // Create a ref for the GUI instance
  const guiRef = useRef();

  // Create references for galaxy and universe objects
  const galaxy = useRef();
  const universe = useRef();



  React.useEffect(() => {
    // Define the TWEEN animation

    new TWEEN.Tween({
      radius: 0,
      spin: 0,
      randomness: 0,
      rotate: 0,
    })
      .to({
        radius: 1.618,
        spin: Math.PI * 2,
        randomness: 0.5,
        rotate: Math.PI * 4,
      })
      .duration(5000)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(({ radius, spin, randomness, rotate }) => {

        console.log(radius, spin, randomness, rotate)

        cRadius.current.setValue(radius);
        cRadius.current.updateDisplay();

        cSpin.current.setValue(spin);
        cSpin.current.updateDisplay();

        cRandomness.current.setValue(randomness);
        cRandomness.current.updateDisplay();

        galaxy.current.rotation.y = rotate;
        universe.current.rotation.y = rotate / 3;
      })
      .onComplete(() => {
        // Open the GUI using the ref when the animation completes
        if (guiRef.current) {
          guiRef.current.open();
        }
      })
      .start();
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 2, 3], fov: 60, near: 0.1, far: 100 }}
      style={{ background: "#000", height: "100vh" }}
      className="galaxyCanvas"
    ><SceneWrapper>
        <Controls />
        <Galaxy galaxyRef={galaxy} guiRef={guiRef} cRadiusRef={cRadius} cSpinRef={cSpin} cRandomnessRef={cRandomness} />
        <Universe universeRef={universe} guiRef={guiRef} />
      </SceneWrapper>
    </Canvas>
  );
}