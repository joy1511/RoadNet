/**
 * SpaceParticles - Ether/space cursor trailing effect
 * Canvas-based particle system that creates floating star-like dots
 * following cursor movement on the landing page
 */

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  decay: number;
  hue: number;
}

export const SpaceParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  const spawnParticle = useCallback((x: number, y: number) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.8 + 0.2;
    const hue = Math.random() > 0.5 ? 200 + Math.random() * 40 : 170 + Math.random() * 30;

    particlesRef.current.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
      decay: Math.random() * 0.008 + 0.004,
      hue,
    });

    // Cap particles
    if (particlesRef.current.length > 120) {
      particlesRef.current.splice(0, 10);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Also spawn ambient particles
    const spawnAmbient = () => {
      if (Math.random() > 0.85) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particlesRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.3,
          opacity: Math.random() * 0.2 + 0.05,
          decay: Math.random() * 0.003 + 0.001,
          hue: 200 + Math.random() * 40,
        });
      }
    };

    const animate = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn cursor particles
      if (now - lastSpawnRef.current > 30) {
        const { x, y } = mouseRef.current;
        if (x > 0 && y > 0) {
          for (let i = 0; i < 2; i++) {
            spawnParticle(
              x + (Math.random() - 0.5) * 20,
              y + (Math.random() - 0.5) * 20
            );
          }
        }
        lastSpawnRef.current = now;
      }

      spawnAmbient();

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= p.decay;
        p.vx *= 0.99;
        p.vy *= 0.99;

        if (p.opacity <= 0) return false;

        // Draw glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 75%, ${p.opacity})`);
        gradient.addColorStop(0.4, `hsla(${p.hue}, 70%, 60%, ${p.opacity * 0.4})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 60%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 90%, ${p.opacity})`;
        ctx.fill();

        return true;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [spawnParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="space-particles-canvas"
      aria-hidden="true"
    />
  );
};

export default SpaceParticles;
