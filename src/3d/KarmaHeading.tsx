// KarmaHeading.tsx
import { useEffect, useRef } from 'react';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import technoFont from '../assets/fonts/techno_regular_font.json';

const KarmaHeading: React.FC = () => {
  const { scene, gl, size, camera } = useThree();
  const textMeshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const cubeCameraRef = useRef<THREE.CubeCamera | null>(null);

  // Refs for light helpers
  const lightHelper1 = useRef<THREE.PointLightHelper | null>(null);
  const lightHelper2 = useRef<THREE.PointLightHelper | null>(null);
  const lightHelper3 = useRef<THREE.PointLightHelper | null>(null);

  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.5;

    const loader = new FontLoader();
    const font = loader.parse(technoFont);

    const textGeometry = new TextGeometry('KARMAKAIO', {
      font: font,
      size: 3,
      height: 0.5,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelOffset: 0,
      bevelSegments: 5
    });

    textGeometry.computeBoundingBox();
    const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
    const textHeight = textGeometry.boundingBox!.max.y - textGeometry.boundingBox!.min.y;
    const textDepth = textGeometry.boundingBox!.max.z - textGeometry.boundingBox!.min.z;

    textGeometry.translate(
      -textWidth / 2,
      -textHeight / 2,
      -textDepth / 2
    );

    const renderTarget = new THREE.WebGLCubeRenderTarget(1024, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter
    });

    const cubeCamera = new THREE.CubeCamera(0.1, 1000, renderTarget);
    cubeCamera.position.set(0, 0, 5); // Match the textMesh position
    scene.add(cubeCamera);
    cubeCameraRef.current = cubeCamera;

    const textMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      metalness: 1,
      roughness: 0.1,
      envMap: renderTarget.texture,
      envMapIntensity: 1,
      emissive: new THREE.Color(0x5435ac),
      // emissive: new THREE.Color(0xFFFFFF),
      emissiveIntensity: 10,
    });

    materialRef.current = textMaterial;
    
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 0, 5);
    textMeshRef.current = textMesh;
    scene.add(textMesh);

    const pointLight1 = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);

    pointLight1.position.set(10, 5, 10);
    scene.add(pointLight1);
    // lightHelper1.current = new THREE.PointLightHelper(pointLight1, 0.5);
    // scene.add(lightHelper1.current);

    const pointLight2 = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);

    pointLight2.position.set(2, 2, 5);
    scene.add(pointLight2);
    // lightHelper2.current = new THREE.PointLightHelper(pointLight2, 0.5);
    // scene.add(lightHelper2.current);

    const pointLight3 = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);

    pointLight3.position.set(-10, 0, 10);
    scene.add(pointLight3);
    // lightHelper3.current = new THREE.PointLightHelper(pointLight3, 0.5);
    // scene.add(lightHelper3.current);



    if (textMeshRef.current) {
      textMeshRef.current.castShadow = true;
      textMeshRef.current.receiveShadow = true;
    }

    return () => {
      if (textMeshRef.current) {
        scene.remove(textMeshRef.current);
        textMeshRef.current.geometry.dispose();
        if (Array.isArray(textMeshRef.current.material)) {
          textMeshRef.current.material.forEach(material => material.dispose());
        } else {
          textMeshRef.current.material.dispose();
        }
      }
      if (cubeCameraRef.current) {
        scene.remove(cubeCameraRef.current);
        cubeCameraRef.current.renderTarget.dispose();
      }

      // Remove light helpers
      if (lightHelper1.current) {
        scene.remove(lightHelper1.current);
        lightHelper1.current.dispose();
      }
      if (lightHelper2.current) {
        scene.remove(lightHelper2.current);
        lightHelper2.current.dispose();
      }
      if (lightHelper3.current) {
        scene.remove(lightHelper3.current);
        lightHelper3.current.dispose();
      }
    };
  }, [scene, gl]);

  useFrame(() => {
    if (textMeshRef.current && materialRef.current && cubeCameraRef.current) {
      // Update CubeCamera position to match the text mesh
      cubeCameraRef.current.position.copy(textMeshRef.current.position);

      // Hide the text mesh and remove cube camera from the scene
      textMeshRef.current.visible = false;

      // Exclude Layer 1 (ParticleSwarm) from CubeCamera's capture
      camera.layers.enable(0); // Ensure CubeCamera captures layer 0
      camera.layers.disable(1); // Disable layer 1

      // Update the environment map
      cubeCameraRef.current.update(gl, scene);

      // Re-enable Layer 1 on the main camera to render ParticleSwarm
      camera.layers.enable(1); // **Added this line**

      // Re-enable visibility
      textMeshRef.current.visible = true;

      // Update rotation and envMapIntensity
      textMeshRef.current.rotation.y = Math.sin(Date.now() * 0.0002) * 0.1;
      materialRef.current.envMapIntensity = 0.8 + Math.sin(Date.now() * 0.001) * 0.2;
    }
  });

  useEffect(() => {
    if (textMeshRef.current) {
      // Adjust the scale based on the viewport size
      const { width, height } = size;
      const minDimension = Math.min(width, height);

      // Example scaling logic (adjust the multiplier as needed)
      const scaleFactor = minDimension / 800; // 800 is an arbitrary base size

      textMeshRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  }, [size]);

  return null;
}

export default KarmaHeading;