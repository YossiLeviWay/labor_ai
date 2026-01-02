import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, doc, updateDoc, arrayUnion, setDoc, getDocs, deleteDoc, arrayRemove
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Plus, Search, Star, ChevronRight, LogOut, MessageSquare, 
  School, User, GraduationCap, Calendar, Info, CheckCircle2, XCircle, FileText,
  Settings, Database, Upload, Heart, Edit, Trash2, LayoutDashboard, Bookmark, List, ShieldAlert, MapPin
} from 'lucide-react';

// --- הגדרות FIREBASE ---
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

const Header = ({ setView, user }) => (
  <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-30">
    <div className="container mx-auto px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('dashboard')}>
         <div className="bg-white p-1 rounded-md h-10 flex items-center">
            <img src="120_labor.png" alt="לוגו" className="h-8" onError={(e) => e.target.src="https://www.gov.il/BlobFolder/office/labor/he/labor_logo.png"} />
         </div>
         <h1 className="text-lg font-bold hidden sm:block">מאגר ספקים רגשיים</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end ml-4 text-[10px] opacity-80">
          <span className="font-bold text-blue-200">שלום, {user?.name}</span>
          <span>{user?.isAdmin ? 'מצב מנהל מערכת' : `סמל מוסד: ${user?.id}`}</span>
        </div>
        {user?.isAdmin && (
          <button onClick={() => setView('admin-settings')} className="p-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors" title="ניהול מוסדות">
            <Settings size={18} />
          </button>
        )}
        <button onClick={() => setView('my-workspace')} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors">
          <LayoutDashboard size={16} />
          <span className="hidden md:inline">אזור אישי</span>
        </button>
        <button onClick={() => setView('login')} className="flex items-center gap-2 bg-blue-800 hover:bg-red-600 px-4 py-2 rounded-lg text-sm transition-colors">
          <LogOut size={16} />
          יציאה
        </button>
      </div>
    </div>
  </header>
);

const LoginPage = ({ loginData, setLoginData, handleLogin, error }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
    <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <img src="120_labor.png" alt="לוגו" className="h-24" onError={(e) => e.target.src="https://www.gov.il/BlobFolder/office/labor/he/labor_logo.png"} />
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">מאגר תכניות רגשיות</h1>
        <p className="text-slate-500 font-medium">משרד העבודה - הכשרה מקצועית</p>
      </div>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-xs font-bold border border-red-100">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input required className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="סמל מוסד" value={loginData.semel} onChange={e => setLoginData({...loginData, semel: e.target.value})} />
        <input required type="password" className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="סיסמה" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
        <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">התחברות למערכת</button>
      </form>
    </div>
  </div>
);

