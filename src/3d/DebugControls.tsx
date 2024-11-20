import { useControls } from 'leva'; // You'll need to install leva

export const useShaderDebugControls = () => {
  return useControls({
    showDebug: false,
    freqMultiplier: {
      value: 1,
      min: 0,
      max: 10,
      step: 0.1
    },
    colorThresholds: {
      value: [0.33, 0.66],
      min: 0,
      max: 1,
      step: 0.01
    }
  });
};