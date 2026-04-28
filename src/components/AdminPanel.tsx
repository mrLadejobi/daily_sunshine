import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DailyNote } from '../types';
import { format } from 'date-fns';
import { Plus, Save, Trash2, Bell, Edit2, X, CheckCircle2, AlertCircle, Link, Copy } from 'lucide-react';

export default function AdminPanel() {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [message, setMessage] = useState('');
  const [colorVibe, setColorVibe] = useState('#F3E5AB');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'friends'>('daily');
  
  const [friendName, setFriendName] = useState('');
  const [friendLinks, setFriendLinks] = useState<any[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchNotes();
    fetchFriendLinks();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

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

  const fetchFriendLinks = async () => {
    try {
      const q = query(collection(db, 'friend_notes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriendLinks(links);
    } catch (error) {
      console.error("Error fetching friend links:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'daily_notes', date), {
          message,
          color_vibe: colorVibe
        });
        showToast("Letter updated successfully!", "success");
      } else {
        await setDoc(doc(db, 'daily_notes', date), {
          message,
          color_vibe: colorVibe,
          authorUid: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        showToast("Letter scheduled successfully!", "success");
      }
      setMessage('');
      setIsEditing(false);
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      showToast("Failed to save letter. Ensure you are logged in as the admin.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'friend_notes'), {
        sender: friendName.trim(),
        message: '',
        isSubmitted: false,
        createdAt: serverTimestamp()
      });
      showToast("Link generated!", "success");
      setFriendName('');
      fetchFriendLinks();
    } catch (error) {
      console.error("Error generating link:", error);
      showToast("Failed to generate link.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFriendLink = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'friend_notes', id));
      showToast("Link deleted successfully!", "success");
      fetchFriendLinks();
    } catch (error) {
      console.error("Error deleting link:", error);
      showToast("Failed to delete link.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/?friend=${id}`;
    navigator.clipboard.writeText(url);
    showToast("Link copied to clipboard!", "success");
  };

  const handleEdit = (note: DailyNote) => {
    setDate(note.id);
    setMessage(note.message);
    setColorVibe(note.color_vibe);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'daily_notes', noteToDelete));
      showToast("Letter deleted successfully!", "success");
      fetchNotes();
      if (isEditing && date === noteToDelete) {
        setIsEditing(false);
        setMessage('');
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      showToast("Failed to delete letter.", "error");
    } finally {
      setLoading(false);
      setNoteToDelete(null);
    }
  };

  const handleNotify = async (noteId: string) => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const tokens: string[] = [];
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.fcmToken) {
          tokens.push(data.fcmToken);
        }
      });

      if (tokens.length === 0) {
        showToast("No users have enabled notifications yet.", "error");
        return;
      }

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
        showToast("Notification sent successfully!", "success");
      } else {
        showToast("Failed to send notification: " + (result.error || "Unknown error"), "error");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      showToast("Error sending notification.", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setMessage('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 bg-[#FAFAFF] rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-[#E6E6FA] mt-4 md:mt-10 paper-texture relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-sm shadow-lg border animate-in slide-in-from-top-5 fade-in duration-300 ${
          toast.type === 'success' ? 'bg-[#FAFAFF] border-[#4B0082]/20 text-[#4B0082]' : 'bg-[#ffefef] border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-red-600" />}
          <p className="font-sans text-sm font-medium">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}

      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4B0082]/20 backdrop-blur-sm p-4">
          <div className="bg-[#FAFAFF] border border-[#4B0082]/10 p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-display uppercase tracking-tight mb-4 text-[#4B0082]">Delete Letter?</h3>
            <p className="text-[#4B0082]/70 font-sans text-sm mb-8">
              Are you sure you want to delete the letter for <span className="font-bold">{noteToDelete}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setNoteToDelete(null)}
                className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#4B0082]/60 hover:text-[#4B0082] transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-6 py-3 text-xs font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Letter'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-10 gap-4 sm:gap-0">
        <h1 className="text-3xl md:text-5xl font-display text-[#4B0082] tracking-tight uppercase">Dashboard</h1>
        <div className="flex gap-4 border-b border-[#4B0082]/20 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1">
          <button 
            onClick={() => setActiveTab('daily')}
            className={`pb-2 px-4 font-sans font-bold uppercase tracking-widest text-xs transition-colors ${activeTab === 'daily' ? 'text-[#4B0082] border-b-2 border-[#4B0082]' : 'text-[#4B0082]/50 hover:text-[#4B0082]'}`}
          >
            Daily Letters
          </button>
          <button 
            onClick={() => setActiveTab('friends')}
            className={`pb-2 px-4 font-sans font-bold uppercase tracking-widest text-xs transition-colors ${activeTab === 'friends' ? 'text-[#4B0082] border-b-2 border-[#4B0082]' : 'text-[#4B0082]/50 hover:text-[#4B0082]'}`}
          >
            Friends' Links
          </button>
        </div>
      </div>
      
      {activeTab === 'daily' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="md:col-span-2">
            <div className="flex justify-between items-center border-b border-[#4B0082]/10 pb-4 mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#4B0082] flex items-center gap-2">
                {isEditing ? <><Edit2 size={16} /> Edit Letter</> : <><Plus size={16} /> Draft New Letter</>}
              </h2>
              {isEditing && (
                <button onClick={cancelEdit} className="text-xs font-bold uppercase tracking-widest text-[#4B0082]/50 hover:text-[#4B0082] transition-colors">
                  Cancel
                </button>
              )}
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#4B0082]/60 mb-2">Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  disabled={isEditing}
                  className="w-full p-3 bg-transparent border border-[#4B0082]/20 rounded-none focus:border-[#4B0082] focus:ring-0 outline-none font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#4B0082]/60 mb-2">Message</label>
                <textarea 
                  value={message} 
                  onChange={e => setMessage(e.target.value)}
                  rows={6}
                  className="w-full p-4 bg-transparent border border-[#4B0082]/20 rounded-none focus:border-[#4B0082] focus:ring-0 outline-none font-sans text-base resize-none transition-colors"
                  placeholder="Write something beautiful..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#4B0082]/60 mb-2">Room Vibe (Hex Color)</label>
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
                    className="flex-1 p-3 bg-transparent border border-[#4B0082]/20 rounded-none focus:border-[#4B0082] focus:ring-0 outline-none uppercase font-mono text-sm transition-colors"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#4B0082] hover:bg-[#4B0082]/90 text-[#fdfbf7] font-bold uppercase tracking-widest text-xs py-4 px-4 rounded-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={16} /> {loading ? 'Saving...' : (isEditing ? 'Update Letter' : 'Seal & Schedule')}
              </button>
            </form>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-[#4B0082] border-b border-[#4B0082]/10 pb-4">
              Scheduled Letters
            </h2>
            <div className="space-y-4 max-h-150 overflow-y-auto pr-4 custom-scrollbar">
              {notes.length === 0 ? (
                <p className="text-[#4B0082]/40 italic font-sans text-sm">The desk is empty. Write the first letter.</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} className={`p-6 border ${isEditing && date === note.id ? 'border-[#4B0082] bg-white' : 'border-[#4B0082]/10 bg-white/50'} hover:bg-white transition-colors relative group`}>
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: note.color_vibe }}></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2 sm:gap-0">
                      <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#4B0082]">{note.id}</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleNotify(note.id)}
                          disabled={loading}
                          className="text-[#4B0082]/40 hover:text-[#4B0082] transition-colors"
                          title="Send Push Notification"
                        >
                          <Bell size={16} />
                        </button>
                        <button 
                          onClick={() => handleEdit(note)}
                          disabled={loading}
                          className="text-[#4B0082]/40 hover:text-[#4B0082] transition-colors"
                          title="Edit Letter"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setNoteToDelete(note.id)}
                          disabled={loading}
                          className="text-[#4B0082]/40 hover:text-red-600 transition-colors"
                          title="Delete Letter"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="w-6 h-6 rounded-full border border-[#4B0082]/10 shadow-sm ml-2" style={{ backgroundColor: note.color_vibe }} title={note.color_vibe}></div>
                      </div>
                    </div>
                    <p className="text-[#4B0082]/80 font-sans text-sm line-clamp-3 leading-relaxed">{note.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="md:col-span-2">
            <div className="flex justify-between items-center border-b border-[#4B0082]/10 pb-4 mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#4B0082] flex items-center gap-2">
                <Link size={16} /> Generate Link
              </h2>
            </div>
            <form onSubmit={handleGenerateLink} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#4B0082]/60 mb-2">Friend's Name</label>
                <input 
                  type="text" 
                  value={friendName} 
                  onChange={e => setFriendName(e.target.value)}
                  className="w-full p-3 bg-transparent border border-[#4B0082]/20 rounded-none focus:border-[#4B0082] focus:ring-0 outline-none font-sans text-base transition-colors"
                  placeholder="e.g. Sarah"
                  required
                />
                <p className="mt-2 text-xs text-[#4B0082]/60 font-sans">
                  This generates a unique, secret link for them to write a message for the birthday.
                </p>
              </div>
              <button 
                type="submit" 
                disabled={loading || !friendName.trim()}
                className="w-full bg-[#4B0082] hover:bg-[#4B0082]/90 text-[#fdfbf7] font-bold uppercase tracking-widest text-xs py-4 px-4 rounded-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus size={16} /> {loading ? 'Generating...' : 'Create Secret Link'}
              </button>
            </form>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-[#4B0082] border-b border-[#4B0082]/10 pb-4">
              Generated Links ({friendLinks.length})
            </h2>
            <div className="space-y-4 max-h-150 overflow-y-auto pr-4 custom-scrollbar">
              {friendLinks.length === 0 ? (
                <p className="text-[#4B0082]/40 italic font-sans text-sm">No links generated yet.</p>
              ) : (
                friendLinks.map(link => (
                  <div key={link.id} className="p-6 border border-[#4B0082]/10 bg-white/50 hover:bg-white transition-colors relative group">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3 sm:gap-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-display text-xl text-[#4B0082]">{link.sender}</span>
                        {link.isSubmitted ? (
                          <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Submitted</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Pending</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => copyToClipboard(link.id)}
                          className="text-[#4B0082]/40 hover:text-[#4B0082] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
                          title="Copy Link"
                        >
                          <Copy size={16} /> Copy
                        </button>
                        <button 
                          onClick={() => handleDeleteFriendLink(link.id)}
                          disabled={loading}
                          className="text-[#4B0082]/40 hover:text-red-600 transition-colors ml-2"
                          title="Delete Link"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {link.isSubmitted && link.message && (
                      <p className="text-[#4B0082]/80 font-sans text-sm line-clamp-2 italic border-l-2 border-[#4B0082]/20 pl-3 mt-3">
                        "{link.message}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

