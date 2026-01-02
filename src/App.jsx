import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, doc, updateDoc, arrayUnion, setDoc, getDocs, deleteDoc, arrayRemove, where
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Plus, Search, Star, ChevronRight, LogOut, MessageSquare, 
  School, User, GraduationCap, Calendar, Info, CheckCircle2, XCircle, FileText,
  Settings, Database, Upload, Heart, Edit, Trash2, LayoutDashboard, Bookmark, List, ShieldAlert, MapPin, ArrowRight, Bell, Clock, AlertCircle
} from 'lucide-react';

// --- הגדרות FIREBASE ---
// עליך להדביק כאן את ה-config שקיבלת מ-Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCe1kKepWLp8yzGf7A0hTiik3ww2dOl3U8",
  authDomain: "labor-emotional-apps-d4016.firebaseapp.com",
  projectId: "labor-emotional-apps-d4016",
  storageBucket: "labor-emotional-apps-d4016.firebasestorage.app",
  messagingSenderId: "466148209394",
  appId: "1:466148209394:web:2fbac969e9fa186c7f966b",
  measurementId: "G-KYHTYD41B8"
};


const isFirebaseSetup = firebaseConfig.apiKey && firebaseConfig.apiKey !== "";
let app, db, auth;

if (isFirebaseSetup) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

const appId = "labor-emotional-registry"; 

// --- תת-רכיבים (הוצאו מחוץ ל-App כדי למנוע איבוד פוקוס) ---

const LogoContainer = ({ className = "w-24 h-24" }) => (
  <div className={`${className} bg-white rounded-lg flex items-center justify-center p-2 shadow-sm border border-slate-100`}>
    <img src="120_labor.png" alt="לוגו" className="max-w-full max-h-full object-contain" 
      onError={(e) => { e.target.src = "https://www.gov.il/BlobFolder/office/labor/he/labor_logo.png"; }} />
  </div>
);

