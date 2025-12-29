
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBallColor, soundPlayer } from '../constants';

interface MachineBall {
  id: number;
  number: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vr: number; // Angular velocity
}

interface LottoMachineProps {
  isDrawing: boolean;
  turbulence?: number; // 1 to 10
  speedMultiplier?: number; // 0.5 to 3.0
  soundEnabled?: boolean;
  isDarkMode?: boolean;
}

const LottoMachine: React.FC<LottoMachineProps> = ({ 
  isDrawing, 
  turbulence = 5,
  speedMultiplier = 1.0,
  soundEnabled = true,
  isDarkMode = false
}) => {
  const [balls, setBalls] = useState<MachineBall[]>([]);
  const requestRef = useRef<number>(null);
  const lastSoundTime = useRef<number>(0);

  const BALL_RADIUS = 10;
  const CONTAINER_RADIUS = 110;
  const CENTER_X = 125;
  const CENTER_Y = 125;

  useEffect(() => {
    // Initialize balls with random positions within the circular container
    const initialBalls = Array.from({ length: 35 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (CONTAINER_RADIUS - BALL_RADIUS - 5);
      return {
        id: i,
        number: Math.floor(Math.random() * 45) + 1,
        x: CENTER_X + Math.cos(angle) * dist,
        y: CENTER_Y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: BALL_RADIUS,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
      };
    });
    setBalls(initialBalls);
  }, []);

  const triggerCollisionSound = (intensity: number) => {
    if (!soundEnabled || !isDrawing) return;
    const now = performance.now();
    // Throttling sounds to prevent audio noise (max 20 sounds per second)
    if (now - lastSoundTime.current > 50) {
      soundPlayer.playCollision(intensity);
      lastSoundTime.current = now;
    }
  };

  const resolveCollisions = (balls: MachineBall[]) => {
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const b1 = balls[i];
        const b2 = balls[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = b1.radius + b2.radius;

        if (dist < minDist) {
          const angle = Math.atan2(dy, dx);
          const targetX = b1.x + Math.cos(angle) * minDist;
          const targetY = b1.y + Math.sin(angle) * minDist;
          const ax = (targetX - b2.x) * 0.5;
          const ay = (targetY - b2.y) * 0.5;

          // Velocity difference for sound intensity
          const relVel = Math.sqrt(Math.pow(b1.vx - b2.vx, 2) + Math.pow(b1.vy - b2.vy, 2));
          if (relVel > 2) triggerCollisionSound(relVel / 10);

          b1.vx -= ax;
          b1.vy -= ay;
          b2.vx += ax;
          b2.vy += ay;

          b1.vr += (Math.random() - 0.5) * 5;
          b2.vr += (Math.random() - 0.5) * 5;
        }
      }
    }
  };

  const animate = () => {
    setBalls((prevBalls) => {
      const newBalls = prevBalls.map((ball) => ({ ...ball }));
      resolveCollisions(newBalls);

      return newBalls.map((ball) => {
        let { x, y, vx, vy, rotation, vr } = ball;
        
        // Use speedMultiplier to scale the physics steps
        const dt = 1.0 * speedMultiplier;

        x += vx * dt;
        y += vy * dt;
        rotation += vr * dt;

        const dx = x - CENTER_X;
        const dy = y - CENTER_Y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > CONTAINER_RADIUS - ball.radius) {
          const nx = dx / dist;
          const ny = dy / dist;
          const dot = vx * nx + vy * ny;
          
          // Collision with wall sound
          const impact = Math.abs(dot);
          if (impact > 3) triggerCollisionSound(impact / 12);

          vx = (vx - 2 * dot * nx) * 0.8;
          vy = (vy - 2 * dot * ny) * 0.8;
          x = CENTER_X + nx * (CONTAINER_RADIUS - ball.radius);
          y = CENTER_Y + ny * (CONTAINER_RADIUS - ball.radius);
          vr += vx * 0.1;
        }

        if (isDrawing) {
          const heatFactor = turbulence * 0.2 * dt;
          vx += (Math.random() - 0.5) * heatFactor;
          vy += (Math.random() - 0.5) * heatFactor;
          
          if (y > CENTER_Y + 50) {
             vy -= Math.random() * 0.5 * heatFactor;
          }

          const speed = Math.sqrt(vx * vx + vy * vy);
          const maxSpeed = 12 * speedMultiplier;
          if (speed > maxSpeed) {
            vx = (vx / speed) * maxSpeed;
            vy = (vy / speed) * maxSpeed;
          }
        } else {
          vy += 0.2 * dt;
          vx *= 0.98;
          vy *= 0.98;
          vr *= 0.95;
        }

        return { ...ball, x, y, vx, vy, rotation, vr };
      });
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isDrawing, turbulence, speedMultiplier, soundEnabled]);

  return (
    <div className="relative w-[280px] h-[280px] mx-auto group">
      <div className={`absolute inset-0 rounded-full border-[10px] backdrop-blur-[2px] z-10 overflow-hidden transition-colors duration-500
        ${isDarkMode 
          ? 'border-slate-800 bg-slate-900/30 shadow-[inset_0_10px_40px_rgba(0,0,0,0.5),0_20px_50px_rgba(0,0,0,0.3)] ring-4 ring-slate-900' 
          : 'border-amber-400 bg-amber-50/10 shadow-[inset_0_10px_40px_rgba(251,191,36,0.15),0_20px_50px_rgba(251,191,36,0.1)] ring-4 ring-amber-100'}`}>
        
        <div className={`absolute inset-0 transition-opacity duration-1000 bg-gradient-to-t via-transparent to-transparent ${isDrawing ? 'opacity-100' : 'opacity-0'} ${isDarkMode ? 'from-indigo-500/10' : 'from-amber-500/20'}`} />
        
        <div className="relative w-full h-full">
          {balls.map((ball) => (
            <div
              key={ball.id}
              className={`absolute rounded-full flex items-center justify-center shadow-lg border border-white/30 transition-shadow duration-300 ${getBallColor(ball.number)}`}
              style={{
                width: `${ball.radius * 2}px`,
                height: `${ball.radius * 2}px`,
                left: `${ball.x}px`,
                top: `${ball.y}px`,
                transform: `translate(-50%, -50%) rotate(${ball.rotation}deg)`,
                fontSize: '8px',
                fontWeight: 'bold',
                willChange: 'transform, left, top'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full pointer-events-none" />
              <span className="relative z-10 scale-[0.8]">{ball.number}</span>
            </div>
          ))}
        </div>

        <div className={`absolute top-[10%] left-[20%] w-[30%] h-[15%] rounded-full blur-md -rotate-45 pointer-events-none ${isDarkMode ? 'bg-white/10' : 'bg-white/40'}`} />
      </div>

      <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-10 rounded-b-2xl rounded-t-lg shadow-2xl z-0 transition-colors
        ${isDarkMode ? 'bg-gradient-to-b from-slate-800 to-slate-950' : 'bg-gradient-to-b from-amber-400 to-amber-600'}`} />
      
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 border-x-4 z-0 transition-all duration-300 
        ${isDrawing ? 'brightness-110 shadow-[0_-5px_15px_rgba(251,191,36,0.2)]' : ''}
        ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-amber-100 border-amber-300'}`}>
        <div className={`w-full h-full flex flex-col items-center justify-center gap-1 opacity-40`}>
           <div className={`w-4 h-[1px] ${isDarkMode ? 'bg-slate-700' : 'bg-amber-400'}`} />
           <div className={`w-4 h-[1px] ${isDarkMode ? 'bg-slate-700' : 'bg-amber-400'}`} />
           <div className={`w-4 h-[1px] ${isDarkMode ? 'bg-slate-700' : 'bg-amber-400'}`} />
        </div>
      </div>
      
      <AnimatePresence>
        {isDrawing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-4 rounded-full pointer-events-none z-20 overflow-hidden"
          >
            <div className={`absolute inset-0 animate-[spin_2s_linear_infinite] ${isDarkMode ? 'bg-[conic-gradient(from_0deg,transparent,rgba(99,102,241,0.1),transparent)]' : 'bg-[conic-gradient(from_0deg,transparent,rgba(251,191,36,0.15),transparent)]'}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LottoMachine;
