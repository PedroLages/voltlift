import { X } from 'lucide-react';

interface InAppVideoPlayerProps {
  videoUrl: string;
  exerciseName: string;
  onClose: () => void;
}

export function InAppVideoPlayer({ videoUrl, exerciseName, onClose }: InAppVideoPlayerProps) {
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1` : null;
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#0a0a0a] border-2 border-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h3 className="text-lg font-black italic uppercase text-primary">
            {exerciseName} - Form Guide
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-primary transition-colors"
            aria-label="Close video"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video Player */}
        {embedUrl ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${exerciseName} form video`}
            />
          </div>
        ) : (
          <div className="p-8 text-center text-[#666]">
            <p className="text-sm">Invalid video URL. Please use a YouTube link.</p>
          </div>
        )}
      </div>
    </div>
  );
}
