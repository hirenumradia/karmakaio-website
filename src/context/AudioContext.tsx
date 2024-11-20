import React, { createContext, useState, useContext, useEffect } from 'react';

interface AudioContextType {
  amplitude: number;
  frequencies: Float32Array;
  setAmplitude: (value: number) => void;
  setFrequencies: (values: Float32Array) => void;
}

const AudioContext = createContext<AudioContextType>({
  amplitude: 0,
  frequencies: new Float32Array(),
  setAmplitude: () => {},
  setFrequencies: () => {},
});

export const useAudioContext = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [amplitude, setAmplitude] = useState(0);
  const [frequencies, setFrequencies] = useState<Float32Array>(new Float32Array());

  return (
    <AudioContext.Provider value={{ amplitude, frequencies, setAmplitude, setFrequencies }}>
      {children}
    </AudioContext.Provider>
  );
};