const AdminSettingsPanel = ({ setIsAdminMode, schools, importText, setImportText, handleImportExcel, handleDeleteSchool, editingSchool, setEditingSchool, db, appId, setView }) => (
  <div className="min-h-screen bg-slate-50 pb-20" dir="rtl">
    <header className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-40">
      <h1 className="font-bold flex items-center gap-2"><Settings size={20}/> ניהול מוסדות במערכת</h1>
      <button onClick={() => setView('dashboard')} className="text-sm bg-slate-800 px-4 py-2 rounded-lg">חזרה למאגר</button>
    </header>
    <main className="container mx-auto p-6 max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-800"><Upload size={18}/> ייבוא מהיר מאקסל</h3>
          <p className="text-xs text-slate-500 mb-4 font-medium">העתק שורות מהאקסל (שם המוסד, סמל מוסד, סיסמה) והדבק כאן:</p>
          <textarea 
            className="w-full h-48 p-3 border rounded-xl mb-4 font-mono text-xs bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="בית ספר א	12345	pass123&#10;בית ספר ב	67890	pass456"
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
          <button onClick={handleImportExcel} disabled={!importText} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all">ייבוא מוסדות</button>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold flex items-center gap-2"><School size={18} className="text-blue-800"/> רשימת מוסדות ({schools.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                <tr>
                  <th className="p-4">שם המוסד</th>
                  <th className="p-4">סמל מוסד</th>
                  <th className="p-4">סיסמה</th>
                  <th className="p-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {schools.map(s => (
                  <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{s.name}</td>
                    <td className="p-4 text-slate-600 font-mono">{s.semel}</td>
                    <td className="p-4 text-slate-400 font-mono">{s.password}</td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => setEditingSchool(s)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors" title="ערוך"><Edit size={18}/></button>
                      <button onClick={() => handleDeleteSchool(s.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors" title="מחק"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingSchool && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">עריכת מוסד</h2>
            <div className="space-y-4">
              <input className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none" defaultValue={editingSchool.name} id="edit_name" />
              <input className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none" defaultValue={editingSchool.password} id="edit_pass" />
              <div className="flex gap-3 pt-6">
                <button onClick={async () => {
                   const n = document.getElementById('edit_name').value;
                   const p = document.getElementById('edit_pass').value;
                   await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schools', editingSchool.id), { name: n, password: p });
                   setEditingSchool(null);
                }} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold">שמור</button>
                <button onClick={() => setEditingSchool(null)} className="flex-1 border-2 py-4 rounded-2xl font-bold">ביטול</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  </div>
);

const MyWorkspace = ({ setView, user, programs, savedProgramIds, toggleFavorite, setSelectedProgram }) => {
  const myUploads = programs.filter(p => p.schoolId === user?.id);
  const savedPrograms = programs.filter(p => savedProgramIds.includes(p.id));

  return (
    <div className="min-h-screen bg-slate-50 pb-12" dir="rtl">
      <Header setView={setView} user={user} />
      <main className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-800">האזור האישי שלי</h2>
          <p className="text-slate-500">{user?.name} | ניהול תכניות ומעקב</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-800"><List size={20}/> תכניות שהעליתי ({myUploads.length})</h3>
            <div className="space-y-4">
              {myUploads.map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-blue-100">
                  <div>
                    <h4 className="font-bold text-slate-800">{p.name}</h4>
                    <p className="text-xs text-slate-400">{p.createdAt}</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => { setSelectedProgram(p); setView('details'); }} className="p-2 text-blue-600 bg-white rounded-full shadow-sm hover:scale-110 transition-transform"><ChevronRight size={18}/></button>
                  </div>
                </div>
              ))}
              {myUploads.length === 0 && <p className="text-center text-slate-400 py-8 italic">עדיין לא העלית תכניות למאגר</p>}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-rose-600"><Bookmark size={20}/> תכניות במעקב ({savedPrograms.length})</h3>
            <div className="space-y-4">
              {savedPrograms.map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-rose-50/30 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-rose-100">
                  <div>
                    <h4 className="font-bold text-slate-800">{p.name}</h4>
                    <p className="text-[10px] text-slate-400">ספק: {p.schoolName}</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={(e) => toggleFavorite(e, p.id)} className="p-2 text-rose-600 bg-white rounded-full shadow-sm hover:scale-110 transition-transform"><Heart size={16} fill="currentColor"/></button>
                     <button onClick={() => { setSelectedProgram(p); setView('details'); }} className="p-2 text-blue-600 bg-white rounded-full shadow-sm hover:scale-110 transition-transform"><ChevronRight size={18}/></button>
                  </div>
                </div>
              ))}
              {savedPrograms.length === 0 && <p className="text-center text-slate-400 py-8 italic">אין תכניות שסימנת למעקב</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Dashboard = ({ setView, filters, setFilters, filteredPrograms, toggleFavorite, savedProgramIds, setSelectedProgram, user, handleDeleteProgram }) => (
  <div className="min-h-screen bg-slate-50 pb-20" dir="rtl">
    <Header setView={setView} user={user} />
    <main className="container mx-auto px-6 p-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 mt-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">שלום, {user?.name}</h2>
          <p className="text-slate-500">בחר תכנית להתרשמות או הוסף המלצה חדשה למאגר</p>
        </div>
        <button onClick={() => setView('add')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg transition-transform hover:-translate-y-1">
          <Plus size={20} /> הוספת המלצה חדשה
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input type="text" placeholder="חיפוש לפי שם, ספק או תוכן..." className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
          
          <div className="w-full sm:w-auto">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 mr-1">מיקום גיאוגרפי</label>
            <select className="p-3 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 w-full" value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})}>
              <option value="all">כל הארץ</option>
              <option value="צפון">צפון</option>
              <option value="דרום">דרום</option>
              <option value="מרכז">מרכז</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 mr-1">שכבת גיל</label>
            <select className="p-3 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 w-full" value={filters.grade} onChange={e => setFilters({...filters, grade: e.target.value})}>
              <option value="all">כל השכבות</option>
              {['ט','י','יא','יב'].map(g => <option key={g} value={g}>כיתה {g}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-50 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">דירוג מינימלי:</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setFilters({...filters, minRating: star})} className="transition-transform hover:scale-110">
                  <Star size={16} fill={star <= filters.minRating ? "#f59e0b" : "none"} className={star <= filters.minRating ? "text-amber-500" : "text-slate-300"} />
                </button>
              ))}
              {filters.minRating > 0 && <button onClick={() => setFilters({...filters, minRating: 0})} className="text-[10px] text-blue-500 underline mr-2">איפוס</button>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">מינימום תגובות:</span>
            <input type="number" min="0" className="w-16 p-1 bg-slate-50 rounded-lg text-xs font-bold border-none outline-none" value={filters.minComments} onChange={e => setFilters({...filters, minComments: parseInt(e.target.value) || 0})} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer transition-colors hover:text-purple-600">
            <input type="checkbox" className="w-4 h-4 rounded text-purple-600 border-none bg-slate-100" checked={filters.zalashOnly} onChange={e => setFilters({...filters, zalashOnly: e.target.checked})} />
            <span className="text-xs font-bold">תכניות צל"ש בלבד</span>
          </label>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPrograms.map(p => (
          <div key={p.id} onClick={() => { setSelectedProgram(p); setView('details'); }} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all group cursor-pointer relative">
            <div className="absolute top-4 left-4 flex gap-2 z-10">
              <button 
                onClick={(e) => toggleFavorite(e, p.id)}
                className={`p-2 rounded-full transition-all ${savedProgramIds.includes(p.id) ? 'bg-rose-500 text-white' : 'bg-white/80 backdrop-blur shadow-sm text-slate-300 hover:text-rose-400'}`}
              >
                <Heart size={16} fill={savedProgramIds.includes(p.id) ? "currentColor" : "none"} />
              </button>
              {user?.isAdmin && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteProgram(p.id); }}
                  className="p-2 rounded-full bg-white/80 backdrop-blur shadow-sm text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className={`h-2 ${p.recommends ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-xl group-hover:text-blue-700 transition-colors">{p.name}</h3>
                <div className="flex text-amber-500 items-center gap-1">
                   <Star size={14} fill="currentColor" />
                   <span className="text-xs font-bold">{p.rating}</span>
                </div>
              </div>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed h-10">{p.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                    <MapPin size={10} /> {p.location || 'כל הארץ'}
                  </span>
                  {p.grades?.map(g => <span key={g} className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">כיתה {g}</span>)}
                  {p.isZalash && <span className="text-[10px] bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">צל"ש</span>}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1"><School size={12}/> {p.schoolName}</span>
                <span className="flex items-center gap-1"><MessageSquare size={12}/> {p.comments?.length || 0} תגובות</span>
              </div>
            </div>
          </div>
        ))}
        {filteredPrograms.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300">
            <Search size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl font-medium">לא נמצאו תכניות מתאימות לסינון</p>
          </div>
        )}
      </div>
    </main>
  </div>
);

