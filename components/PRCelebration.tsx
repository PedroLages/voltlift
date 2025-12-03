import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Zap, Target, Share2, X } from 'lucide-react';
import { Confetti } from './Confetti';
import { PRDetection } from '../services/strengthScore';

interface PRCelebrationProps {
  prs: PRDetection[];
  exerciseName: string;
  onClose: () => void;
  autoCloseDuration?: number; // Milliseconds (default: 5000)
}

export const PRCelebration: React.FC<PRCelebrationProps> = ({
  prs,
  exerciseName,
  onClose,
  autoCloseDuration = 5000
}) => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Trigger haptic feedback celebration pattern
    if (navigator.vibrate) {
      if (prs.length > 1) {
        // Multi-PR: Intense celebration pattern
        navigator.vibrate([100, 50, 100, 50, 200]);
      } else {
        // Single PR: Simple celebration
        navigator.vibrate([200, 100, 200]);
      }
    }

    // Auto-close after duration
    const timer = setTimeout(() => {
      setShowConfetti(false);
      setTimeout(onClose, 300); // Wait for confetti to finish
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [prs, onClose, autoCloseDuration]);

  const getPRIcon = (type: string) => {
    switch (type) {
      case 'weight': return <Trophy size={32} className="text-primary" />;
      case 'reps': return <Zap size={32} className="text-blue-400" />;
      case 'volume': return <TrendingUp size={32} className="text-purple-400" />;
      case '1rm': return <Target size={32} className="text-orange-400" />;
      default: return <Trophy size={32} className="text-primary" />;
    }
  };

  const getPRColor = (type: string) => {
    switch (type) {
      case 'weight': return 'text-primary border-primary';
      case 'reps': return 'text-blue-400 border-blue-400';
      case 'volume': return 'text-purple-400 border-purple-400';
      case '1rm': return 'text-orange-400 border-orange-400';
      default: return 'text-primary border-primary';
    }
  };

  const handleShare = async () => {
    // Generate share text
    const prTypes = prs.map(pr => pr.type.toUpperCase()).join(' + ');
    const shareText = prs.length > 1
      ? `🔥 Just hit a MULTI-PR (${prTypes}) on ${exerciseName}! #VoltLift #ProgressiveOverload`
      : `🏆 New ${prs[0].type.toUpperCase()} PR on ${exerciseName}: ${prs[0].value} ${prs[0].type === 'reps' ? 'reps' : 'LBS'}! #VoltLift`;

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Personal Record!',
          text: shareText,
          url: 'https://voltlift.app' // Update with actual URL
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('PR details copied to clipboard!');
    }
  };

  return (
    <>
      {/* Confetti Animation */}
      <Confetti active={showConfetti} duration={3000} particleCount={60} />

      {/* PR Celebration Overlay */}
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div
          className="bg-[#0a0a0a] border-2 border-primary p-8 max-w-md w-full mx-4 relative animate-bounce-in shadow-[0_0_40px_rgba(204,255,0,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors"
            aria-label="Close celebration"
          >
            <X size={24} />
          </button>

          {/* Main Header */}
          <div className="text-center mb-6">
            {prs.length > 1 ? (
              <>
                <h2 className="text-5xl volt-header text-primary mb-2 animate-pulse">
                  MULTI-PR!
                </h2>
                <p className="text-xl font-bold uppercase text-white">
                  {prs.map(pr => pr.type).join(' + ')}
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  {getPRIcon(prs[0].type)}
                </div>
                <h2 className="text-4xl volt-header text-white mb-2">
                  NEW RECORD!
                </h2>
                <p className="text-xl font-bold uppercase text-[#888]">
                  {prs[0].type} PR
                </p>
              </>
            )}
          </div>

          {/* Exercise Name */}
          <div className="text-center mb-6">
            <p className="text-2xl font-black italic text-white">
              {exerciseName}
            </p>
          </div>

          {/* PR Details Cards */}
          <div className="space-y-3 mb-6">
            {prs.map((pr, index) => (
              <div
                key={index}
                className={`bg-black/40 border ${getPRColor(pr.type)} p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPRIcon(pr.type)}
                    <span className="text-sm font-bold uppercase text-[#888]">
                      {pr.type}
                    </span>
                  </div>
                  <span className={`text-2xl font-black italic ${getPRColor(pr.type).split(' ')[0]}`}>
                    {pr.value} {pr.type === 'reps' ? 'REPS' : 'LBS'}
                  </span>
                </div>

                {/* Improvement Stats */}
                {pr.previousBest > 0 && (
                  <div className="flex justify-between text-xs font-mono text-[#666]">
                    <span>Previous: {pr.previousBest}</span>
                    <span className="text-green-400">
                      +{pr.improvement} ({pr.improvementPercent.toFixed(1)}%)
                    </span>
                  </div>
                )}

                {/* AI Message */}
                <p className="text-sm text-white mt-2 italic">
                  {pr.message}
                </p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-black italic py-3 uppercase tracking-wider hover:bg-[#b8e600] transition-colors"
            >
              <Share2 size={18} />
              Share
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-[#222] text-white font-black italic py-3 uppercase tracking-wider hover:bg-[#333] transition-colors border border-[#444]"
            >
              Continue
            </button>
          </div>

          {/* Motivational Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#666] uppercase tracking-widest font-bold">
              Progressive Overload = Unstoppable Progress 🚀
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PRCelebration;
