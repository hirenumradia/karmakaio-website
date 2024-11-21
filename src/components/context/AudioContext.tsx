import React, { createContext, useState, useContext } from 'react';

interface AudioContextType {
  amplitude: number;
  frequencies: Float32Array;
  setAmplitude: (value: number) => void;
  setFrequencies: (values: Float32Array) => void;
  handlePlayPause: (playing: boolean) => void;
  setIsPlayingTransitionedTo: (value: {from: boolean, to: boolean}) => void;
  isPlaying: boolean;
  isPlayingTransitionedTo: {
    'from': boolean,
    'to': boolean
  }

}

const AudioContext = createContext<AudioContextType>({
  amplitude: 0,
  frequencies: new Float32Array(),
  setAmplitude: () => {},
  setFrequencies: () => {},
  handlePlayPause: () => {},
  setIsPlayingTransitionedTo: () => {},
  isPlaying: false,
  isPlayingTransitionedTo: {
    'from': false,
    'to': false
  }
});

export const useAudioContext = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [amplitude, setAmplitude] = useState(0);
  const [frequencies, setFrequencies] = useState<Float32Array>(new Float32Array());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingTransitionedTo, setIsPlayingTransitionedTo] = useState({
    'from': false,
    'to': false
  });

  const handlePlayPause = (playing: boolean) => {
    setIsPlayingTransitionedTo({
      'from': isPlaying,
      'to': playing
    })
    setIsPlaying(playing);
    setAmplitude(playing ? amplitude : 0);
    setFrequencies(playing ? frequencies : new Float32Array());
  };

  return (
    <AudioContext.Provider value={{ amplitude, frequencies, setAmplitude, setFrequencies, handlePlayPause, isPlaying, isPlayingTransitionedTo, setIsPlayingTransitionedTo }}>
      {children}
    </AudioContext.Provider>
  );
};