/**
 * ShareModal Component
 *
 * Industrial modal for previewing and sharing workout cards.
 * Features: cut corners, corner brackets, neon glow accents
 */

import React, { useRef, useState } from 'react';
import { X, Share2, Download, Copy, Check, Zap } from 'lucide-react';
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
    { id: 'neon', name: 'NEON', color: '#ccff00' },
    { id: 'dark', name: 'DARK', color: '#71717a' },
    { id: 'minimal', name: 'MINIMAL', color: '#60a5fa' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-black border-2 border-zinc-700 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col relative"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary pointer-events-none" />
        <div className="absolute top-0 right-4 w-4 h-4 border-r-2 border-t-2 border-primary pointer-events-none" />
        <div className="absolute bottom-4 left-0 w-4 h-4 border-l-2 border-b-2 border-primary pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 bg-primary flex items-center justify-center"
              style={{
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              }}
            >
              <Zap size={16} className="text-black" fill="currentColor" />
            </div>
            <h2 className="font-black italic uppercase text-white tracking-wide">Share Workout</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            style={{
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Preview */}
        <div className="flex-1 overflow-auto p-4 flex justify-center bg-zinc-950">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, #ccff00 1px, transparent 1px), linear-gradient(to bottom, #ccff00 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="transform scale-[0.7] origin-top relative">
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
        <div className="px-4 py-3 bg-zinc-900/50 border-t border-zinc-800">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mr-2">STYLE</span>
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                className={`
                  px-3 py-1.5 text-xs font-bold uppercase transition-all border-2
                  ${variant === v.id
                    ? 'text-black'
                    : 'bg-transparent text-zinc-500 border-zinc-700 hover:border-zinc-500'
                  }
                `}
                style={{
                  backgroundColor: variant === v.id ? v.color : undefined,
                  borderColor: variant === v.id ? v.color : undefined,
                  clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                  boxShadow: variant === v.id ? `0 0 15px ${v.color}40` : undefined,
                }}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-zinc-800 grid grid-cols-3 gap-2 bg-black">
          {/* Share Button (Mobile) */}
          {canShare && (
            <button
              onClick={handleShare}
              disabled={isGenerating}
              className={`
                flex flex-col items-center justify-center gap-1 py-3 font-bold text-xs uppercase transition-all border-2
                ${shared
                  ? 'bg-green-500 border-green-500 text-black'
                  : 'bg-primary border-primary text-black hover:shadow-neon'
                }
                ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              style={{
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              }}
            >
              {shared ? <Check size={18} /> : <Share2 size={18} />}
              {shared ? 'SENT' : 'SHARE'}
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={isGenerating}
            className={`
              flex flex-col items-center justify-center gap-1 py-3 font-bold text-xs uppercase transition-all border-2
              ${copied
                ? 'bg-green-500 border-green-500 text-black'
                : 'bg-zinc-900 border-zinc-700 text-white hover:border-zinc-500'
              }
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            }}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'DONE' : 'COPY'}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`
              flex flex-col items-center justify-center gap-1 py-3 font-bold text-xs uppercase transition-all border-2
              bg-zinc-900 border-zinc-700 text-white hover:border-zinc-500
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            }}
          >
            <Download size={18} />
            SAVE
          </button>
        </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div
              className="bg-zinc-900 border-2 border-primary px-6 py-4 flex items-center gap-3"
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                boxShadow: '0 0 30px rgba(204, 255, 0, 0.3)',
              }}
            >
              <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin" style={{ clipPath: 'none', borderRadius: '50%' }} />
              <span className="text-white font-bold uppercase text-sm tracking-wide">Generating...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
