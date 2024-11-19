import React, { useRef, useState, useEffect } from "react";
import "./AudioPlayer.css"; // Import the associated CSS

interface Song {
  src: string;
  title: string;
}

const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

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

  const filename = currentSong.title;

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Automatic playback started!
            setIsPlaying(true);
          })
          .catch((error) => {
            // Automatic playback failed.
            console.error("Playback error:", error);
          });
      }
    }
  };

  const playNext = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  };

  const playPrevious = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
  };

  // Automatically play the song when currentSongIndex changes
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play()
        .then(() => {
          // Automatic playback started!
          setIsPlaying(true);
        })
        .catch((error) => {
          // Automatic playback failed.
          console.error("Playback error:", error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSongIndex]);

  // Set volume to maximum once the audio element is available
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 1.0; // Volume range: 0.0 to 1.0
    }
  }, [currentSong]);

  // Pause the song when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={currentSong.src} controls preload="auto" />
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

      <span className="audio-filename">{filename}</span>
      {/* Additional controls like volume slider can be added here */}
    </div>
  );
};

export default AudioPlayer;