// KarmaHeading.tsx
import { useEffect, useRef } from 'react';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { useThree, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { CubeCamera, PMREMGenerator } from 'three';
import technoFont from '../assets/fonts/techno_regular_font.json';


const KarmaHeading: React.FC = () => {
  const { scene, gl } = useThree();
  const textMeshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const cubeCameraRef = useRef<THREE.CubeCamera>();

  useEffect(() => {
    const loader = new FontLoader();
    const font = loader.parse(technoFont);

      const textGeometry = new TextGeometry('KARMAKAIO', {
        font: font,
        size: 4.5,
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

      const renderTarget = new THREE.WebGLCubeRenderTarget(256);
      const cubeCamera = new CubeCamera(0.1, 1000, renderTarget);
      scene.add(cubeCamera);
      cubeCameraRef.current = cubeCamera;

      const textMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        metalness: 1,
        roughness: 0.1,
        envMap: renderTarget.texture,
        envMapIntensity: 1,
      });

      materialRef.current = textMaterial;
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, 0, 5);
      textMeshRef.current = textMesh;
      scene.add(textMesh);

    return () => {
      if (textMeshRef.current) {
        scene.remove(textMeshRef.current);
      }
      if (cubeCameraRef.current) {
        scene.remove(cubeCameraRef.current);
      }
    };
  }, [scene, gl]);

  useFrame(() => {
    if (textMeshRef.current && materialRef.current && cubeCameraRef.current) {
      textMeshRef.current.visible = false;
      cubeCameraRef.current.update(gl, scene);
      textMeshRef.current.visible = true;

      textMeshRef.current.rotation.y = Math.sin(Date.now() * 0.0002) * 0.1;
      
      materialRef.current.envMapIntensity = 0.8 + Math.sin(Date.now() * 0.001) * 0.2;
    }
  });

  return null;
}

export default KarmaHeading;