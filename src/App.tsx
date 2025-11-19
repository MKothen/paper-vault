// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { BookOpen, Trash2, Plus, LogOut, ExternalLink, Loader2 } from 'lucide-react';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {user ? <Dashboard user={user} /> : <Login />}
    </div>
  );
}

function Login() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md mx-4">
        <div className="bg-indigo-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="text-indigo-600" size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">PaperVault</h1>
        <p className="text-gray-500 mb-8">Visually organize your research papers.</p>
        <button 
          onClick={signInWithGoogle}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 w-full"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  const [papers, setPapers] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newLink, setNewLink] = useState("");

  // Real-time database listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "papers"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const papersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setPapers(papersData);
    });
    return () => unsubscribe();
  }, [user]);

  const addPaper = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    await addDoc(collection(db, "papers"), {
      uid: user.uid,
      title: newTitle,
      link: newLink,
      status: "To Read",
      createdAt: new Date()
    });
    setNewTitle("");
    setNewLink("");
  };

  const movePaper = async (id, currentStatus) => {
    const nextStatus = currentStatus === "To Read" ? "Reading" : currentStatus === "Reading" ? "Done" : "To Read";
    await updateDoc(doc(db, "papers", id), { status: nextStatus });
  };

  const deletePaper = async (id) => {
    if(confirm("Are you sure you want to delete this paper?")) {
        await deleteDoc(doc(db, "papers", id));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="text-indigo-600" /> PaperVault
        </h1>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
          <span className="text-sm text-gray-600 hidden md:block font-medium">{user.displayName}</span>
          <button onClick={logout} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-600" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Add Paper Form */}
      <form onSubmit={addPaper} className="bg-white p-4 rounded-xl shadow-sm mb-8 flex gap-3 flex-col md:flex-row border border-gray-200">
        <input 
          value={newTitle} 
          onChange={(e) => setNewTitle(e.target.value)} 
          placeholder="Paper Title (e.g. Attention is All You Need)" 
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input 
          value={newLink} 
          onChange={(e) => setNewLink(e.target.value)} 
          placeholder="Link to PDF (optional)" 
          className="flex-grow md:flex-grow-0 md:w-1/3 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium shadow-sm transition-colors">
          <Plus size={20} /> Add Paper
        </button>
      </form>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Column title="To Read" status="To Read" papers={papers} onMove={movePaper} onDelete={deletePaper} color="border-yellow-400 bg-yellow-50/50" badge="bg-yellow-100 text-yellow-800" />
        <Column title="Reading" status="Reading" papers={papers} onMove={movePaper} onDelete={deletePaper} color="border-blue-400 bg-blue-50/50" badge="bg-blue-100 text-blue-800" />
        <Column title="Done" status="Done" papers={papers} onMove={movePaper} onDelete={deletePaper} color="border-green-400 bg-green-50/50" badge="bg-green-100 text-green-800" />
      </div>
    </div>
  );
}

function Column({ title, status, papers, onMove, onDelete, color, badge }) {
  const filteredPapers = papers.filter(p => p.status === status);

  return (
    <div className={`p-4 rounded-2xl border-t-4 ${color} bg-white shadow-sm min-h-[300px]`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-700">{title}</h2>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge}`}>{filteredPapers.length}</span>
      </div>
      
      <div className="space-y-3">
        {filteredPapers.map(paper => (
          <div key={paper.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group">
            <h3 className="font-semibold text-gray-800 mb-2 leading-snug">{paper.title}</h3>
            
            {paper.link && (
              <a href={paper.link} target="_blank" rel="noreferrer" className="text-indigo-500 text-xs flex items-center gap-1 mb-4 hover:underline w-fit">
                <ExternalLink size={12} /> Open Source
              </a>
            )}
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
              <button 
                onClick={() => onMove(paper.id, status)}
                className="text-xs font-medium px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
              >
                {status === 'Done' ? 'Restart' : 'Move Next →'}
              </button>
              <button onClick={() => onDelete(paper.id)} className="text-gray-400 hover:text-red-500 transition p-1">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filteredPapers.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-100 rounded-lg">
                No papers
            </div>
        )}
      </div>
    </div>
  );
}

export default App;