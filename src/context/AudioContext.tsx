import React, { createContext, useState, useContext, useEffect } from 'react';

interface AudioContextType {
  amplitude: number;
  setAmplitude: (value: number) => void;
}

const AudioContext = createContext<AudioContextType>({
  amplitude: 0,
  setAmplitude: () => {},
});

export const useAudioContext = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [amplitude, setAmplitude] = useState(0);

  // Debug: Log amplitude changes
  useEffect(() => {
    console.log("Amplitude updated:", amplitude);
  }, [amplitude]);

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, background: 'black', color: 'white', padding: '5px' }}>
        Amplitude: {amplitude.toFixed(4)}
      </div>
      <AudioContext.Provider value={{ amplitude, setAmplitude }}>
        {children}
      </AudioContext.Provider>
    </>
  );
};