import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, Calendar, TrendingUp, GitCompare, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { backend } from '../services/backend';
import { saveImageToDB, getImageFromDB } from '../utils/db';

export const ProgressPhotos: React.FC = () => {
  const { dailyLogs, logDailyBio, settings } = useStore();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate image URL (base64 or HTTP URL)
  const isValidImageUrl = (url: string | undefined): url is string => {
    if (!url) return false;
    if (url.startsWith('data:')) {
      return url.startsWith('data:image/') && url.length > 50;
    }
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Lazy migration: Upload existing local-only progress photos to cloud
  useEffect(() => {
    const migrateLocalPhotosToCloud = async () => {
      try {
        const photosToMigrate = Object.entries(dailyLogs)
          .filter(([_, log]) => {
            // Find photos that are base64 (local-only), not cloud URLs
            return log.progressPhoto && log.progressPhoto.startsWith('data:image/');
          });

        if (photosToMigrate.length === 0) return;

        console.log(`🔄 Migrating ${photosToMigrate.length} local progress photos to cloud...`);

        for (const [date, log] of photosToMigrate) {
          try {
            const cloudUrl = await backend.storage.uploadImage(
              `progress-photo-${date}`,
              log.progressPhoto!
            );

            // Update daily log with cloud URL
            logDailyBio(date, { progressPhoto: cloudUrl });

            // Cache locally for offline access
            await saveImageToDB(`progress-photo-${date}`, log.progressPhoto!);

            console.log(`✅ Migrated progress photo for ${date}`);
          } catch (error) {
            console.warn(`⚠️ Failed to migrate photo for ${date}:`, error);
            // Don't fail migration for one photo - continue with others
          }
        }

        console.log('✅ Progress photo migration complete');
      } catch (error) {
        console.error('❌ Progress photo migration failed:', error);
      }
    };

    // Run migration after a short delay to avoid blocking initial render
    const timer = setTimeout(migrateLocalPhotosToCloud, 2000);
    return () => clearTimeout(timer);
  }, []); // Run once on mount

  // Comparison Mode State
  const [showComparison, setShowComparison] = useState(false);
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(0);

  // Get all photos sorted by date (oldest first for comparison indexes)
  const photos = Object.values(dailyLogs)
    .filter(log => isValidImageUrl(log.progressPhoto))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Memoize comparison photos
  const beforePhoto = photos[beforeIndex];
  const afterPhoto = photos[afterIndex];

  // Initialize comparison indexes when entering comparison mode
  const initCompare = () => {
    if (photos.length >= 2) {
      setBeforeIndex(0); // First/oldest photo
      setAfterIndex(photos.length - 1); // Latest photo
      setShowComparison(true);
    }
  };

  // Calculate weight change between comparison photos
  const weightChange = useMemo(() => {
    if (!beforePhoto?.bodyweight || !afterPhoto?.bodyweight) return null;
    return afterPhoto.bodyweight - beforePhoto.bodyweight;
  }, [beforePhoto, afterPhoto]);

  // Calculate days between photos
  const daysBetween = useMemo(() => {
    if (!beforePhoto || !afterPhoto) return 0;
    return Math.round(
      (new Date(afterPhoto.date).getTime() - new Date(beforePhoto.date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }, [beforePhoto, afterPhoto]);

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

  const handleSavePhoto = async () => {
    if (!previewImage) return;

    setUploadingPhoto(true);

    try {
      // Try to upload to cloud storage first
      const cloudUrl = await backend.storage.uploadImage(
        `progress-photo-${selectedDate}`,
        previewImage
      );

      // Save cloud URL to daily logs (will trigger sync)
      logDailyBio(selectedDate, { progressPhoto: cloudUrl });

      // Cache locally for offline access
      await saveImageToDB(`progress-photo-${selectedDate}`, previewImage);

      console.log(`✅ Progress photo uploaded to cloud: ${cloudUrl}`);
    } catch (cloudError) {
      console.warn('⚠️ Cloud upload failed, saving locally only:', cloudError);

      // Fallback: Save to local state only
      logDailyBio(selectedDate, { progressPhoto: previewImage });

      // Note: No IndexedDB fallback needed here since the base64 is in dailyLogs
      alert('Photo saved locally. Enable cloud sync to access across devices.');
    }

    setUploadingPhoto(false);
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
          <div className="flex gap-2">
            {photos.length >= 2 && (
              <button
                onClick={initCompare}
                className="px-4 py-2 bg-[#222] text-white font-bold uppercase text-xs border border-[#333] hover:border-primary hover:text-primary transition-colors flex items-center gap-2"
              >
                <GitCompare size={14} />
                Compare
              </button>
            )}
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 bg-primary text-black font-bold uppercase text-xs hover:bg-white transition-colors"
            >
              Add Photo
            </button>
          </div>
        </div>

        {photos.length === 0 && !showUpload && (
          <div className="text-center py-8">
            <ImageIcon size={48} className="text-[#333] mx-auto mb-3" />
            <p className="text-sm text-[#666] mb-1">No progress photos yet</p>
            <p className="text-[10px] text-[#444]">Track your transformation visually</p>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showComparison && beforePhoto && afterPhoto && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#222]">
            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
              <GitCompare size={20} className="text-primary" />
              Before & After
            </h3>
            <button
              onClick={() => setShowComparison(false)}
              className="text-[#666] hover:text-white transition-colors p-2"
            >
              <X size={24} />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-6 py-3 bg-[#111] border-b border-[#222]">
            <div className="text-center">
              <div className="text-xl font-black text-primary">{daysBetween}</div>
              <div className="text-[10px] text-[#666] uppercase font-bold">Days</div>
            </div>
            {weightChange !== null && (
              <div className="text-center">
                <div className={`text-xl font-black ${weightChange < 0 ? 'text-blue-400' : weightChange > 0 ? 'text-orange-400' : 'text-white'}`}>
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                </div>
                <div className="text-[10px] text-[#666] uppercase font-bold">{settings.units}</div>
              </div>
            )}
          </div>

          {/* Side by Side Photos */}
          <div className="flex-1 flex overflow-hidden">
            {/* Before Photo */}
            <div className="flex-1 flex flex-col border-r border-[#333]">
              <div className="flex-1 relative overflow-hidden">
                <img
                  src={beforePhoto.progressPhoto}
                  alt="Before"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-sm">
                  <span className="text-xs font-black uppercase text-white">Before</span>
                </div>
              </div>
              <div className="p-3 bg-[#111]">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setBeforeIndex(Math.max(0, beforeIndex - 1))}
                    disabled={beforeIndex === 0}
                    className="p-2 text-[#666] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="text-center">
                    <div className="text-sm font-bold text-white">
                      {new Date(beforePhoto.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {beforePhoto.bodyweight && (
                      <div className="text-[10px] text-[#666] font-mono">{beforePhoto.bodyweight.toFixed(1)} {settings.units}</div>
                    )}
                  </div>
                  <button
                    onClick={() => setBeforeIndex(Math.min(afterIndex - 1, beforeIndex + 1))}
                    disabled={beforeIndex >= afterIndex - 1}
                    className="p-2 text-[#666] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* After Photo */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 relative overflow-hidden">
                <img
                  src={afterPhoto.progressPhoto}
                  alt="After"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 px-3 py-1 bg-primary">
                  <span className="text-xs font-black uppercase text-black">After</span>
                </div>
              </div>
              <div className="p-3 bg-[#111]">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setAfterIndex(Math.max(beforeIndex + 1, afterIndex - 1))}
                    disabled={afterIndex <= beforeIndex + 1}
                    className="p-2 text-[#666] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="text-center">
                    <div className="text-sm font-bold text-white">
                      {new Date(afterPhoto.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {afterPhoto.bodyweight && (
                      <div className="text-[10px] text-primary font-mono">{afterPhoto.bodyweight.toFixed(1)} {settings.units}</div>
                    )}
                  </div>
                  <button
                    onClick={() => setAfterIndex(Math.min(photos.length - 1, afterIndex + 1))}
                    disabled={afterIndex >= photos.length - 1}
                    className="p-2 text-[#666] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#111] border-t border-[#222] text-center">
            <p className="text-[10px] text-[#666] uppercase font-bold tracking-widest">
              Use arrows to select different photos
            </p>
          </div>
        </div>
      )}

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
                  disabled={!previewImage || uploadingPhoto}
                  className="flex-1 py-3 bg-primary text-black font-bold uppercase text-xs hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingPhoto ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    'Save Photo'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {[...photos].reverse().map((log) => (
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
