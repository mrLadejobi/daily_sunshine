import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { DailyNote } from './types';
import Room from './components/Room';
import AdminPanel from './components/AdminPanel';
import { Sun } from 'lucide-react';

const ADMIN_EMAILS = ['oluwasaanumil@gmail.com', 'ayomikun1308@gmail.com'];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [todayNote, setTodayNote] = useState<DailyNote | null>(null);
  const [view, setView] = useState<'room' | 'admin'>('room');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.email && ADMIN_EMAILS.includes(currentUser.email)) {
          setView('admin');
        } else {
          setView('room');
        }
        await fetchTodayNote();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchTodayNote = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      const docRef = doc(db, 'daily_notes', today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTodayNote({ id: docSnap.id, ...docSnap.data() } as DailyNote);
      } else {
        setTodayNote(null);
      }
    } catch (error) {
      console.error("Error fetching today's note:", error);
    }
  };

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in:", error);
      alert("Failed to sign in.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FF6321]">
        <div className="animate-spin text-[#050505]">
          <Sun size={48} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FF6321] text-[#050505] p-4 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 paper-texture mix-blend-overlay"></div>
        <div className="relative z-10 text-center flex flex-col items-center">
          <h1 className="font-display text-[22vw] md:text-[18vw] leading-[0.82] tracking-[-0.03em] uppercase text-[#050505] mix-blend-overlay opacity-90 transform skew-x-[-5deg]">
            Daily<br/>Sunshine
          </h1>
          <p className="font-sans font-bold mt-8 mb-12 text-sm md:text-base text-[#050505]/80 uppercase tracking-[0.2em]">
            A cozy room waiting for you
          </p>
          <button 
            onClick={handleSignIn}
            className="group relative inline-flex items-center justify-center gap-3 bg-[#050505] text-[#fdfbf7] font-sans font-bold uppercase tracking-widest text-sm py-4 px-8 rounded-full overflow-hidden transition-transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-[#fdfbf7] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative z-10 group-hover:text-[#050505] transition-colors duration-300 flex items-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </span>
          </button>

          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="mt-6 text-[#050505] font-sans font-bold uppercase tracking-widest text-xs border-b border-[#050505] pb-1 hover:opacity-70 transition-opacity"
            >
              Install App to Homescreen
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {user.email && ADMIN_EMAILS.includes(user.email) && (
        <div className="fixed top-4 left-4 z-50 flex gap-2">
          <button 
            onClick={() => setView('admin')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors border border-[#050505] ${view === 'admin' ? 'bg-[#050505] text-[#fdfbf7]' : 'bg-transparent text-[#050505] hover:bg-[#050505]/10'}`}
          >
            Admin Panel
          </button>
          <button 
            onClick={() => {
              setView('room');
              fetchTodayNote();
            }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors border border-[#050505] ${view === 'room' ? 'bg-[#050505] text-[#fdfbf7]' : 'bg-transparent text-[#050505] hover:bg-[#050505]/10'}`}
          >
            View Room
          </button>
        </div>
      )}

      {view === 'admin' ? (
        <div className="pt-16 pb-8 px-4">
          <div className="max-w-4xl mx-auto flex justify-end mb-4">
            <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-800 flex items-center gap-2">
              Sign Out
            </button>
          </div>
          <AdminPanel />
        </div>
      ) : (
        <Room note={todayNote} onSignOut={handleSignOut} />
      )}
    </div>
  );
}