const AddProgram = ({ setView, handleAddProgram, formData, setFormData }) => (
  <div className="min-h-screen bg-slate-50 pb-12" dir="rtl">
      <header className="bg-white border-b p-4 sticky top-0 z-30 flex items-center gap-4 shadow-sm">
          <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight size={24} /></button>
          <h1 className="text-xl font-bold">הוספת המלצה חדשה למערכת</h1>
      </header>
      <main className="container mx-auto p-4 max-w-3xl mt-10">
          <form onSubmit={handleAddProgram} className="bg-white p-10 rounded-3xl shadow-xl space-y-8 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-2">
                  <label className="block text-sm font-bold mb-2">שם התכנית / הספק *</label>
                  <input required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="למשל: עמותת חוסן - סדנת מנהיגות" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-700">מיקום גיאוגרפי *</label>
                  <select required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                    <option value="כל הארץ">כל הארץ</option>
                    <option value="צפון">צפון</option>
                    <option value="דרום">דרום</option>
                    <option value="מרכז">מרכז</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-700">דירוג הכללי</label>
                  <div className="flex gap-2 p-3 bg-slate-50 rounded-2xl justify-center">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setFormData({...formData, rating: s})}>
                        <Star size={24} fill={s <= formData.rating ? "#f59e0b" : "none"} className={s <= formData.rating ? "text-amber-500" : "text-slate-300"} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">מהות ותכני התכנית *</label>
                <textarea required rows="4" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="פרט כאן על התכנים..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold mb-4 uppercase text-slate-400">שכבות גיל מתאימות</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['ט', 'י', 'יא', 'יב'].map(grade => (
                        <label key={grade} className={`flex items-center justify-center gap-2 cursor-pointer py-3 rounded-2xl border-2 transition-all font-bold ${formData.grades.includes(grade) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}>
                            <input type="checkbox" className="hidden" checked={formData.grades.includes(grade)} onChange={e => {
                                const newGrades = e.target.checked ? [...formData.grades, grade] : formData.grades.filter(g => g !== grade);
                                setFormData({...formData, grades: newGrades});
                            }} /> כיתה {grade}
                        </label>
                    ))}
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer font-bold text-purple-700">
                    <input type="checkbox" className="w-5 h-5 rounded-md" checked={formData.isZalash} onChange={e => setFormData({...formData, isZalash: e.target.checked})} />
                    תכנית צל"ש
                  </label>
                  <div className="flex gap-4">
                     <button type="button" onClick={() => setFormData({...formData, recommends: true})} className={`px-4 py-2 rounded-xl font-bold transition-all ${formData.recommends ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'}`}>ממליץ</button>
                     <button type="button" onClick={() => setFormData({...formData, recommends: false})} className={`px-4 py-2 rounded-xl font-bold transition-all ${!formData.recommends ? 'bg-rose-500 text-white' : 'bg-white text-slate-400'}`}>לא ממליץ</button>
                  </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-3xl shadow-xl transition-all active:scale-95 text-lg">שמירה ופרסום המלצה במערכת</button>
          </form>
      </main>
  </div>
);

const ProgramDetails = ({ selectedProgram, setView, addComment, user, removeComment }) => (
  <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="bg-white border-b p-4 sticky top-0 z-30 shadow-sm flex items-center gap-4">
          <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight size={24} /></button>
          <h1 className="text-xl font-bold">{selectedProgram.name}</h1>
      </header>
      <main className="container mx-auto p-4 max-w-5xl mt-10">
          <div className="bg-white p-10 rounded-3xl shadow-xl space-y-8 border relative overflow-hidden">
              <div className={`absolute top-0 right-0 left-0 h-2 ${selectedProgram.recommends ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                     <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${selectedProgram.recommends ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                       {selectedProgram.recommends ? 'ספק מומלץ' : 'לא מומלץ'}
                     </span>
                     {selectedProgram.isZalash && <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">תכנית צל"ש</span>}
                     <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><MapPin size={14}/> {selectedProgram.location || 'כל הארץ'}</span>
                  </div>
                  <h2 className="text-4xl font-black text-slate-800">{selectedProgram.name}</h2>
                  <p className="text-xl leading-relaxed text-slate-600">{selectedProgram.description}</p>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-3xl w-full md:w-64 border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                     <Star className="text-amber-500" fill="currentColor" size={20}/>
                     <span className="font-bold text-2xl">{selectedProgram.rating}.0</span>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">דווח על ידי</p>
                    <p className="font-bold text-blue-900 leading-tight">{selectedProgram.schoolName}</p>
                    <p className="text-xs text-slate-500">סמל {selectedProgram.schoolId}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-10">
                  <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-800">
                    <MessageSquare className="text-blue-600" size={24}/>
                    תגובות בתי הספר ({selectedProgram.comments?.length || 0})
                  </h3>
                  <div className="space-y-4 mb-10">
                      {selectedProgram.comments?.map((c, i) => (
                          <div key={i} className="bg-slate-50 p-5 rounded-2xl border-r-4 border-blue-600 shadow-sm flex justify-between items-start">
                              <div className="flex-1 ml-4">
                                <div className="font-black text-blue-900 text-xs mb-1 uppercase">{c.school}</div>
                                <p className="text-slate-700">{c.text}</p>
                              </div>
                              {user?.isAdmin && (
                                <button onClick={() => removeComment(selectedProgram.id, c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="מחק תגובה">
                                  <Trash2 size={16} />
                                </button>
                              )}
                          </div>
                      ))}
                  </div>
                  <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-inner">
                      <label className="block text-sm font-bold text-blue-900 mb-4 tracking-wide">הוסף חוות דעת של המוסד שלכם:</label>
                      <div className="flex flex-col gap-4">
                          <textarea id="newComment" className="w-full p-4 bg-white border border-blue-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] shadow-sm" placeholder="כתבו כאן..." />
                          <button onClick={() => {
                              const val = document.getElementById('newComment').value;
                              if(val) { addComment(selectedProgram.id, val); document.getElementById('newComment').value = ''; }
                          }} className="self-end bg-blue-700 hover:bg-blue-800 text-white px-10 py-4 rounded-xl font-black shadow-md transition-all active:scale-95">פרסם תגובה</button>
                      </div>
                  </div>
              </div>
          </div>
      </main>
  </div>
);

const Footer = () => (
  <footer className="w-full bg-slate-100 text-slate-400 py-12 mt-12 text-center border-t">
     <div className="h-px w-24 bg-slate-300 mx-auto mb-6"></div>
     <p className="text-xs font-medium uppercase tracking-widest mb-1">האפליקציה נוצרה על ידי</p>
     <p className="font-black text-slate-600 text-xl tracking-tighter">תיכון עתיד עוצמ״ה זוקו</p>
     <div className="mt-4 flex justify-center gap-4 opacity-40 grayscale">
        <img src="120_labor.png" className="h-10" onError={(e) => e.target.style.display='none'} />
     </div>
  </footer>
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

  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [schools, setSchools] = useState([]);
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
    search: '', 
    grade: 'all', 
    zalashOnly: false, 
    location: 'all', 
    minRating: 0, 
    minComments: 0 
  });

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error(err); }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsubscribePrograms = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'programs'), (snap) => {
      setPrograms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    const unsubscribeSchools = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'schools'), (snap) => {
      setSchools(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubscribePrograms(); unsubscribeSchools(); };
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    const favCol = collection(db, 'artifacts', appId, 'users', user.id, 'favorites');
    const unsubscribe = onSnapshot(favCol, (snap) => {
      setSavedProgramIds(snap.docs.map(doc => doc.id));
    });
    return () => unsubscribe();
  }, [user]);

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
    } else { setError("פרטי התחברות שגויים"); }
  };

  const toggleFavorite = async (e, programId) => {
    e.stopPropagation();
    if (!user) return;
    const favDoc = doc(db, 'artifacts', appId, 'users', user.id, 'favorites', programId);
    if (savedProgramIds.includes(programId)) {
      await deleteDoc(favDoc);
    } else {
      await setDoc(favDoc, { savedAt: Date.now() });
    }
  };

  const handleImportExcel = async () => {
    try {
      const rows = importText.split('\n').filter(r => r.trim());
      setLoading(true);
      for (const row of rows) {
        const [name, semel, password] = row.split(/\t|,/);
        if (name && semel && password) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schools', semel.trim()), {
            name: name.trim(),
            semel: semel.trim(),
            password: password.trim()
          });
        }
      }
      alert("ייבוא הסתיים בהצלחה");
      setImportText("");
    } catch (err) { alert("שגיאה בפורמט. וודא שהעתקת עמודות שם, סמל וסיסמה."); }
    setLoading(false);
  };

  const handleDeleteSchool = async (id) => {
    if (window.confirm("בטוח שברצונך למחוק מוסד זה?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schools', id));
    }
  };

  const handleDeleteProgram = async (id) => {
    if (window.confirm("בטוח שברצונך למחוק תכנית זו לצמיתות?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'programs', id));
    }
  };

  const removeComment = async (programId, commentId) => {
    if (!window.confirm("בטוח שברצונך למחוק תגובה זו?")) return;
    try {
      const progRef = doc(db, 'artifacts', appId, 'public', 'data', 'programs', programId);
      const program = programs.find(p => p.id === programId);
      const updatedComments = program.comments.filter(c => c.id !== commentId);
      await updateDoc(progRef, { comments: updatedComments });
      if (selectedProgram) {
        setSelectedProgram({ ...selectedProgram, comments: updatedComments });
      }
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

  const addComment = async (programId, text) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'programs', programId), {
      comments: arrayUnion({ id: Date.now(), school: user.name, text })
    });
    const prog = programs.find(p => p.id === programId);
    setSelectedProgram({ ...prog, comments: [...(prog.comments || []), { id: Date.now(), school: user.name, text }] });
  };

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(filters.search.toLowerCase()) || p.description?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesGrade = filters.grade === 'all' || p.grades?.includes(filters.grade);
      const matchesZalash = !filters.zalashOnly || p.isZalash;
      const matchesLocation = filters.location === 'all' || p.location === filters.location;
      const matchesRating = p.rating >= filters.minRating;
      const matchesComments = (p.comments?.length || 0) >= filters.minComments;

      return matchesSearch && matchesGrade && matchesZalash && matchesLocation && matchesRating && matchesComments;
    });
  }, [programs, filters]);

  return (
    <div className="font-sans antialiased text-slate-900 selection:bg-blue-100 overflow-x-hidden">
      {view === 'admin-settings' && (
        <AdminSettingsPanel 
          setView={setView} 
          schools={schools} 
          importText={importText} 
          setImportText={setImportText} 
          handleImportExcel={handleImportExcel} 
          handleDeleteSchool={handleDeleteSchool} 
          editingSchool={editingSchool} 
          setEditingSchool={setEditingSchool} 
          db={db} 
          appId={appId} 
        />
      )}
      
      {view === 'login' && (
        <LoginPage 
          loginData={loginData} 
          setLoginData={setLoginData} 
          handleLogin={handleLogin} 
          error={error} 
        />
      )}
      
      {view === 'dashboard' && (
        <Dashboard 
          setView={setView} 
          filters={filters} 
          setFilters={setFilters} 
          filteredPrograms={filteredPrograms} 
          toggleFavorite={toggleFavorite} 
          savedProgramIds={savedProgramIds} 
          setSelectedProgram={setSelectedProgram} 
          user={user}
          handleDeleteProgram={handleDeleteProgram}
        />
      )}
      
      {view === 'add' && (
        <AddProgram 
          setView={setView} 
          handleAddProgram={handleAddProgram} 
          formData={formData} 
          setFormData={setFormData} 
        />
      )}
      
      {view === 'details' && (
        <ProgramDetails 
          selectedProgram={selectedProgram} 
          setView={setView} 
          addComment={addComment} 
          removeComment={removeComment}
          user={user} 
        />
      )}
      
      {view === 'my-workspace' && (
        <MyWorkspace 
          setView={setView} 
          user={user} 
          programs={programs} 
          savedProgramIds={savedProgramIds} 
          toggleFavorite={toggleFavorite} 
          setSelectedProgram={setSelectedProgram} 
        />
      )}
      
      {view !== 'login' && view !== 'admin-settings' && <Footer />}
    </div>
  );
};

export default App;