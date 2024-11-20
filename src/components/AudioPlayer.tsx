import React, { useRef, useState, useEffect, useCallback, ChangeEvent } from "react";
import "./AudioPlayer.css";
import { useAudioContext } from "../context/AudioContext";

interface Song {
  src: string;
  title: string;
}

const AudioPlayer: React.FC = () => {
  const debug = false;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const { setAmplitude, setFrequencies, handlePlayPause, isPlaying: contextIsPlaying } = useAudioContext();
  const animationFrameRef = useRef<number | null>(null);

  // References for AudioContext and related nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Reference to ensure setAmplitude is always current
  const setAmplitudeRef = useRef(setAmplitude);
  const setFrequenciesRef = useRef(setFrequencies);

  useEffect(() => {
    setAmplitudeRef.current = setAmplitude;
    setFrequenciesRef.current = setFrequencies;
  }, [setAmplitude, setFrequencies]);

  // Define the playlist
  const playlist: Song[] = [
    {
      src: "/assets/music/Karmakaio_Sigurd_K_Where_U_Been_Original_Mix.mp3",
      title: "Karmakaio & Sigurd K - Where U Been (Original Mix)",
    },
    {
      src: "/assets/music/Lil_Tecca_500lbs_More_Karmakaio_Remix.mp3",
      title: "Lil Tecca - 500lbs (More & Karmakaio Remix)",
    },
    {
      src: "/assets/music/Ye_Ty_Dolla_Sign_Vultures_feat_Bump_J_Lil_Durk_Vultures_Karmakaio_Remix.mp3",
      title: "¥$, Ye, Ty Dolla $ign - Vultures feat. Bump J & Lil Durk - Vultures (Karmakaio Remix)",
    },
    // Add more songs as needed
  ];

  const currentSong = playlist[currentSongIndex];

  // Utility function to extract filename without extension
  const getFilenameWithoutExtension = (path: string): string => {
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\.[^/.]+$/, ""); // Removes the extension
  };

  const filename = getFilenameWithoutExtension(currentSong.src);

  // Handle volume change
  const [volume, setVolume] = useState(1.0); // Default volume (0.0 to 1.0)
  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Handle detailed audio errors
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleDetailedError = () => {
      if (audio.error) {
        console.error("Audio error code:", audio.error.code);
        switch (audio.error.code) {
          case audio.error.MEDIA_ERR_ABORTED:
            console.error("You aborted the media playback.");
            break;
          case audio.error.MEDIA_ERR_NETWORK:
            console.error("A network error caused the media download to fail.");
            break;
          case audio.error.MEDIA_ERR_DECODE:
            console.error("The media playback was aborted due to a corruption problem or because the media used features your browser did not support.");
            break;
          case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            console.error("The media could not be loaded, either because the server or network failed or because the format is not supported.");
            break;
          default:
            console.error("An unknown media error occurred.");
            break;
        }
      }
    };

    audio.addEventListener('error', handleDetailedError);

    return () => {
      audio.removeEventListener('error', handleDetailedError);
    };
  }, []);

  // Define a ref to track playing state
  const isPlayingRef = useRef(false);

  // Function to update amplitude based on analyser node data
  const updateAmplitude = useCallback(() => {
    if (
      !analyserNodeRef.current ||
      !dataArrayRef.current ||
      !audioContextRef.current ||
      audioContextRef.current.state !== 'running'
    ) {
      console.log("AnalyserNode or AudioContext not ready.");
      animationFrameRef.current = requestAnimationFrame(updateAmplitude);
      return;
    }

    debug && console.log("AnalyserNode and DataArray ready.");
    debug && console.log("AnalyserNode:", analyserNodeRef.current);
    debug && console.log("DataArray:", dataArrayRef.current);
    debug && console.log("AudioContext:", audioContextRef.current);
    debug && console.log("AudioContext state:", audioContextRef.current?.state);
    debug && console.log("AudioContext destination:", audioContextRef.current?.destination);
    debug && console.log("Audio element:", audioRef.current);
    debug && console.log("Audio element volume:", audioRef.current?.volume);
    debug && console.log("Audio element currentTime:", audioRef.current?.currentTime);
    debug && console.log("Audio element paused:", audioRef.current?.paused);

    analyserNodeRef.current.getByteFrequencyData(dataArrayRef.current);

    // Check if dataArrayRef.current has meaningful data
    const isSilent = dataArrayRef.current.every(value => value === 0);

    if (isSilent) {
      console.warn("AnalyserNode is receiving silent data.");
    }

    // Get frequency data
    const frequencyData = new Float32Array(analyserNodeRef.current.frequencyBinCount);
    analyserNodeRef.current.getFloatFrequencyData(frequencyData);

    // Normalize frequency data
    const normalizedFrequencies = new Float32Array(frequencyData.length);
    for (let i = 0; i < frequencyData.length; i++) {
      // Convert from dB to normalized value between 0 and 1
      normalizedFrequencies[i] = Math.max((frequencyData[i] + 140) / 140, 0.0);
    }

    // Log normalized frequencies for debugging
    debug && console.log({
      min: Math.min(...Array.from(normalizedFrequencies)),
      max: Math.max(...Array.from(normalizedFrequencies)),
      avg: Array.from(normalizedFrequencies).reduce((sum, val) => sum + val, 0) / normalizedFrequencies.length,
    });

    setFrequenciesRef.current(normalizedFrequencies);

    const sum = dataArrayRef.current.reduce((acc, value) => acc + value, 0);
    const average = sum / dataArrayRef.current.length;
    const normalizedAmplitude = average / 255;

    // Apply more aggressive scaling
    const scaledAmplitude = Math.pow(normalizedAmplitude, 1.5) * 2;

    const finalAmplitude = Math.min(scaledAmplitude, 1);

    debug && console.log("Raw Average:", average);
    debug && console.log("Normalized Amplitude:", normalizedAmplitude);
    debug && console.log("Scaled Amplitude:", scaledAmplitude);
    debug && console.log("Final Amplitude:", finalAmplitude);

    setAmplitudeRef.current(finalAmplitude);

    debug && console.log("Is it playing:", isPlayingRef.current);

    if (isPlayingRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateAmplitude);
    }
  }, []);

  // Function to toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      isPlayingRef.current = false;
      setAmplitudeRef.current(0); // Reset amplitude when pausing
      handlePlayPause(false); // Update context state

      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend().then(() => {
          debug && console.log("AudioContext suspended.");
        }).catch(error => {
          debug && console.error("Error suspending AudioContext:", error);
        });
      }
      if (animationFrameRef.current) {
        debug && console.log("Cancelling animation frame.");
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsPlaying(false);
    } else {
      debug && console.log("Playing audio.");
      // Initialize AudioContext if not already
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        debug && console.log("Initializing AudioContext.");
        audioContextRef.current = new window.AudioContext();
       
        try {
          if (audioContextRef.current && audioRef.current) {
            debug && console.log("AudioContext and audioRef.current initialized.");
            // Ensure MediaElementSourceNode is only created once
            if (!sourceNodeRef.current) {
              debug && console.log("Initializing MediaElementSourceNode.");
              sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
            }

            // Initialize AnalyserNode if not already
            if (!analyserNodeRef.current) {
              debug && console.log("Initializing AnalyserNode.");
              analyserNodeRef.current = audioContextRef.current.createAnalyser();
              analyserNodeRef.current.fftSize = 512;
              analyserNodeRef.current.smoothingTimeConstant = 0.6;
              analyserNodeRef.current.minDecibels = -90;
              analyserNodeRef.current.maxDecibels = -10;

              debug && console.log("AnalyserNode initialized.");
              const bufferLength = analyserNodeRef.current.frequencyBinCount;
              debug && console.log("BufferLength:", bufferLength);
              dataArrayRef.current = new Uint8Array(bufferLength);
              debug && console.log("DataArray initialized.", dataArrayRef.current);
            }

            // Connect nodes
            if (sourceNodeRef.current && analyserNodeRef.current && audioContextRef.current) {
              sourceNodeRef.current.connect(analyserNodeRef.current);
              debug && console.log("SourceNode connected to AnalyserNode.");
              analyserNodeRef.current.connect(audioContextRef.current.destination);
              debug && console.log("AnalyserNode connected to AudioContext destination.");
              debug && console.log("AudioContext and nodes initialized.");
            }
          }
        } catch (error) {
          console.error("Error initializing AudioContext and nodes:", error);
        }
      }

      // Resume AudioContext if suspended
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          debug && console.log("AudioContext resumed:", audioContextRef.current?.state);
        }).catch(error => {
          console.error("Error resuming AudioContext:", error);
        });
      }

      // Play the audio
      audioRef.current.play()
        .then(() => {
          isPlayingRef.current = true;
          setIsPlaying(true);
          handlePlayPause(true); // Update context state
          animationFrameRef.current = requestAnimationFrame(updateAmplitude);
        })
        .catch(error => {
          console.error("Error during audio playback:", error);
        });
    }
  }, [isPlaying, handlePlayPause, updateAmplitude, debug]);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().then(() => {
          debug && console.log("AudioContext closed.");
        }).catch(error => {
          console.error("Error closing AudioContext:", error);
        });
      }
    };
  }, [debug]);

  // Function to play the previous song
  const playPrevious = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex === 0 ? playlist.length - 1 : prevIndex - 1));
    if (audioRef.current) {
      audioRef.current.pause(); // Pause current audio
      audioRef.current.load(); // Load the new audio
      audioRef.current.play(); // Play the new audio
    }
  };

  // Function to play the next song
  const playNext = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex === playlist.length - 1 ? 0 : prevIndex + 1));
    if (audioRef.current) {
      audioRef.current.pause(); // Pause current audio
      audioRef.current.load(); // Load the new audio
      audioRef.current.play(); // Play the new audio
    }
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={currentSong.src} preload="auto" />
      <div className="button-group">
        <button
          className="prev-button"
          onClick={playPrevious}
          aria-label="Previous Song"
        >
          &#9664;&#9664; {/* Unicode for double left arrow */}
        </button>

        <button
          className="play-pause-button"
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? "❚❚" : "►"}
        </button>

        <button
          className="next-button"
          onClick={playNext}
          aria-label="Next Song"
        >
          &#9654;&#9654; {/* Unicode for double right arrow */}
        </button>
      </div>

      {/* <div className="volume-control">
        <label htmlFor="volume">Volume:</label>
        <input
          id="volume"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolumeChange}
        />
      </div> */}

      <div className="song-info marquee-container">
        <p className="audio-filename marquee-text">{currentSong.title}</p>
      </div>
    </div>
  );
};

export default AudioPlayer;