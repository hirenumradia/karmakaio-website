// Function to update normalizedMix based on playback state
export const updateNormalizedMix = (normalizedMix: number, isPlaying: boolean, isPlayingTransitionedTo: { from: boolean; to: boolean }, fadeOutFactor: number, previousNormalizedMixRef: React.MutableRefObject<number>): number => {
    if (!isPlayingTransitionedTo.from && !isPlayingTransitionedTo.to) {
      previousNormalizedMixRef.current = 0;
      return 0;
    }

    if (!isPlaying && !isPlayingTransitionedTo.to) {
      previousNormalizedMixRef.current -= fadeOutFactor; // Gradually decrease mixValueRef
      previousNormalizedMixRef.current = Math.max(previousNormalizedMixRef.current, 0); // Ensure it doesn't go below 0
      return previousNormalizedMixRef.current;
    }

    if (isPlaying) {
      previousNormalizedMixRef.current = normalizedMix; // Gradually increase mixValueRef
    }

    return normalizedMix;
  };