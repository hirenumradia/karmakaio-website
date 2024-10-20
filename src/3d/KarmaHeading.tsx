import { useEffect, useRef } from 'react';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const KarmaHeading: React.FC = () => {
  const { scene } = useThree();
  const textMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const loader = new FontLoader();
    loader.load('/fonts/techno_regular_font.json', (font) => {
      const textGeometry = new TextGeometry('KARMAKAIO', {
        font: font,
        size: 5,
        height: 0.5, // Increased height for 3D effect
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.05,
        bevelOffset: 0,
        bevelSegments: 5
      });

      // Center the geometry
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
      const textHeight = textGeometry.boundingBox!.max.y - textGeometry.boundingBox!.min.y;
      const textDepth = textGeometry.boundingBox!.max.z - textGeometry.boundingBox!.min.z;

      textGeometry.translate(
        -textWidth / 2,
        -textHeight / 2,
        -textDepth / 2
      );

      // Create a material with metallic and roughness properties
      const textMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.8,
        roughness: 0.2,
      });

      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      
      // Position the mesh at the center of the scene
      textMesh.position.set(0, 0, 0);
      
      textMeshRef.current = textMesh;
      scene.add(textMesh);
    });

    return () => {
      if (textMeshRef.current) {
        scene.remove(textMeshRef.current);
      }
    };
  }, [scene]);

  return null;
};

export default KarmaHeading;