const Header = ({ setView, user, notifications = [] }) => {
  const [showNotifs, setShowNotifs] = useState(false);
  
  return (
    <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-30">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('dashboard')}>
           <div className="bg-white p-1 rounded-md h-10 flex items-center">
              <img src="120_labor.png" alt="לוגו" className="h-8" onError={(e) => e.target.src="https://www.gov.il/BlobFolder/office/labor/he/labor_logo.png"} />
           </div>
           <h1 className="text-lg font-bold hidden sm:block">מאגר ספקים רגשיים</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 hover:bg-blue-800 rounded-full transition-colors relative">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-blue-900 font-bold">
                  {notifications.length}
                </span>
              )}
            </button>
            
            {showNotifs && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 shadow-blue-900/20">
                <div className="p-3 border-b bg-slate-50 font-bold text-sm">התראות ועדכונים</div>
                <div className="max-h-64 overflow-y-auto text-right">
                  {notifications.length > 0 ? notifications.map((n, i) => (
                    <div key={i} className="p-3 text-xs border-b hover:bg-slate-50 transition-colors">
                      <div className="font-bold text-blue-800 mb-1 text-right">{n.title}</div>
                      <p className="text-slate-600 text-right">{n.text}</p>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-slate-400 italic text-xs">אין התראות חדשות</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:flex flex-col items-end ml-4 text-[10px] opacity-80 text-right">
            <span className="font-bold text-blue-200">שלום, {user?.name}</span>
            <span>{user?.isAdmin ? 'מנהל מערכת' : user?.isProvider ? 'ספק מאושר' : `סמל מוסד: ${user?.id}`}</span>
          </div>

          {user?.isAdmin && (
            <button onClick={() => setView('admin-settings')} className="p-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors relative" title="ניהול מערכת">
              <Settings size={18} />
            </button>
          )}
          
          {!user?.isProvider && !user?.isAdmin && (
            <button onClick={() => setView('my-workspace')} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors">
              <LayoutDashboard size={16} />
              <span className="hidden md:inline">אזור אישי</span>
            </button>
          )}

          <button onClick={() => setView('login')} className="flex items-center gap-2 bg-blue-800 hover:bg-red-600 px-4 py-2 rounded-lg text-sm transition-colors">
            <LogOut size={16} />
            יציאה
          </button>
        </div>
      </div>
    </header>
  );
};

const LoginPage = ({ loginData, setLoginData, handleLogin, error, setView }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
    <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
      <div className="flex flex-col items-center mb-8 text-center">
        <LogoContainer className="w-32 h-32 mb-6" />
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">מאגר תכניות רגשיות</h1>
        <p className="text-slate-500 font-medium">משרד העבודה - הכשרה מקצועית</p>
      </div>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-xs font-bold border border-red-100 flex items-center gap-2 text-right"><XCircle size={16}/> {error}</div>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-right" placeholder="סמל מוסד / מזהה ספק" value={loginData.semel} onChange={e => setLoginData({...loginData, semel: e.target.value})} />
        <input required type="password" className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-right" placeholder="סיסמה" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
        <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-5 rounded-2xl shadow-lg active:scale-95 transition-all text-lg">התחברות למערכת</button>
      </form>
      <div className="mt-10 text-center border-t border-slate-100 pt-8">
        <p className="text-sm text-slate-500 mb-4">מעוניינים להצטרף כספק תכנית?</p>
        <button onClick={() => setView('provider-register')} className="bg-slate-50 text-blue-600 font-bold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors border border-blue-100">הגשת בקשה להצטרפות למאגר</button>
      </div>
    </div>
  </div>
);

const ProviderRegister = ({ handleProviderApply, setView }) => {
  const [data, setData] = useState({ name: '', id: '', password: '', contact: '', description: '', location: 'כל הארץ' });
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200">
        <div className="mb-8 text-right">
           <h2 className="text-2xl font-black text-slate-800 mb-2">בקשת הצטרפות כספק</h2>
           <p className="text-slate-500 font-medium leading-relaxed text-right">אנא מלאו את הפרטים והתכנית שלכם. לאחר אישור המנהל, התכנית תפורסם אוטומטית במאגר.</p>
        </div>
        <form onSubmit={(e) => handleProviderApply(e, data)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1 mr-1 uppercase text-right">שם הספק / העמותה *</label>
              <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none text-right" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 mr-1 uppercase text-right">ח"פ / מזהה ייחודי (להתחברות) *</label>
              <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none text-right" value={data.id} onChange={e => setData({...data, id: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 mr-1 uppercase text-right">סיסמה מבוקשת *</label>
              <input required type="password" className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none text-right" value={data.password} onChange={e => setData({...data, password: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 mr-1 uppercase text-right">מיקום גיאוגרפי *</label>
            <select required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none text-right" value={data.location} onChange={e => setData({...data, location: e.target.value})}>
              <option value="כל הארץ">כל הארץ</option>
              <option value="צפון">צפון</option><option value="דרום">דרום</option><option value="מרכז">מרכז</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 mr-1 uppercase text-right">איש קשר וטלפון *</label>
            <input required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none text-right" value={data.contact} onChange={e => setData({...data, contact: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 mr-1 uppercase text-right text-blue-700 font-black">תיאור התכנית המוצעת (לפרסום במאגר) *</label>
            <textarea required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none h-32 text-right" value={data.description} onChange={e => setData({...data, description: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg">שלח בקשה לאישור מנהל</button>
          <button type="button" onClick={() => setView('login')} className="w-full text-slate-400 font-bold py-2">ביטול וחזרה</button>
        </form>
      </div>
    </div>
  );
};

const ProviderStatusPage = ({ provider, setView }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
    <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-200 text-center relative overflow-hidden">
      <div className={`absolute top-0 right-0 left-0 h-3 ${provider.status === 'approved' ? 'bg-emerald-500' : provider.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
      
      <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-8 ${
        provider.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
        provider.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
      }`}>
        {provider.status === 'pending' ? <Clock size={48}/> : provider.status === 'approved' ? <CheckCircle2 size={48}/> : <AlertCircle size={48}/>}
      </div>
      
      <h2 className="text-2xl font-black text-slate-800 mb-2">סטטוס: {
        provider.status === 'pending' ? 'בקשתך בהמתנה' : provider.status === 'approved' ? 'אושרת כספק!' : 'בקשתך נדחתה'
      }</h2>
      <p className="text-slate-500 font-medium mb-8">שלום {provider.name}, בקשת הצטרפותך נמצאת בבדיקת המערכת.</p>
      
      {provider.adminNote && (
        <div className="bg-slate-50 p-6 rounded-2xl border mb-8 text-right shadow-inner">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">הערת מנהל המערכת:</p>
          <p className="text-slate-800 text-sm font-medium italic">"{provider.adminNote}"</p>
        </div>
      )}

      {provider.status === 'approved' && (
        <button onClick={() => setView('dashboard')} className="w-full bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-xl mb-4 text-lg">כניסה למאגר</button>
      )}

      {provider.status === 'rejected' && (
        <button onClick={() => setView('provider-register')} className="w-full bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl mb-4 text-lg">הגשת בקשה מעודכנת</button>
      )}

      <button onClick={() => setView('login')} className="text-slate-400 font-bold py-2 uppercase text-[10px] tracking-widest">התנתקות</button>
    </div>
  </div>
);

// --- הרכיב הראשי (App) ---

const App = () => {
  if (!isFirebaseSetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">חסר קונפיגורציה של Firebase</h1>
          <p className="text-slate-600 mb-6">אנא הדבק את ה-config בתוך המשתנה firebaseConfig בקוד ב-Cursor.</p>
        </div>
      </div>
    );
  }

  // --- STATE ---
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [schools, setSchools] = useState([]);
  const [providers, setProviders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [savedProgramIds, setSavedProgramIds] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [loginData, setLoginData] = useState({ semel: '', password: '' });
  const [importText, setImportText] = useState("");
  const [editingSchool, setEditingSchool] = useState(null);

  const [formData, setFormData] = useState({
    name: '', contactPerson: '', description: '', rating: 5,
    recommends: true, notes: '', grades: [], isZalash: false, location: 'כל הארץ'
  });

  const [filters, setFilters] = useState({ 
    search: '', grade: 'all', zalashOnly: false, location: 'all', minRating: 0, minComments: 0 
  });

  // --- FIREBASE SYNC ---
  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (err) { console.error(err); } };
    initAuth();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsubP = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'programs'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrograms(data);
      setLoading(false);
    });
    const unsubS = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'schools'), (snap) => {
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(all.filter(s => !s.isProvider));
      setProviders(all.filter(s => s.isProvider));
    });
    return () => { unsubP(); unsubS(); };
  }, []);

  // Real-time update for Selected Program
  useEffect(() => {
    if (selectedProgram) {
      const updated = programs.find(p => p.id === selectedProgram.id);
      if (updated) setSelectedProgram(updated);
    }
  }, [programs]);

  useEffect(() => {
    if (!db || !user || user.isAdmin) return;
    const favCol = collection(db, 'artifacts', appId, 'users', user.id, 'favorites');
    const unsubscribe = onSnapshot(favCol, (snap) => {
      setSavedProgramIds(snap.docs.map(doc => doc.id));
    });
    return () => unsubscribe();
  }, [user]);

  // Notifications Logic
  useEffect(() => {
    if (!user || user.isAdmin) return;
    const myProgs = programs.filter(p => p.schoolId === user.id);
    const newNotifs = [];
    myProgs.forEach(p => {
      if (p.comments && p.comments.length > 0) {
        p.comments.slice(-3).forEach(c => {
          newNotifs.push({ title: `תגובה חדשה ל-${p.name}`, text: `${c.school}: ${c.text}` });
        });
      }
    });
    setNotifications(newNotifs);
  }, [programs, user]);

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    if (loginData.semel === "admin" && loginData.password === "1234") {
      setUser({ id: 'admin', name: 'מנהל מערכת', isAdmin: true });
      setView('dashboard');
      return;
    }
    const school = schools.find(s => String(s.semel) === String(loginData.semel) && String(s.password) === String(loginData.password));
    if (school) {
      setUser({ id: school.semel, name: school.name, isAdmin: false });
      setView('dashboard');
      return;
    }
    const provider = providers.find(p => String(p.semel) === String(loginData.semel) && String(p.password) === String(loginData.password));
    if (provider) {
      setUser({ ...provider, id: provider.semel, isAdmin: false, isProvider: true });
      if (provider.status === 'approved') setView('dashboard');
      else setView('provider-status');
      return;
    }
    setError("פרטי התחברות שגויים. נסה שנית.");
  };

  const handleProviderApply = async (e, data) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schools', data.id), {
        name: data.name,
        semel: data.id,
        password: data.password,
        contact: data.contact,
        description: data.description,
        location: data.location || 'כל הארץ',
        isProvider: true,
        status: 'pending',
        createdAt: Date.now(),
        initialProgram: {
          name: data.name,
          description: data.description,
          location: data.location || 'כל הארץ',
          grades: ['ט','י','יא','יב'],
          isZalash: false,
          rating: 5,
          recommends: true
        }
      });
      alert("הבקשה נשלחה בהצלחה וממתינה לאישור המנהל.");
      setView('login');
    } catch (err) { console.error(err); }
  };

  const handleApproveProvider = async (provider) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schools', provider.id), { 
        status: 'approved', adminNote: 'אושר ופורסם במאגר.' 
      });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'programs'), {
        ...provider.initialProgram,
        schoolId: provider.id,
        schoolName: provider.name,
        comments: [],
        createdAt: new Date().toLocaleDateString('he-IL'),
        timestamp: Date.now()
      });
      alert("הספק אושר והתכנית פורסמה בהצלחה.");
    } catch (err) { console.error(err); }
  };

  const handleRejectProvider = async (id, note) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schools', id), { status: 'rejected', adminNote: note });
    } catch (err) { console.error(err); }
  };

  const handleAddProgram = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'programs'), {
        ...formData,
        schoolId: user.id,
        schoolName: user.name,
        comments: [],
        createdAt: new Date().toLocaleDateString('he-IL'),
        timestamp: Date.now()
      });
      setView('dashboard');
      setFormData({ name: '', contactPerson: '', description: '', rating: 5, recommends: true, notes: '', grades: [], isZalash: false, location: 'כל הארץ' });
    } catch (err) { console.error(err); }
  };

  const handleDeleteProgram = async (id) => {
    if (window.confirm("בטוח שברצונך למחוק תכנית זו לצמיתות?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'programs', id));
    }
  };

  const toggleFavorite = async (e, programId) => {
    e.stopPropagation();
    if (!user || user.isAdmin) return;
    const favDoc = doc(db, 'artifacts', appId, 'users', user.id, 'favorites', programId);
    if (savedProgramIds.includes(programId)) {
      await deleteDoc(favDoc);
    } else {
      await setDoc(favDoc, { savedAt: Date.now() });
    }
  };

  const addComment = async (programId, text) => {
    // 15-minute rate limit check
    const now = Date.now();
    const fifteenMins = 15 * 60 * 1000;
    
    // Check all programs for any comment by this user in last 15 mins
    const recentComment = programs.some(p => 
      p.comments?.some(c => c.schoolId === user.id && (now - c.id) < fifteenMins)
    );

    if (recentComment && !user.isAdmin) {
      alert("ניתן לשלוח תגובה אחת כל 15 דקות. אנא המתינו.");
      return;
    }

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'programs', programId), {
      comments: arrayUnion({ 
        id: now, 
        school: user.name, 
        schoolId: user.id, 
        text 
      })
    });
  };

  const editComment = async (programId, commentId, newText) => {
    try {
      const progRef = doc(db, 'artifacts', appId, 'public', 'data', 'programs', programId);
      const program = programs.find(p => p.id === programId);
      const updatedComments = program.comments.map(c => 
        c.id === commentId ? { ...c, text: newText, edited: true } : c
      );
      await updateDoc(progRef, { comments: updatedComments });
    } catch (err) { console.error(err); }
  };

  const removeComment = async (programId, commentId) => {
    if (!window.confirm("בטוח שברצונך למחוק תגובה זו?")) return;
    try {
      const progRef = doc(db, 'artifacts', appId, 'public', 'data', 'programs', programId);
      const program = programs.find(p => p.id === programId);
      const updatedComments = program.comments.filter((c) => c.id !== commentId);
      await updateDoc(progRef, { comments: updatedComments });
    } catch (err) { console.error(err); }
  };

  const filteredPrograms = useMemo(() => {
    let list = programs;
    if (user?.isProvider) {
      list = list.filter(p => p.schoolId === user.id);
    }
    return list.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(filters.search.toLowerCase()) || p.description?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesGrade = filters.grade === 'all' || p.grades?.includes(filters.grade);
      const matchesZalash = !filters.zalashOnly || p.isZalash;
      const matchesLocation = filters.location === 'all' || p.location === filters.location;
      const matchesRating = p.rating >= filters.minRating;
      return matchesSearch && matchesGrade && matchesZalash && matchesLocation && matchesRating;
    });
  }, [programs, filters, user]);

  // --- RENDER SELECTION ---

  if (view === 'login') return <LoginPage loginData={loginData} setLoginData={setLoginData} handleLogin={handleLogin} error={error} setView={setView} />;
  if (view === 'provider-register') return <ProviderRegister handleProviderApply={handleProviderApply} setView={setView} />;
  if (view === 'provider-status') return <ProviderStatusPage provider={user} setView={setView} />;
  if (view === 'admin-settings') return (
    <AdminSettingsPanel 
      schools={schools} providers={providers} importText={importText} setImportText={setImportText} 
      handleImportExcel={() => {}} handleDeleteSchool={async (id) => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schools', id))} 
      editingSchool={editingSchool} setEditingSchool={setEditingSchool} db={db} appId={appId} setView={setView} 
      handleApproveProvider={handleApproveProvider} handleRejectProvider={handleRejectProvider}
    />
  );
  
  return (
    <div className="font-sans antialiased text-slate-900 selection:bg-blue-100 overflow-x-hidden" dir="rtl">
      {view === 'dashboard' && <Dashboard setView={setView} filters={filters} setFilters={setFilters} filteredPrograms={filteredPrograms} toggleFavorite={toggleFavorite} savedProgramIds={savedProgramIds} setSelectedProgram={(p) => { setSelectedProgram(p); setView('details'); }} user={user} handleDeleteProgram={handleDeleteProgram} notifications={notifications} />}
      {view === 'add' && <AddProgram setView={setView} handleAddProgram={handleAddProgram} formData={formData} setFormData={setFormData} user={user} />}
      {view === 'details' && selectedProgram && <ProgramDetails selectedProgram={selectedProgram} setView={setView} addComment={addComment} removeComment={removeComment} editComment={editComment} user={user} notifications={notifications} />}
      {view === 'my-workspace' && <MyWorkspace setView={setView} user={user} programs={programs} savedProgramIds={savedProgramIds} toggleFavorite={toggleFavorite} setSelectedProgram={(p) => { setSelectedProgram(p); setView('details'); }} notifications={notifications} />}
      <Footer />
    </div>
  );
};

