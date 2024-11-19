import React, { useRef, useState, useEffect, useCallback, ChangeEvent } from "react";
import "./AudioPlayer.css";
import { useAudioContext } from "../context/AudioContext";

interface Song {
  src: string;
  title: string;
}

const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const { setAmplitude } = useAudioContext();
  const animationFrameRef = useRef<number | null>(null);

  // References for AudioContext and related nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Reference to ensure setAmplitude is always current
  const setAmplitudeRef = useRef(setAmplitude);

  useEffect(() => {
    setAmplitudeRef.current = setAmplitude;
  }, [setAmplitude]);

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

  // Handle audio ended
  useEffect(() => {
    if (!audioRef.current) return;

    const handleEnded = () => {
      console.log("Audio ended.");
      setIsPlaying(false);
      // Optionally implement song auto-advance
      // setCurrentSongIndex((prev) => (prev + 1) % playlist.length);
    };

    audioRef.current.addEventListener('ended', handleEnded);
    return () => {
      audioRef.current?.removeEventListener('ended', handleEnded);
    };
  }, [playlist.length]);

  // Handlers for next and previous songs
  const playNext = useCallback(() => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  }, [playlist.length]);

  const playPrevious = useCallback(() => {
    setCurrentSongIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  // Add event listeners for audio element state
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleCanPlay = () => console.log("Audio can play.");
    const handlePlaying = () => console.log("Audio is playing.");
    const handleWaiting = () => console.log("Audio is waiting.");
    const handleError = (e: Event) => console.error("Audio error:", e);

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
    };
  }, []);

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

  // Add isPlayingRef to track the playing state consistently
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

    console.log("AnalyserNode and DataArray ready.");
    console.log("AnalyserNode:", analyserNodeRef.current);
    console.log("DataArray:", dataArrayRef.current);
    console.log("AudioContext:", audioContextRef.current);
    console.log("AudioContext state:", audioContextRef.current?.state);
    console.log("AudioContext destination:", audioContextRef.current?.destination);
    console.log("Audio element:", audioRef.current);
    console.log("Audio element volume:", audioRef.current?.volume);
    console.log("Audio element currentTime:", audioRef.current?.currentTime);
    console.log("Audio element paused:", audioRef.current?.paused);

    analyserNodeRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Check if dataArrayRef.current has meaningful data
    const isSilent = dataArrayRef.current.every(value => value === 0);

    if (isSilent) {
      console.warn("AnalyserNode is receiving silent data.");
    }

    // Calculate average amplitude
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }

    const average = sum / dataArrayRef.current.length;
    const normalizedAmplitude = average / 255;

    // Apply more aggressive scaling
    const scaledAmplitude = Math.pow(normalizedAmplitude, 1.5) * 2;
    const finalAmplitude = Math.min(scaledAmplitude, 1);

    console.log("Raw Average:", average);
    console.log("Normalized Amplitude:", normalizedAmplitude);
    console.log("Scaled Amplitude:", scaledAmplitude);
    console.log("Final Amplitude:", finalAmplitude);

    setAmplitudeRef.current(finalAmplitude);

    console.log("Is it playing:", isPlayingRef.current);

    if (isPlayingRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateAmplitude);
    }
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      isPlayingRef.current = false;
      // Reset amplitude to 0 when pausing
      setAmplitudeRef.current(0);
      
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend().then(() => {
          console.log("AudioContext suspended.");
        }).catch(error => {
          console.error("Error suspending AudioContext:", error);
        });
      }
      if (animationFrameRef.current) {
        console.log("Cancelling animation frame.");
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsPlaying(false);
    } else {
      console.log("Playing audio.");
      // Initialize AudioContext if not already
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        console.log("Initializing AudioContext.");
        audioContextRef.current = new window.AudioContext();
        if (audioContextRef.current && audioRef.current) {
          console.log("AudioContext and audioRef.current initialized.");
          try {
            // Ensure MediaElementSourceNode is only created once
            if (!sourceNodeRef.current) {
              console.log("Initializing MediaElementSourceNode.");
              sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
            }

            // Initialize AnalyserNode if not already
            if (!analyserNodeRef.current) {
              console.log("Initializing AnalyserNode.");
              analyserNodeRef.current = audioContextRef.current.createAnalyser();
              analyserNodeRef.current.fftSize = 512;
              analyserNodeRef.current.smoothingTimeConstant = 0.6;
              analyserNodeRef.current.minDecibels = -90;
              analyserNodeRef.current.maxDecibels = -10;

              console.log("AnalyserNode initialized.");
              const bufferLength = analyserNodeRef.current.frequencyBinCount;
              console.log("BufferLength:", bufferLength);
              dataArrayRef.current = new Uint8Array(bufferLength);
              console.log("DataArray initialized.",dataArrayRef.current);
            }

            // Connect nodes
            if (sourceNodeRef.current && analyserNodeRef.current && audioContextRef.current) {
              sourceNodeRef.current.connect(analyserNodeRef.current);
              console.log("SourceNode connected to AnalyserNode.");
              analyserNodeRef.current.connect(audioContextRef.current.destination);
              console.log("AnalyserNode connected to AudioContext destination.");
              console.log("AudioContext and nodes initialized.");
            }
          } catch (error) {
            console.error("Error initializing AudioContext and nodes:", error);
          }
        }
      }

      // Resume AudioContext if suspended
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log("AudioContext resumed:", audioContextRef.current?.state);
        }).catch(error => {
          console.error("Error resuming AudioContext:", error);
        });
      }

      // Play the audio
      audioRef.current.play()
        .then(() => {
          isPlayingRef.current = true;
          setIsPlaying(true);
          animationFrameRef.current = requestAnimationFrame(updateAmplitude);
        })
        .catch(error => {
          console.error("Error during audio playback:", error);
        });
    }
  }, [isPlaying, updateAmplitude]);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().then(() => {
          console.log("AudioContext closed.");
        }).catch(error => {
          console.error("Error closing AudioContext:", error);
        });
      }
    };
  }, []);

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

      <div className="volume-control">
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
      </div>

      <div className="song-info">
        <p className="audio-filename">{filename}</p>
      </div>
    </div>
  );
};

export default AudioPlayer;