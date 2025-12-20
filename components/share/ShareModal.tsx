/**
 * ShareModal Component
 *
 * Modal for previewing and sharing workout cards.
 * Provides options for different card styles and share methods.
 */

import React, { useRef, useState } from 'react';
import { X, Share2, Download, Copy, Check, Sparkles } from 'lucide-react';
import { WorkoutSession } from '../../types';
import { WorkoutXPResult } from '../../services/gamification';
import ShareableWorkoutCard from './ShareableWorkoutCard';
import { useShare } from './useShare';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutSession;
  xpResult?: WorkoutXPResult | null;
  userName?: string;
  totalXP?: number;
  streak?: number;
  prsHit?: number;
}

type CardVariant = 'dark' | 'neon' | 'minimal';

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  workout,
  xpResult,
  userName = 'Athlete',
  totalXP = 0,
  streak = 0,
  prsHit = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<CardVariant>('neon');
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const { share, download, copy, isGenerating, canShare } = useShare({
    fileName: `voltlift-workout-${workout.id}`,
  });

  const handleShare = async () => {
    if (!cardRef.current) return;

    const result = await share(cardRef.current, workout.name);
    if (result.success && result.method === 'share') {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    await download(cardRef.current);
  };

  const handleCopy = async () => {
    if (!cardRef.current) return;

    const result = await copy(cardRef.current);
    if (result.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const variants: { id: CardVariant; name: string; color: string }[] = [
    { id: 'neon', name: 'Neon', color: 'bg-[#ccff00]' },
    { id: 'dark', name: 'Dark', color: 'bg-zinc-700' },
    { id: 'minimal', name: 'Minimal', color: 'bg-blue-500' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#ccff00]" />
            <h2 className="font-bold text-white">Share Your Workout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Card Preview */}
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <div className="transform scale-[0.7] origin-top">
            <ShareableWorkoutCard
              ref={cardRef}
              workout={workout}
              xpResult={xpResult}
              userName={userName}
              totalXP={totalXP}
              streak={streak}
              prsHit={prsHit}
              variant={variant}
            />
          </div>
        </div>

        {/* Style Selector */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-zinc-500 uppercase font-bold">Style:</span>
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all
                  ${variant === v.id
                    ? `${v.color} text-black`
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }
                `}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-zinc-800 grid grid-cols-3 gap-2">
          {/* Share Button (Mobile) */}
          {canShare && (
            <button
              onClick={handleShare}
              disabled={isGenerating}
              className={`
                flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-bold text-sm uppercase transition-all
                ${shared
                  ? 'bg-green-500 text-black'
                  : 'bg-[#ccff00] text-black hover:bg-[#b8e600]'
                }
                ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {shared ? <Check size={20} /> : <Share2 size={20} />}
              {shared ? 'Shared!' : 'Share'}
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={isGenerating}
            className={`
              flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-bold text-sm uppercase transition-all
              ${copied
                ? 'bg-green-500 text-black'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`
              flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-bold text-sm uppercase transition-all
              bg-zinc-800 text-white hover:bg-zinc-700
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <Download size={20} />
            Save
          </button>
        </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-zinc-800 px-6 py-4 rounded-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
              <span className="text-white font-medium">Generating image...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
