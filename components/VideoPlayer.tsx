
import React, { useEffect } from 'react';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoRef, stream }) => {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    } else if (videoRef.current && !stream) {
      // Clear srcObject if stream is nullified (e.g., on stop)
      videoRef.current.srcObject = null;
    }
  }, [stream, videoRef]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted // Muting is often required for autoplay policies
      className="w-full h-full object-contain rounded-md bg-black"
    />
  );
};
