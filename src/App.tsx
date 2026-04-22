import React, { useState, useEffect } from 'react';
import { auth, db, messaging } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { format } from 'date-fns';
import { DailyNote } from './types';
import Room from './components/Room';
import AdminPanel from './components/AdminPanel';
import FriendLetterForm from './components/FriendLetterForm';
import { Sun } from 'lucide-react';

const ADMIN_EMAILS = ['oluwasaanumil@gmail.com', 'ayomikun1308@gmail.com'];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [todayNote, setTodayNote] = useState<DailyNote | null>(null);
  const [view, setView] = useState<'room' | 'admin'>('room');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [friendId, setFriendId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fId = params.get('friend');
    if (fId) {
      setFriendId(fId);
      setLoading(false);
    }
  }, []);

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
        requestNotificationPermission(currentUser.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const requestNotificationPermission = async (uid: string) => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const msg = await messaging();
        if (msg) {
          const vapidKey = import.meta.env.VITE_VAPID_KEY;
          if (!vapidKey) {
            console.warn("VITE_VAPID_KEY is missing. Cannot get FCM token.");
            return;
          }
          const currentToken = await getToken(msg, { vapidKey });
          if (currentToken) {
            // Save token to user's document
            await setDoc(doc(db, 'users', uid), { 
              fcmToken: currentToken,
              lastUpdated: new Date()
            }, { merge: true });
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4B0082] to-[#2d004d]">
        <div className="animate-spin text-[#FFD700]">
          <Sun size={48} />
        </div>
      </div>
    );
  }

  const today = new Date();
  const isBirthday = today.getMonth() === 3 && today.getDate() === 23;

  if (friendId) {
    return <FriendLetterForm friendId={friendId} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4B0082] via-[#2d004d] to-[#1a002b] text-[#FAFAFF] p-4 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 paper-texture mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,230,250,0.1)_0%,transparent_100%)]"></div>
        
        <div className="relative z-10 text-center flex flex-col items-center animate-float">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-tight text-[#FAFAFF] drop-shadow-[0_0_15px_rgba(230,230,250,0.3)]">
            {isBirthday ? 'Happy Birthday!' : 'Daily Sunshine'}
          </h1>
          <p className="font-sans font-light mt-6 mb-12 text-sm md:text-lg text-[#E6E6FA] tracking-wide">
            {isBirthday ? 'A very special room, just for you today.' : 'A magical space, just for you.'}
          </p>
          <button 
            onClick={handleSignIn}
            className="group relative inline-flex items-center justify-center gap-3 glass-panel text-[#FAFAFF] font-sans font-medium tracking-widest text-sm py-4 px-8 rounded-full overflow-hidden transition-all hover:scale-105 hover:bg-white/20 hover:shadow-[0_0_20px_rgba(230,230,250,0.4)]"
          >
            <span className="relative z-10 flex items-center gap-3">
              <svg className="w-5 h-5 text-[#FFD700]" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Enter the Room
            </span>
          </button>

          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="mt-8 text-[#E6E6FA]/70 font-sans font-light tracking-wider text-xs border-b border-[#E6E6FA]/30 pb-1 hover:text-[#E6E6FA] hover:border-[#E6E6FA] transition-all"
            >
              Save to Homescreen
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFF]">
      {user.email && ADMIN_EMAILS.includes(user.email) && (
        <div className="fixed bottom-4 right-4 z-50 flex gap-2 opacity-30 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setView('admin')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors border border-white/20 ${view === 'admin' ? 'bg-[#4B0082] text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
          >
            Admin
          </button>
          <button 
            onClick={() => {
              setView('room');
              fetchTodayNote();
            }}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors border border-white/20 ${view === 'room' ? 'bg-[#4B0082] text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
          >
            Room
          </button>
        </div>
      )}

      {view === 'admin' ? (
        <div className="pt-8 pb-8 px-4 bg-[#FAFAFF] min-h-screen">
          <div className="max-w-4xl mx-auto flex justify-end mb-4">
            <button onClick={handleSignOut} className="text-gray-500 hover:text-[#4B0082] transition-colors flex items-center gap-2 font-sans text-sm font-medium">
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
