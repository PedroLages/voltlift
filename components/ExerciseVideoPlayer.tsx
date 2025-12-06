/**
 * Exercise Video Player
 *
 * Displays YouTube videos for exercise demonstrations
 * Converts regular YouTube URLs to embed format
 */

import React from 'react';
import { PlayCircle, X } from 'lucide-react';

interface ExerciseVideoPlayerProps {
  videoUrl: string;
  exerciseName: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

const ExerciseVideoPlayer: React.FC<ExerciseVideoPlayerProps> = ({
  videoUrl,
  exerciseName
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const videoId = getYouTubeVideoId(videoUrl);

  if (!videoId) {
    return (
      <div className="bg-[#111] border border-red-500 p-4">
        <p className="text-red-400 text-sm font-mono">Invalid YouTube URL</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? '1' : '0'}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div className="bg-black border border-[#222]">
      <div className="relative aspect-video bg-[#0a0a0a]">
        {!isPlaying ? (
          // Thumbnail with play button overlay
          <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlaying(true)}>
            <img
              src={thumbnailUrl}
              alt={`${exerciseName} demonstration`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to standard quality thumbnail if maxres fails
                e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
              <div className="transform group-hover:scale-110 transition-transform">
                <PlayCircle size={64} className="text-primary drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <p className="text-white font-bold text-sm uppercase tracking-wider italic">
                {exerciseName} Form Guide
              </p>
            </div>
          </div>
        ) : (
          // YouTube iframe player
          <div className="relative w-full h-full">
            <iframe
              src={embedUrl}
              title={`${exerciseName} demonstration`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 p-2 rounded-full transition-colors z-10"
              aria-label="Close video"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseVideoPlayer;
