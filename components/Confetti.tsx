/**
 * Confetti Component
 *
 * Lightweight confetti explosion effect for celebrations
 * Industrial-style particles with VoltLift neon aesthetic
 */

import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  particleCount?: number;
  duration?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

const COLORS = [
  '#ccff00', // primary neon yellow-green
  '#ffffff', // white
  '#22c55e', // green
  '#eab308', // yellow
];

/**
 * Explosive confetti effect for achievement unlocks
 *
 * Usage:
 * ```tsx
 * <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
 * ```
 */
export function Confetti({
  active,
  onComplete,
  particleCount = 50,
  duration = 3000,
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Generate random particles
    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // 0-100% of screen width
      y: -10, // Start above screen
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5, // 0.5-1.0x
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 200, // Stagger start times
    }));

    setParticles(newParticles);

    // Clean up after animation completes
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [active, particleCount, duration, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${duration}ms`,
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)', // Octagon shape
            boxShadow: `0 0 10px ${particle.color}80`,
          }}
        />
      ))}

      {/* CSS Animation */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-confetti-fall {
          animation: confetti-fall 3s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

export default Confetti;
