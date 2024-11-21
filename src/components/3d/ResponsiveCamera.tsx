// src/components/3d/ResponsiveCamera.tsx

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const ResponsiveCamera: React.FC = () => {
  const { camera } = useThree();

  useEffect(() => {
    const handleResize = () => {
      const { innerWidth, innerHeight } = window;
      const aspect = innerWidth / innerHeight;

      // Define breakpoints and corresponding camera settings
      if (innerWidth <= 480) { // Mobile Devices
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.fov = 80; // Increase FOV for a wider view
        }
        camera.position.set(0, 1, 40); // Move the camera closer
      } else if (innerWidth <= 768) { // Small Tablets
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.fov = 80;
        }
        camera.position.set(0, 1, 35);
      } else if (innerWidth <= 1024) { // Medium Tablets & Small Desktops
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.fov = 80;
        }
        camera.position.set(0, 1, 35);
      } else { // Large Desktops
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.fov = 80;
        }
        camera.position.set(0, 1, 35);
      }

      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = aspect;
      }
      camera.updateProjectionMatrix();
    };

    // Initialize camera settings on mount
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Clean up the event listener on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, [camera]);

  return null; // This component doesn't render anything
};

export default ResponsiveCamera;