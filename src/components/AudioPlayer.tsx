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
      src: "/assets/music/Karmakaio & Sigurd K - Where U Been (Original Mix).mp3",
      title: "Karmakaio & Sigurd K - Where U Been (Original Mix)",
    },
    {
      src: "/assets/music/Lil Tecca - 500lbs (More & Karmakaio Remix).mp3",
      title: "Lil Tecca - 500lbs (More & Karmakaio Remix)",
    },
    {
      src: "/assets/music/¥$, Ye, Ty Dolla $ign - Vultures feat. Bump J & Lil Durk - Vultures (Karmakaio Remix).mp3",
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

  const playSong = () => {
    if (!audioRef.current) return;
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((error) => {
        console.error("Playback error:", error);
      });
  };

  const pauseSong = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const playNext = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  };

  const playPrevious = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
  };

  // Automatically play the song when currentSongIndex changes
  useEffect(() => {
    if (isPlaying) {
      playSong();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSongIndex]);

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
      <audio ref={audioRef} src={currentSong.src} />
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