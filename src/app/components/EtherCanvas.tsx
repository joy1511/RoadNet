import { motion } from 'motion/react';
import { useMemo } from 'react';

interface Orb {
  id: number;
  size: number;
  x: string;
  y: string;
  color: string;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
}

export function EtherCanvas() {
  const orbs = useMemo<Orb[]>(() => [
    { id: 0,  size: 420, x: '10%',  y: '15%',  color: 'rgba(59,130,246,0.13)',  duration: 22, delay: 0,    dx: 60,  dy: 40  },
    { id: 1,  size: 340, x: '70%',  y: '10%',  color: 'rgba(139,92,246,0.10)',  duration: 28, delay: 4,    dx: -50, dy: 60  },
    { id: 2,  size: 280, x: '80%',  y: '60%',  color: 'rgba(59,130,246,0.09)',  duration: 20, delay: 8,    dx: -40, dy: -50 },
    { id: 3,  size: 360, x: '30%',  y: '70%',  color: 'rgba(99,102,241,0.08)',  duration: 26, delay: 2,    dx: 55,  dy: -35 },
    { id: 4,  size: 200, x: '50%',  y: '40%',  color: 'rgba(139,92,246,0.07)',  duration: 18, delay: 6,    dx: -30, dy: 45  },
    { id: 5,  size: 300, x: '5%',   y: '55%',  color: 'rgba(59,130,246,0.08)',  duration: 24, delay: 10,   dx: 45,  dy: -40 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: 'blur(40px)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, orb.dx, orb.dx * 0.4, -orb.dx * 0.6, 0],
            y: [0, orb.dy * 0.5, orb.dy, orb.dy * 0.3, 0],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Faint dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,160,255,0.18) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)',
        }}
      />
    </div>
  );
}