// --- SUB-COMPONENTS ---

const AdminSettingsPanel = ({ schools, providers, importText, setImportText, handleImportExcel, handleDeleteSchool, setEditingSchool, editingSchool, db, appId, setView, handleApproveProvider, handleRejectProvider }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const pendingRequests = providers.filter(p => p.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50 pb-20" dir="rtl">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <h1 className="font-bold flex items-center gap-2 text-blue-400 tracking-tight"><ShieldAlert size={24}/> פאנל ניהול מערכת</h1>
          <nav className="flex gap-4 mr-6">
            <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-xl text-sm font-bold relative transition-all ${activeTab === 'requests' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              בקשות ספקים
              {pendingRequests.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 animate-bounce font-bold">{pendingRequests.length}</span>}
            </button>
            <button onClick={() => setActiveTab('schools')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'schools' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>ניהול מוסדות</button>
          </nav>
        </div>
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-sm bg-blue-800 hover:bg-blue-700 px-6 py-2 rounded-xl transition-all font-bold">חזרה למאגר <ArrowRight size={18} /></button>
      </header>

      <main className="container mx-auto p-8 max-w-7xl">
        {activeTab === 'requests' && (
          <div className="space-y-6">
             <h2 className="text-2xl font-black text-slate-800 text-right">בקשות ממתינות</h2>
             {pendingRequests.length === 0 && <div className="bg-white p-16 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200"><p className="text-slate-400 font-bold">אין בקשות חדשות כרגע</p></div>}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingRequests.map(p => (
                  <div key={p.id} className="bg-white p-8 rounded-[2rem] shadow-sm border text-right">
                    <h3 className="font-black text-xl text-slate-800 mb-1">{p.name}</h3>
                    <p className="text-blue-600 font-bold text-xs mb-4">מזהה ספק: {p.semel}</p>
                    <div className="bg-slate-50 p-5 rounded-2xl mb-6 text-sm italic text-slate-600">"{p.description}"</div>
                    <div className="flex gap-3">
                      <button onClick={() => handleApproveProvider(p)} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">אשר ופרסם</button>
                      <button onClick={() => { const note = prompt("סיבת הדחייה:"); if(note) handleRejectProvider(p.id, note); }} className="flex-1 border-2 border-slate-100 py-3 rounded-xl font-bold text-slate-400 hover:text-red-500">דחה</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
        {activeTab === 'schools' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border">
                   <h3 className="font-bold mb-4 flex items-center gap-2"><Upload size={18}/> ייבוא מאקסל</h3>
                   <textarea className="w-full h-40 p-4 bg-slate-50 rounded-xl mb-4 text-xs font-mono text-right" placeholder="שם מוסד	סמל	סיסמה" value={importText} onChange={e => setImportText(e.target.value)} />
                   <button onClick={() => alert("ייבוא בביצוע...")} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">ייבוא מוסדות</button>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
                   <table className="w-full text-right">
                      <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400">
                        <tr><th className="p-4">מוסד</th><th className="p-4">סמל</th><th className="p-4 text-center">פעולות</th></tr>
                      </thead>
                      <tbody className="divide-y text-sm">
                        {schools.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50"><td className="p-4 font-bold">{s.name}</td><td className="p-4 font-mono">{s.semel}</td><td className="p-4 flex justify-center gap-2"><button onClick={() => setEditingSchool(s)} className="p-2 text-blue-600"><Edit size={16}/></button><button onClick={() => handleDeleteSchool(s.id)} className="p-2 text-red-500"><Trash2 size={16}/></button></td></tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

const Dashboard = ({ setView, filters, setFilters, filteredPrograms, toggleFavorite, savedProgramIds, setSelectedProgram, user, handleDeleteProgram, notifications }) => (
  <div className="min-h-screen bg-slate-50 pb-20" dir="rtl">
    <Header setView={setView} user={user} notifications={notifications} />
    <main className="container mx-auto px-6 p-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 mt-10 text-right">
        <div>
          <h2 className="text-4xl font-black text-slate-800">שלום, {user?.name}</h2>
          <p className="text-slate-500 font-medium">{user?.isProvider ? 'התכניות שלך במערכת' : 'בחר תכנית להתרשמות או הוסף תכנית חדשה'}</p>
        </div>
        {!user?.isProvider && (
          <button onClick={() => setView('add')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-2xl font-black shadow-xl transition-transform hover:-translate-y-1 text-lg">
            <Plus size={24} /> הוספת תכנית חדשה
          </button>
        )}
      </div>

      {!user?.isProvider && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 mb-12 space-y-6 text-right">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
              <input type="text" placeholder="חיפוש חופשי..." className="w-full pr-14 pl-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-right font-medium" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
            </div>
            <select className="p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 min-w-[150px]" value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})}>
              <option value="all">כל הארץ</option>
              <option value="צפון">צפון</option><option value="דרום">דרום</option><option value="מרכז">מרכז</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-8 pt-6 border-t items-center justify-end">
            <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 px-6 py-3 rounded-full">
              <input type="checkbox" className="w-5 h-5 rounded-md text-purple-600" checked={filters.zalashOnly} onChange={e => setFilters({...filters, zalashOnly: e.target.checked})} />
              <span className="text-sm font-black text-slate-700">מתאים לתכנית צל"ש</span>
            </label>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredPrograms.map(p => (
          <div key={p.id} onClick={() => setSelectedProgram(p)} className="bg-white rounded-[2rem] shadow-sm border overflow-hidden hover:shadow-2xl transition-all group cursor-pointer relative text-right">
            <div className="absolute top-5 left-5 flex gap-2 z-10">
              {(!user?.isAdmin && !user?.isProvider) && (
                <button onClick={(e) => toggleFavorite(e, p.id)} className={`p-2.5 rounded-full transition-all ${savedProgramIds.includes(p.id) ? 'bg-rose-500 text-white' : 'bg-white/90 backdrop-blur shadow-sm text-slate-300 hover:text-rose-400'}`}>
                  <Heart size={18} fill={savedProgramIds.includes(p.id) ? "currentColor" : "none"} />
                </button>
              )}
              {user?.isAdmin && (
                <button onClick={(e) => { e.stopPropagation(); handleDeleteProgram(p.id); }} className="p-2.5 rounded-full bg-white/90 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
              )}
            </div>
            <div className={`h-2.5 ${p.recommends ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <div className="p-8">
              <h3 className="font-black text-2xl group-hover:text-blue-700 mb-4">{p.name}</h3>
              <p className="text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed h-15 font-medium">{p.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full font-black uppercase flex items-center gap-1"><MapPin size={12} /> {p.location || 'כל הארץ'}</span>
                  {p.isZalash && <span className="text-[10px] bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full font-black uppercase">צל"ש</span>}
              </div>
              <div className="flex justify-between items-center pt-6 border-t text-[10px] text-slate-400 font-black uppercase tracking-widest">
                <span>{p.schoolName}</span>
                <span>{p.comments?.length || 0} תגובות</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  </div>
);

const AddProgram = ({ setView, handleAddProgram, formData, setFormData, user }) => (
  <div className="min-h-screen bg-slate-50 pb-12" dir="rtl">
      <header className="bg-white border-b p-6 sticky top-0 z-30 flex items-center gap-4 shadow-sm">
          <button onClick={() => setView('dashboard')} className="p-3 hover:bg-slate-100 rounded-full"><ChevronRight size={28} /></button>
          <h1 className="text-2xl font-black text-slate-800">הוספת תכנית חדשה</h1>
      </header>
      <main className="container mx-auto p-4 max-w-4xl mt-12 text-right">
          <form onSubmit={handleAddProgram} className="bg-white p-12 rounded-[3rem] shadow-2xl space-y-10 text-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="col-span-2">
                  <label className="block text-sm font-black mb-3 text-slate-800">שם התכנית / הספק המבצע *</label>
                  <input required className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-xl text-right" placeholder="למשל: סדנת חוסן מנטלי" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-black mb-3 text-slate-800">מיקום גיאוגרפי *</label>
                  <select required className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black text-right" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                    <option value="כל הארץ">כל הארץ</option>
                    <option value="צפון">צפון</option><option value="דרום">דרום</option><option value="מרכז">מרכז</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black mb-3 text-slate-800">דירוג (1-5)</label>
                  <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl justify-center">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setFormData({...formData, rating: s})}><Star size={32} fill={s <= formData.rating ? "#f59e0b" : "none"} className={s <= formData.rating ? "text-amber-500" : "text-slate-200"} /></button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-black mb-3 text-slate-800">מהות ותכני התכנית (פירוט) *</label>
                <textarea required rows="5" className="w-full p-6 bg-slate-50 border-none rounded-3xl outline-none text-right font-medium" placeholder="פרט כאן על התכנים..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-700 text-white font-black py-6 rounded-3xl shadow-2xl text-xl">שמירה ופרסום התכנית במערכת</button>
          </form>
      </main>
  </div>
);

const ProgramDetails = ({ selectedProgram, setView, addComment, user, removeComment, editComment, notifications }) => {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const handleEdit = (c) => {
    setEditingId(c.id);
    setEditText(c.text);
  };

  const saveEdit = async () => {
    await editComment(selectedProgram.id, editingId, editText);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-right" dir="rtl">
        <Header setView={setView} user={user} notifications={notifications} />
        <main className="container mx-auto p-6 max-w-6xl mt-12">
            <div className="bg-white p-12 md:p-16 rounded-[3.5rem] shadow-2xl space-y-12 border relative overflow-hidden">
                <div className={`absolute top-0 right-0 left-0 h-3 ${selectedProgram.recommends ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <div className="flex flex-col lg:flex-row justify-between items-start gap-12 text-right">
                  <div className="flex-1 space-y-8">
                    <div className="flex flex-wrap items-center gap-4 justify-start">
                       {selectedProgram.isZalash && <span className="bg-purple-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase">תכנית צל"ש</span>}
                       <span className="text-sm font-black text-slate-400 flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full"><MapPin size={16}/> {selectedProgram.location}</span>
                    </div>
                    <h2 className="text-5xl font-black text-slate-800 leading-tight">{selectedProgram.name}</h2>
                    <p className="text-2xl leading-relaxed text-slate-600 font-medium">{selectedProgram.description}</p>
                  </div>
                  <div className="bg-slate-50 p-10 rounded-[2.5rem] w-full lg:w-80 border shadow-inner text-right">
                    <div className="flex items-center gap-3 justify-end"><span className="font-black text-4xl">{selectedProgram.rating}.0</span><Star className="text-amber-500" fill="currentColor" size={32}/></div>
                    <div className="pt-8 border-t text-right"><p className="text-[10px] font-black text-slate-400 uppercase">דווח על ידי</p><p className="font-black text-blue-900 text-xl">{selectedProgram.schoolName}</p></div>
                  </div>
                </div>
                <div className="border-t pt-16 text-right">
                    <h3 className="text-3xl font-black mb-10 flex items-center gap-4 text-slate-800 justify-start"><MessageSquare className="text-blue-600" size={32}/> תגובות ({selectedProgram.comments?.length || 0})</h3>
                    <div className="space-y-6 mb-16">
                        {selectedProgram.comments?.map((c, i) => (
                            <div key={c.id} className="bg-slate-50 p-8 rounded-[2rem] border-r-8 border-blue-600 flex justify-between items-start group">
                                <div className="flex-1 ml-6 text-right">
                                  <div className="font-black text-blue-900 text-sm mb-2">{c.school} {c.edited && <span className="text-[10px] text-slate-400 mr-2">(נערך)</span>}</div>
                                  {editingId === c.id ? (
                                    <div className="flex flex-col gap-3">
                                      <textarea className="w-full p-4 border rounded-xl" value={editText} onChange={e => setEditText(e.target.value)} />
                                      <div className="flex gap-2">
                                        <button onClick={saveEdit} className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm font-bold">שמור</button>
                                        <button onClick={() => setEditingId(null)} className="bg-slate-200 px-4 py-1 rounded-lg text-sm font-bold">ביטול</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-slate-700 text-lg">{c.text}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {c.schoolId === user.id && editingId !== c.id && (
                                    <button onClick={() => handleEdit(c)} className="p-2 text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={18}/></button>
                                  )}
                                  {(user?.isAdmin || c.schoolId === user.id) && (
                                    <button onClick={() => removeComment(selectedProgram.id, c.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={20} /></button>
                                  )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {!user?.isProvider && (
                      <div className="bg-blue-50/50 p-10 rounded-[3rem] border shadow-inner">
                          <textarea id="newComment" className="w-full p-6 bg-white border rounded-3xl outline-none text-right font-medium text-lg h-32 mb-6" placeholder="הוסיפו חוות דעת משלכם..." />
                          <button onClick={() => { const v = document.getElementById('newComment').value; if(v) { addComment(selectedProgram.id, v); document.getElementById('newComment').value=''; } }} className="bg-blue-700 text-white px-12 py-5 rounded-2xl font-black shadow-2xl">פרסם תגובה במאגר</button>
                      </div>
                    )}
                </div>
            </div>
        </main>
    </div>
  );
};

const MyWorkspace = ({ setView, user, programs, savedProgramIds, toggleFavorite, setSelectedProgram, notifications }) => {
  const myUploads = programs.filter(p => p.schoolId === user?.id);
  const savedPrograms = programs.filter(p => savedProgramIds.includes(p.id));

  return (
    <div className="min-h-screen bg-slate-50 pb-12" dir="rtl">
      <Header setView={setView} user={user} notifications={notifications} />
      <main className="container mx-auto p-8 max-w-6xl mt-10 text-right">
        <h2 className="text-4xl font-black text-slate-800 mb-2">אזור אישי</h2>
        <p className="text-slate-500 font-bold mb-12">{user?.name} | ניהול אישי</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white rounded-[2.5rem] shadow-sm border p-8">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-blue-800"><List size={24}/> תכניות שלי ({myUploads.length})</h3>
            {myUploads.map(p => (
              <div key={p.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl mb-4 cursor-pointer" onClick={() => setSelectedProgram(p)}>
                <div className="text-right"><h4 className="font-black text-lg">{p.name}</h4><p className="text-xs text-slate-400">{p.createdAt}</p></div>
                <ChevronRight className="text-blue-600"/>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-sm border p-8">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-rose-600"><Bookmark size={24}/> תכניות במעקב ({savedPrograms.length})</h3>
            {savedPrograms.map(p => (
              <div key={p.id} className="flex justify-between items-center p-6 bg-rose-50/30 rounded-3xl mb-4 cursor-pointer" onClick={() => setSelectedProgram(p)}>
                <div className="text-right"><h4 className="font-black text-lg">{p.name}</h4><p className="text-[10px] text-slate-400">מאת: {p.schoolName}</p></div>
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(e, p.id); }} className="p-2 text-rose-600"><Heart fill="currentColor"/></button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

const Footer = () => (
  <footer className="w-full bg-slate-100 text-slate-400 py-16 mt-20 text-center border-t">
     <p className="text-xs font-black uppercase tracking-widest mb-2 opacity-60">האפליקציה נוצרה על ידי</p>
     <p className="font-black text-slate-600 text-2xl tracking-tighter">תיכון עתיד עוצמ״ה זוקו</p>
  </footer>
);

export default App;