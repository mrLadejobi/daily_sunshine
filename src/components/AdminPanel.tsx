import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DailyNote } from '../types';
import { format } from 'date-fns';
import { Plus, Save, Trash2, Bell } from 'lucide-react';

export default function AdminPanel() {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [message, setMessage] = useState('');
  const [colorVibe, setColorVibe] = useState('#F3E5AB');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const q = query(collection(db, 'daily_notes'));
      const snapshot = await getDocs(q);
      const fetchedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyNote[];
      setNotes(fetchedNotes.sort((a, b) => b.id.localeCompare(a.id)));
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'daily_notes', date), {
        message,
        color_vibe: colorVibe,
        authorUid: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setMessage('');
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note. Ensure you are logged in as the admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async (noteId: string) => {
    try {
      setLoading(true);
      // Get all users' tokens
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const tokens: string[] = [];
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.fcmToken) {
          tokens.push(data.fcmToken);
        }
      });

      if (tokens.length === 0) {
        alert("No users have enabled notifications yet.");
        return;
      }

      // Call our backend API to send the notification
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: "New Daily Sunshine! ☀️",
          body: "Your room is ready for you today.",
          tokens
        })
      });

      const result = await response.json();
      if (result.success) {
        alert("Notification sent successfully!");
      } else {
        alert("Failed to send notification: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Error sending notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-[#fdfbf7] rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-[#e8e4d9] mt-10 paper-texture">
      <h1 className="text-5xl font-display mb-10 text-[#050505] tracking-tight uppercase">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
        <div className="md:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-[#050505] flex items-center gap-2 border-b border-[#050505]/10 pb-4">
            <Plus size={16} /> Draft New Letter
          </h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#050505]/60 mb-2">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full p-3 bg-transparent border border-[#050505]/20 rounded-none focus:border-[#050505] focus:ring-0 outline-none font-mono text-sm transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#050505]/60 mb-2">Message</label>
              <textarea 
                value={message} 
                onChange={e => setMessage(e.target.value)}
                rows={6}
                className="w-full p-4 bg-transparent border border-[#050505]/20 rounded-none focus:border-[#050505] focus:ring-0 outline-none font-sans text-base resize-none transition-colors"
                placeholder="Write something beautiful..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#050505]/60 mb-2">Room Vibe (Hex Color)</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  value={colorVibe} 
                  onChange={e => setColorVibe(e.target.value)}
                  className="h-12 w-12 cursor-pointer border-0 p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  value={colorVibe} 
                  onChange={e => setColorVibe(e.target.value)}
                  className="flex-1 p-3 bg-transparent border border-[#050505]/20 rounded-none focus:border-[#050505] focus:ring-0 outline-none uppercase font-mono text-sm transition-colors"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#050505] hover:bg-[#050505]/90 text-[#fdfbf7] font-bold uppercase tracking-widest text-xs py-4 px-4 rounded-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={16} /> {loading ? 'Sealing...' : 'Seal & Schedule'}
            </button>
          </form>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-[#050505] border-b border-[#050505]/10 pb-4">
            Scheduled Letters
          </h2>
          <div className="space-y-4 max-h-150 overflow-y-auto pr-4 custom-scrollbar">
            {notes.length === 0 ? (
              <p className="text-[#050505]/40 italic font-sans text-sm">The desk is empty. Write the first letter.</p>
            ) : (
              notes.map(note => (
                <div key={note.id} className="p-6 border border-[#050505]/10 bg-white/50 hover:bg-white transition-colors relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: note.color_vibe }}></div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#050505]">{note.id}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleNotify(note.id)}
                        disabled={loading}
                        className="text-[#050505]/40 hover:text-[#050505] transition-colors"
                        title="Send Push Notification"
                      >
                        <Bell size={16} />
                      </button>
                      <div className="w-6 h-6 rounded-full border border-[#050505]/10 shadow-sm" style={{ backgroundColor: note.color_vibe }} title={note.color_vibe}></div>
                    </div>
                  </div>
                  <p className="text-[#050505]/80 font-sans text-sm line-clamp-3 leading-relaxed">{note.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
