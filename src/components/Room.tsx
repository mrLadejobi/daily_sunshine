import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyNote } from '../types';
import confetti from 'canvas-confetti';
import { LogOut } from 'lucide-react';

interface RoomProps {
  note: DailyNote | null;
  onSignOut: () => void;
}

export default function Room({ note, onSignOut }: RoomProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    if (note && !isOpen) {
      setIsOpen(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: [note.color_vibe, '#ffffff', '#FFD700', '#FF8C00']
      });
    }
  };

  const bgColor = note?.color_vibe || '#FFB067';
  const hasNote = !!note;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0C0A09] flex flex-col items-center justify-center font-sans">
      
      {/* Sign Out Button */}
      <button 
        onClick={onSignOut}
        className="absolute top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-all"
        title="Sign Out"
      >
        <LogOut size={18} />
      </button>

      {/* --- ATMOSPHERIC BACKGROUND --- */}
      {/* Base Image (Cozy, blurred room/texture to give a sense of space without being literal) */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2000&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(12px)'
        }}
      ></div>

      {/* Dynamic Glow based on Note Color (Acts like a warm lamp or sunbeam) */}
      <motion.div 
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${bgColor} 0%, transparent 65%)`,
          filter: 'blur(60px)',
          mixBlendMode: 'screen'
        }}
      />

      {/* Vignette to focus attention on the center */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#0C0A09_100%)] opacity-90"></div>

      {/* --- INTERACTION AREA --- */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl px-4">
        {!isOpen ? (
          <motion.div 
            initial={{ y: 10 }}
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpen}
              className={`cursor-pointer group relative w-80 h-52 ${hasNote ? 'opacity-100' : 'opacity-50 grayscale cursor-not-allowed'}`}
            >
              {/* Envelope Shadow (Soft, floating shadow) */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 h-8 bg-black/60 blur-xl rounded-full"></div>

              {/* Envelope Back */}
              <div className="absolute inset-0 bg-[#EAE0D5] rounded-sm shadow-2xl border border-[#D6C5B3]"></div>
              
              {/* Envelope Flap (Closed) */}
              <div className="absolute top-0 left-0 right-0 h-[60%] bg-[#F4EFEA] origin-top rounded-t-sm border-b border-[#D6C5B3] shadow-sm z-20" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
              
              {/* Envelope Front Bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-full bg-[#FDFBF7] rounded-b-sm z-10" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 40%, 50% 75%, 0 40%)' }}></div>
              
              {/* Wax Seal */}
              {hasNote && (
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#7A1C1C] rounded-full z-30 shadow-lg flex items-center justify-center border-2 border-[#521111] group-hover:bg-[#9E2A2A] transition-colors">
                  <div className="absolute inset-1 border border-[#9E2A2A] rounded-full opacity-50"></div>
                  <span className="text-[#F4EFEA] font-display text-3xl mt-1 opacity-90">S</span>
                </div>
              )}
            </motion.div>

            {/* Status Text */}
            <div className="mt-16 h-8">
              {!hasNote ? (
                <span className="text-white/40 text-xs font-bold uppercase tracking-[0.3em]">
                  No letter for today yet
                </span>
              ) : (
                <motion.span 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-white/80 text-xs font-bold uppercase tracking-[0.3em]"
                >
                  Tap to open today's letter
                </motion.span>
              )}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative z-50 w-full"
            >
              {/* The Letter */}
              <motion.div 
                className="relative z-10 paper-texture p-10 md:p-16 rounded-sm shadow-[0_30px_80px_rgba(0,0,0,0.8)] border border-[#e8e4d9] min-h-[400px] flex flex-col"
              >
                <div className="flex justify-between items-center mb-10 border-b border-[#050505]/10 pb-6">
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#050505]/40">{note?.id}</span>
                  <button onClick={() => setIsOpen(false)} className="text-[#050505]/40 hover:text-[#050505] transition-colors font-sans text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <span>Close</span>
                  </button>
                </div>
                
                <p className="font-sans font-medium text-xl md:text-3xl text-[#1A1A1A] leading-relaxed flex-1 whitespace-pre-wrap">
                  {note?.message}
                </p>
                
                <div className="mt-16 text-right">
                  <span className="block font-sans text-xs text-[#050505]/40 uppercase tracking-[0.3em] mb-2">With love,</span>
                  <span className="font-display text-5xl text-[#050505] tracking-tight">Your Friend</span>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
