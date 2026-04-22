import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface FriendNote {
  id: string;
  sender: string;
  message: string;
}

interface FriendsNotesProps {
  onClose: () => void;
}

export default function FriendsNotes({ onClose }: FriendsNotesProps) {
  const [selectedNote, setSelectedNote] = useState<FriendNote | null>(null);
  const [notes, setNotes] = useState<FriendNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const q = query(
          collection(db, 'friend_notes'), 
          where('isSubmitted', '==', true),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const fetchedNotes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FriendNote[];
        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Error fetching friend notes:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, []);

  const handleOpenNote = (note: FriendNote) => {
    setSelectedNote(note);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#E6E6FA', '#4B0082', '#FFD700']
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      {/* Background magical elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-[#4B0082] rounded-full mix-blend-screen filter blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-[#E6E6FA] rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
      </div>

      <div className="relative w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h2 className="text-3xl md:text-5xl font-display text-[#FAFAFF] drop-shadow-lg">Love from your friends</h2>
          <button 
            onClick={onClose}
            className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full text-white transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {!selectedNote ? (
              <motion.div 
                key="gallery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto pr-4 pb-12 custom-scrollbar h-full content-start"
              >
                {loading ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-[#FFD700] mb-4" size={48} />
                    <p className="text-[#E6E6FA] font-sans">Gathering the letters...</p>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <Heart className="text-[#4B0082] mb-4" size={48} />
                    <p className="text-[#E6E6FA] font-sans text-lg">No letters have arrived yet.</p>
                  </div>
                ) : (
                  notes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenNote(note)}
                      className="cursor-pointer group relative flex flex-col items-center"
                    >
                      {/* Glowing Aura */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#E6E6FA]/30 to-[#4B0082]/30 rounded-xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
                      
                      {/* Floating Envelope */}
                      <div className="relative w-full aspect-video bg-gradient-to-br from-[#4B0082] to-[#2d004d] rounded-lg shadow-xl border border-white/10 flex items-center justify-center overflow-hidden animate-float-slow" style={{ animationDelay: `${index * 0.2}s` }}>
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5 border-b border-white/10" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
                        <Heart className="text-[#FFD700]/70 group-hover:text-[#FFD700] transition-colors z-10" size={32} />
                      </div>
                      
                      <span className="mt-4 font-sans font-medium text-[#FAFAFF] text-sm md:text-base tracking-wide text-center drop-shadow-md group-hover:text-[#FFD700] transition-colors">
                        From {note.sender}
                      </span>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="open-note"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="relative w-full max-w-2xl paper-texture p-8 md:p-12 rounded-xl shadow-[0_0_50px_rgba(75,0,130,0.5)] border border-[#E6E6FA]/30">
                  <div className="absolute -top-4 -left-4 text-[#FFD700] opacity-50">
                    <Heart size={48} fill="currentColor" />
                  </div>
                  
                  <div className="relative z-10">
                    <p className="font-display italic text-2xl md:text-3xl text-[#2d004d] leading-relaxed mb-12">
                      "{selectedNote.message}"
                    </p>
                    
                    <div className="text-right border-t border-[#4B0082]/10 pt-6">
                      <span className="block font-sans text-sm text-[#4B0082]/60 uppercase tracking-widest mb-1">With love,</span>
                      <span className="font-display font-bold text-3xl text-[#4B0082]">{selectedNote.sender}</span>
                    </div>
                  </div>
                  
                  <div className="mt-12 flex justify-center">
                    <button 
                      onClick={() => setSelectedNote(null)}
                      className="px-8 py-3 bg-[#4B0082]/10 hover:bg-[#4B0082]/20 text-[#4B0082] rounded-full font-sans font-medium uppercase tracking-widest text-sm transition-colors border border-[#4B0082]/20"
                    >
                      Back to Letters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
