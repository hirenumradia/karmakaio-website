import { useEffect, useRef } from 'react';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const KarmaHeading: React.FC = () => {
  const { scene, gl } = useThree();
  const textMeshRef = useRef<THREE.Mesh | null>(null);
  const cubeCameraRef = useRef<THREE.CubeCamera | null>(null);
  const cubeRenderTargetRef = useRef<THREE.WebGLCubeRenderTarget | null>(null);

  useEffect(() => {
    const loader = new FontLoader();
    loader.load('/fonts/techno_regular_font.json', (font) => {
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

      cubeRenderTargetRef.current = new THREE.WebGLCubeRenderTarget(256);
      cubeCameraRef.current = new THREE.CubeCamera(0.1, 1000, cubeRenderTargetRef.current);
      scene.add(cubeCameraRef.current);

      const textMaterial = new THREE.MeshStandardMaterial({
        color: 0x00DD00, // Matrix green
        emissive: 0x003300, // Darker green for the glow effect
        metalness: 0.5,
        roughness: 0.08,
        envMap: cubeRenderTargetRef.current.texture,
      });

      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, 0, 5);
      
      textMeshRef.current = textMesh;
      scene.add(textMesh);
    });

    return () => {
      if (textMeshRef.current) {
        scene.remove(textMeshRef.current);
      }
      if (cubeCameraRef.current) {
        scene.remove(cubeCameraRef.current);
      }
    };
  }, [scene]);

  useFrame(() => {
    if (textMeshRef.current && cubeCameraRef.current && cubeRenderTargetRef.current) {
      textMeshRef.current.visible = false;
      cubeCameraRef.current.position.copy(textMeshRef.current.position);
      cubeCameraRef.current.update(gl, scene);
      textMeshRef.current.visible = true;
    }
  });

  return null;
};

export default KarmaHeading;
