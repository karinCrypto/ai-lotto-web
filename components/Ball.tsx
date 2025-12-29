
import React from 'react';
import { motion } from 'framer-motion';
import { BallProps } from '../types';
import { getBallColor } from '../constants';

const Ball: React.FC<BallProps> = ({ number, size = 'md', className = '', isSpecial = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-12 h-12 text-sm font-bold',
    lg: 'w-16 h-16 text-lg font-extrabold'
  };

  // Squash and stretch bounce animation variants
  const bounceVariants = {
    initial: { 
      y: -40, 
      opacity: 0, 
      scaleX: 0.8, 
      scaleY: 1.2 
    },
    animate: { 
      y: 0, 
      opacity: 1, 
      scaleX: [1, 1.25, 0.85, 1.05, 1],
      scaleY: [1, 0.75, 1.15, 0.95, 1],
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15,
        mass: 1,
        // Scale keyframes timing
        scaleX: { duration: 0.6, times: [0, 0.2, 0.4, 0.7, 1] },
        scaleY: { duration: 0.6, times: [0, 0.2, 0.4, 0.7, 1] },
        y: { type: "spring", stiffness: 500, damping: 20 }
      }
    }
  };

  return (
    <motion.div
      variants={bounceVariants}
      initial="initial"
      animate="animate"
      className={`
        ${sizeClasses[size]} 
        ${getBallColor(number, isSpecial)} 
        rounded-full flex items-center justify-center 
        shadow-lg border-2 border-white/20 
        relative overflow-hidden shrink-0
        ${isSpecial ? 'ring-2 ring-red-400/50 ring-offset-2 ring-offset-transparent' : ''}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full pointer-events-none" />
      <span className="drop-shadow-md relative z-10">{number}</span>
    </motion.div>
  );
};

export default Ball;
