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

  useEffect(() => {
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

    const renderTarget = new THREE.WebGLCubeRenderTarget(256, {
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
      envMapIntensity: 1, // Fixed intensity
    });

    materialRef.current = textMaterial;
    
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 0, 5);
    textMeshRef.current = textMesh;
    scene.add(textMesh);

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

      // Re-enable visibility and layers
      textMeshRef.current.visible = true;
      camera.layers.enable(1); // Re-enable layer 1 for ParticleSwarm

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