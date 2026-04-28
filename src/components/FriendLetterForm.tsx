import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, Heart, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FriendLetterFormProps {
  friendId: string;
}

export default function FriendLetterForm({ friendId }: FriendLetterFormProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [friendData, setFriendData] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchFriendData = async () => {
      try {
        const docRef = doc(db, 'friend_notes', friendId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFriendData(data);
          if (data.isSubmitted) {
            setSubmitted(true);
          }
        } else {
          setError('Invalid or expired link. Please ask for a new one.');
        }
      } catch (err) {
        setError('Error loading the letter. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFriendData();
  }, [friendId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    
    try {
      const docRef = doc(db, 'friend_notes', friendId);
      await updateDoc(docRef, {
        message: message.trim(),
        isSubmitted: true
      });
      setSubmitted(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4B0082', '#E6E6FA', '#FFD700']
      });
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4B0082] to-[#2d004d]">
        <Loader2 className="animate-spin text-[#FFD700]" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4B0082] to-[#2d004d] p-4 text-center">
        <div className="paper-texture p-8 rounded-xl max-w-md w-full">
          <Heart className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-display text-[#4B0082] mb-2">Oops!</h2>
          <p className="text-[#4B0082]/70 font-sans">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4B0082] to-[#2d004d] p-4 text-center">
        <div className="paper-texture p-12 rounded-xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-500">
          <Heart className="mx-auto text-[#FFD700] mb-6 animate-pulse" size={64} fill="currentColor" />
          <h2 className="text-4xl font-display text-[#4B0082] mb-4">Thank You, {friendData?.sender}!</h2>
          <p className="text-[#4B0082]/80 font-sans text-lg">
            Your beautiful message has been sealed and placed in her room. She will read it on her special day!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4B0082] via-[#2d004d] to-[#1a002b] text-[#FAFAFF] p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 paper-texture mix-blend-overlay"></div>
      
      <div className="relative z-10 w-full max-w-2xl animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#FFD700] mb-4 drop-shadow-md">A Message for Hephzibah</h1>
          <p className="font-sans text-lg md:text-xl text-[#E6E6FA]/90">
            Hi {friendData?.sender}! Write your special birthday message below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="paper-texture p-5 sm:p-6 md:p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#E6E6FA]/20 relative">
          <div className="absolute -top-6 right-8 text-[#FFD700] opacity-80 animate-float-slow">
            <Heart size={48} className="w-8 h-8 sm:w-12 sm:h-12" fill="currentColor" />
          </div>

          <textarea 
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={10}
            className="w-full bg-transparent border-0 border-b-2 border-[#4B0082]/20 focus:border-[#4B0082] outline-none font-display text-xl md:text-2xl text-[#2d004d] resize-none leading-relaxed placeholder:text-[#4B0082]/30"
            placeholder="Dear Bestie..."
            required
            autoFocus
          />

          <div className="mt-12 text-right">
            <span className="block font-sans text-sm text-[#4B0082]/60 uppercase tracking-widest mb-2">With love,</span>
            <span className="font-display font-bold text-2xl md:text-3xl text-[#4B0082]">{friendData?.sender}</span>
          </div>

          <button 
            type="submit"
            disabled={submitting || !message.trim()}
            className="mt-12 w-full flex items-center justify-center gap-3 bg-[#4B0082] hover:bg-[#300055] text-white py-5 rounded-xl font-sans font-bold uppercase tracking-widest transition-all disabled:opacity-50 hover:shadow-lg hover:-translate-y-1"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {submitting ? 'Sealing envelope...' : 'Seal & Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
