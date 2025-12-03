import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number; // Milliseconds (default: 3000)
  particleCount?: number; // Number of confetti pieces (default: 50)
}

interface Particle {
  x: number;
  y: number;
  vx: number; // Velocity X
  vy: number; // Velocity Y
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  gravity: number;
}

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  duration = 3000,
  particleCount = 50
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      // Clear canvas and stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      particlesRef.current = [];
      startTimeRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize particles
    const colors = ['#ccff00', '#ffffff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#00d9ff'];
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20, // Start above screen
        vx: (Math.random() - 0.5) * 8, // Horizontal velocity
        vy: Math.random() * -10 - 5, // Initial upward velocity
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: Math.random() * 0.3 + 0.2
      });
    }

    particlesRef.current = particles;
    startTimeRef.current = Date.now();

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;

      const now = Date.now();
      const elapsed = startTimeRef.current ? now - startTimeRef.current : 0;

      // Stop animation after duration
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationFrameRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        // Update physics
        particle.vy += particle.gravity; // Apply gravity
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        // Bounce off sides
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx *= -0.8;
          particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        }

        // Don't render if off-screen
        if (particle.y > canvas.height + 50) return;

        // Draw confetti piece (rectangle)
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active, duration, particleCount]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  );
};

export default Confetti;
