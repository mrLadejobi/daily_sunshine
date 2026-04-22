import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyNote } from '../types';
import confetti from 'canvas-confetti';
import { LogOut, Mail } from 'lucide-react';
import FriendsNotes from './FriendsNotes';

interface RoomProps {
  note: DailyNote | null;
  onSignOut: () => void;
}

export default function Room({ note, onSignOut }: RoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showFriendsNotes, setShowFriendsNotes] = useState(false);

  const today = new Date();
  const isBirthday = today.getMonth() === 3 && today.getDate() === 23;

  const handleOpen = () => {
    if (note && !isOpen) {
      setIsOpen(true);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#4B0082', '#E6E6FA', '#FFD700', '#FFFFFF']
      });
    }
  };

  const bgColor = note?.color_vibe || '#4B0082';
  const hasNote = !!note;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0014] flex flex-col items-center justify-center font-sans">
      
      {/* Sign Out Button */}
      <button 
        onClick={onSignOut}
        className="absolute top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-all"
        title="Sign Out"
      >
        <LogOut size={18} />
      </button>

      {/* --- ATMOSPHERIC BACKGROUND --- */}
      {/* Magical Starry Night Background */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'contrast(1.2) brightness(0.8)'
        }}
      ></div>

      {/* Dynamic Glow based on Note Color */}
      <motion.div 
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${bgColor} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          mixBlendMode: 'screen'
        }}
      />

      {/* Soft Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#0a0014_100%)] opacity-90"></div>

      {/* --- INTERACTION AREA --- */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl px-4 h-full">
        {!isOpen ? (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: [-8, 8, -8], opacity: 1 }}
            transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 1 } }}
            className="flex flex-col items-center"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpen}
              className={`cursor-pointer group relative w-80 h-52 ${hasNote ? 'opacity-100' : 'opacity-50 grayscale cursor-not-allowed'}`}
            >
              {/* Envelope Shadow */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-64 h-10 bg-[#4B0082]/40 blur-2xl rounded-full"></div>

              {/* Envelope Back - Deep Royal Purple */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#300055] to-[#1a002b] rounded-lg shadow-2xl border border-white/10"></div>
              
              {/* Envelope Flap (Closed) */}
              <div className="absolute top-0 left-0 right-0 h-[60%] bg-gradient-to-b from-[#4B0082] to-[#300055] origin-top rounded-t-lg border-b border-black/30 shadow-md z-20" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
              
              {/* Envelope Front Bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-[#2d004d] to-[#4B0082] rounded-b-lg border-t border-white/5 z-10" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 40%, 50% 75%, 0 40%)' }}></div>
              
              {/* Wax Seal - Gold */}
              {hasNote && (
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-[#FFDF00] to-[#DAA520] rounded-full z-30 shadow-[0_0_15px_rgba(255,215,0,0.4)] flex items-center justify-center border-2 border-[#B8860B] group-hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] transition-all">
                  <div className="absolute inset-1 border border-[#B8860B] rounded-full opacity-60"></div>
                  <span className="text-[#8B6508] font-display text-4xl mb-1 opacity-90 drop-shadow-sm font-bold">S</span>
                </div>
              )}
            </motion.div>

            {/* Status Text */}
            <div className="mt-16 flex flex-col items-center h-20">
              {!hasNote ? (
                <span className="text-[#E6E6FA]/40 font-sans text-xs font-medium uppercase tracking-[0.3em]">
                  No letter for today yet
                </span>
              ) : (
                <motion.span 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-[#E6E6FA]/90 font-sans text-sm font-medium uppercase tracking-[0.3em]"
                >
                  Tap to open today's letter
                </motion.span>
              )}

              {isBirthday && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => setShowFriendsNotes(true)}
                  className="mt-8 flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-[#E6E6FA] font-sans text-sm font-medium tracking-wide transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(230,230,250,0.3)]"
                >
                  <Mail size={18} className="text-[#FFD700]" />
                  Read letters from friends
                </motion.button>
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
                className="relative z-10 paper-texture p-10 md:p-16 rounded-xl shadow-[0_30px_80px_rgba(0,0,0,0.8)] border border-[#E6E6FA]/20 min-h-[400px] flex flex-col"
              >
                <div className="flex justify-between items-center mb-10 border-b border-[#4B0082]/10 pb-6">
                  <span className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-[#4B0082]/50">{note?.id}</span>
                  <button onClick={() => setIsOpen(false)} className="text-[#4B0082]/50 hover:text-[#4B0082] transition-colors font-sans text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <span>Close Letter</span>
                  </button>
                </div>
                
                <p className="font-display text-xl md:text-3xl text-[#2d004d] leading-relaxed flex-1 whitespace-pre-wrap font-medium">
                  {note?.message}
                </p>
                
                <div className="mt-16 text-right">
                  <span className="block font-sans text-sm text-[#4B0082]/60 uppercase tracking-[0.2em] mb-2 font-medium">With all my love,</span>
                  <span className="font-display italic font-bold text-5xl text-[#4B0082] tracking-tight">Your Friend</span>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showFriendsNotes && (
          <FriendsNotes onClose={() => setShowFriendsNotes(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

