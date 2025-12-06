import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Calendar, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ProgressPhotos: React.FC = () => {
  const { dailyLogs, logDailyBio } = useStore();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all photos sorted by date
  const photos = Object.values(dailyLogs)
    .filter(log => log.progressPhoto)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Please use an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!previewImage) return;

    logDailyBio(selectedDate, { progressPhoto: previewImage });
    setPreviewImage(null);
    setShowUpload(false);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleDeletePhoto = (date: string) => {
    if (confirm('Delete this progress photo?')) {
      const log = dailyLogs[date];
      if (log) {
        logDailyBio(date, { progressPhoto: undefined });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#111] border border-[#222] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-primary" />
            <h3 className="text-sm font-bold uppercase text-white">Progress Photos</h3>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-primary text-black font-bold uppercase text-xs hover:bg-white transition-colors"
          >
            Add Photo
          </button>
        </div>

        {photos.length === 0 && !showUpload && (
          <div className="text-center py-8">
            <ImageIcon size={48} className="text-[#333] mx-auto mb-3" />
            <p className="text-sm text-[#666] mb-1">No progress photos yet</p>
            <p className="text-[10px] text-[#444]">Track your transformation visually</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] border-2 border-primary max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#222]">
              <h3 className="text-lg font-black uppercase text-white">Add Progress Photo</h3>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setPreviewImage(null);
                }}
                className="text-[#666] hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Date Picker */}
              <div>
                <label className="text-[10px] text-[#666] uppercase font-bold tracking-widest block mb-2">
                  Photo Date
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-black border border-[#333] pl-10 pr-3 py-2 text-white font-mono text-sm focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Image Preview or Upload Button */}
              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-64 object-cover border-2 border-[#333]"
                  />
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-2 right-2 p-2 bg-black/80 text-white hover:bg-red-900/80 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-12 border-2 border-dashed border-[#333] hover:border-primary transition-colors flex flex-col items-center justify-center gap-3"
                  >
                    <Camera size={32} className="text-[#666]" />
                    <div className="text-sm text-[#666] font-bold uppercase">
                      Click to Upload Photo
                    </div>
                    <div className="text-[10px] text-[#444] font-mono">
                      Max 5MB • JPG, PNG, WEBP
                    </div>
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setPreviewImage(null);
                  }}
                  className="flex-1 py-3 bg-[#222] text-white font-bold uppercase text-xs border border-[#333] hover:bg-[#333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePhoto}
                  disabled={!previewImage}
                  className="flex-1 py-3 bg-primary text-black font-bold uppercase text-xs hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {photos.map((log) => (
            <div
              key={log.date}
              className="relative bg-[#111] border border-[#222] overflow-hidden group"
            >
              {/* Photo */}
              <img
                src={log.progressPhoto}
                alt={`Progress ${log.date}`}
                className="w-full h-48 object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-white mb-1">
                        {new Date(log.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      {log.bodyweight && (
                        <p className="text-[10px] text-primary font-mono">
                          {log.bodyweight.toFixed(1)} lbs
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePhoto(log.date)}
                      className="p-2 bg-red-900/80 hover:bg-red-900 text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Date Badge */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-sm">
                <p className="text-[10px] font-mono text-white uppercase">
                  {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {photos.length > 0 && (
        <div className="bg-[#111] border border-[#222] p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-primary" />
            <h4 className="text-xs font-bold uppercase text-white">Photo Timeline</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-black italic text-white">{photos.length}</div>
              <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest">Total Photos</div>
            </div>
            <div>
              <div className="text-2xl font-black italic text-white">
                {Math.round((Date.now() - new Date(photos[photos.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest">Days Tracked</div>
            </div>
            <div>
              <div className="text-2xl font-black italic text-primary">
                {photos.length > 1 ? Math.round((Date.now() - new Date(photos[photos.length - 1].date).getTime()) / (1000 * 60 * 60 * 24 * photos.length)) : 0}
              </div>
              <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest">Days Between</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPhotos;
