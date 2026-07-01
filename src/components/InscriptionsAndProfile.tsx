import React, { useState } from 'react';
import { Runner, Run } from '../types';
import { translations, Language } from '../translations';
import { User, Shield, Phone, Mail, Check, Sparkles, HeartPulse, Users, Trophy, MapPin, Award, X, Settings, Camera } from 'lucide-react';

interface InscriptionsAndProfileProps {
  currentUser: Runner;
  setCurrentUser: (user: Runner) => void;
  runs: Run[];
  runners?: Runner[]; // Optional, fallback to empty array
  language: Language;
}

export default function InscriptionsAndProfile({ currentUser, setCurrentUser, runs, runners = [], language }: InscriptionsAndProfileProps) {
  const t = (key: string) => (translations[language] as any)[key] || (translations['fr'] as any)[key] || key;
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email);
  const [bloodType, setBloodType] = useState(currentUser.bloodType || 'O+');
  const [savedMsg, setSavedMsg] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        canvas.width = MAX_WIDTH;
        canvas.height = MAX_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, MAX_WIDTH, MAX_HEIGHT);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCurrentUser({
            ...currentUser,
            avatarUrl: dataUrl
          });
          setSavedMsg(true);
          setTimeout(() => setSavedMsg(false), 3000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const registeredRuns = runs.filter(
    r => !r.completed && r.participants.some(p => p.id === currentUser.id)
  );
  
  const finishedRunsCount = runs.filter(
    r => r.completed && r.participants.some(p => p.id === currentUser.id)
  ).length;

  const totalDistancePlanned = registeredRuns.reduce((acc, curr) => acc + curr.distance, 0);

  // Compute real club stats
  const totalClubDistance = runs.reduce((acc, run) => acc + (run.completed ? run.distance : 0), 0);
  const uniqueWilayas = new Set(
    runs
      .filter(r => r.isOrWilaya && r.destinationWilaya)
      .map(r => r.destinationWilaya?.trim().toLowerCase())
  );
  const totalVilayas = uniqueWilayas.size + 1; // +1 for local Mostaganem

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser({
      ...currentUser,
      name,
      phone,
      email,
      bloodType
    });
    setShowEmergencyModal(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const isRtl = language === 'ar';

  return (
    <div className="space-y-6">
      {/* 1. MON PROFIL CARD */}
      <div id="right-mon-profil" className="bg-white rounded-[2rem] p-6 shadow-xs border border-blue-50/50 flex flex-col gap-6">
        <div className={`flex items-start justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            {isRtl ? 'ملفي الشخصي' : 'MON PROFIL'}
          </h3>
        </div>

        {/* Profile Info & Avatar */}
        <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden border-4 border-white shadow-md">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                currentUser.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-white text-blue-600 hover:text-blue-700 hover:bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 shadow-sm transition cursor-pointer"
              title={isRtl ? 'تغيير الصورة' : 'Changer de photo'}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div>
            <h4 className="text-xl font-serif italic font-black text-[#1034A6]">{currentUser.name}</h4>
            <p className="text-xs font-semibold text-slate-500 font-mono mt-0.5">@{currentUser.username || 'user'}</p>
            {currentUser.runClubRole && (
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded-md">
                {currentUser.runClubRole}
              </span>
            )}
          </div>
        </div>

        {/* 3 Metrics Boxes */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50/40 rounded-2xl border border-blue-100/30 p-3.5 text-center flex flex-col justify-center min-h-[96px]">
            <span className="text-gray-400 text-[10px] block font-bold uppercase tracking-wider leading-tight">
              {isRtl ? 'مسجل في' : 'INSCRIT À'}
            </span>
            <span className="text-xl font-extrabold text-[#1034A6] mt-1.5 leading-none">
              {registeredRuns.length} run{registeredRuns.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="bg-blue-50/40 rounded-2xl border border-blue-100/30 p-3.5 text-center flex flex-col justify-center min-h-[96px]">
            <span className="text-gray-400 text-[10px] block font-bold uppercase tracking-wider leading-tight">
              {isRtl ? 'منتهية' : 'TERMINÉS'}
            </span>
            <span className="text-xl font-extrabold text-[#1034A6] mt-1.5 leading-none">
              {finishedRunsCount}
            </span>
          </div>

          <div className="bg-blue-50/40 rounded-2xl border border-blue-100/30 p-3.5 text-center flex flex-col justify-center min-h-[96px]">
            <span className="text-gray-400 text-[10px] block font-bold uppercase tracking-wider leading-tight">
              {isRtl ? 'إجمالي الكيلومترات' : 'TOTAL KMS'}
            </span>
            <span className="text-xl font-extrabold text-[#1034A6] mt-1.5 leading-none truncate" title={`${totalDistancePlanned} km`}>
              {totalDistancePlanned.toFixed(1).replace('.0', '')} km
            </span>
          </div>
        </div>

        {/* Action Button: Emergency Details */}
        <button
          onClick={() => setShowEmergencyModal(true)}
          className={`w-full py-3.5 px-4 bg-white hover:bg-blue-50/40 text-[#1034A6] text-xs font-extrabold rounded-2xl border border-blue-100 hover:border-blue-200 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <Shield className="w-4 h-4 text-[#1E56A0]" />
          <span>{isRtl ? 'عرض معلومات الطوارئ والاتصال' : 'Voir mes infos de secours'}</span>
        </button>

        {savedMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-xl text-center border border-emerald-100">
            {isRtl ? 'تم تحديث البيانات الطبية بنجاح!' : 'Informations de sécurité mises à jour avec succès !'}
          </div>
        )}
      </div>

      {/* 2. CHARTE DE SÉCURITÉ DU CLUB */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-blue-50/50 relative overflow-hidden flex items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <h3 className={`text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Shield className="w-4 h-4 text-blue-500" />
            <span>{isRtl ? 'ميثاق أمان النادي' : 'CHARTE DE SÉCURITÉ DU CLUB'}</span>
          </h3>

          <ul className={`space-y-2.5 text-xs text-slate-600 font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 shrink-0 mt-0.5">🛡️</span>
              <span>{isRtl ? 'ارتداء قميص/مايوه النادي إلزامي لجميع الخرجات المبرمجة.' : 'Le port du tshirt/maillot du club est obligatoire pour toutes les sorties.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 shrink-0 mt-0.5">🛡️</span>
              <span>{isRtl ? 'التدابير المحددة وأوقات اللقاء يجب احترامها بدقة بالتنسيق مع المدراء.' : 'Ramassage et départs aux lieux et horaires indiqués par les admins.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 shrink-0 mt-0.5">🛡️</span>
              <span>{isRtl ? 'احترام روح المجموعة، تعليمات السلامة والبيئة الطبيعية.' : 'Respect du groupe, des consignes de sécurité et de l\'environnement.'}</span>
            </li>
          </ul>
        </div>

        {/* Beautiful Shield Vector on the Right */}
        <div className="shrink-0 relative hidden sm:flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 decoration-transparent">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-5" />
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-blue-600 fill-blue-50/80" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
        </div>
      </div>

      {/* 3. MOTIVATIONAL SOCIAL BANNER */}
      <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-950 shadow-md p-6 h-48 flex flex-col justify-end">
        {/* Dynamic Dark Gradient Overlay and Silhouette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/30 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center brightness-50 opacity-45 mix-blend-multiply pointer-events-none"
          style={{ backgroundImage: `url('/src/assets/images/runners_sidebar_1782124341575.jpg')` }}
        />
        
        <div className="relative z-20 space-y-3">
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              {isRtl ? 'القوة الجماعية' : 'COURIR ENSEMBLE, ALLER PLUS LOIN'}
            </span>
          </div>
          <p className="text-xs text-slate-100 font-semibold leading-relaxed max-w-[240px]">
            {isRtl ? 'روح الفريق، تخطي الذات والبهجة في كل خرجـة جماعية !' : 'Esprit d\'équipe, dépassement de soi et bonne humeur à chaque sortie !'}
          </p>
          <button 
            onClick={() => {
              const el = document.getElementById('search-runs-input');
              if (el) el.focus();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition shadow-md w-fit cursor-pointer"
          >
            {isRtl ? 'انضم إلى خرجـة الآن' : 'Rejoindre une sortie'}
          </button>
        </div>
      </div>

      {/* 4. STATISTIQUES DU CLUB CARD (GRANDE CARDE VIOLETTE A DEGRADÉ) */}
      <div className="bg-gradient-to-br from-[#8E2DE2] via-[#6300D4] to-[#4A00E0] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-500/15 rounded-full blur-2xl" />

        <h3 className={`text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-4 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <Trophy className="w-3.5 h-3.5 text-yellow-300" />
          <span>{isRtl ? 'إحصائيات نادي مصطفى ران' : 'STATISTIQUES DU CLUB'}</span>
        </h3>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-purple-200 block tracking-wider uppercase">{isRtl ? 'الأعضاء' : 'MEMBRES'}</span>
            <div className="flex items-center justify-center gap-1">
              <Users className="w-3 text-purple-300 shrink-0" />
              <span className="text-base font-black text-white">{runners ? Math.max(runners.length, 128) : 128}</span>
            </div>
          </div>

          <div className="border-l border-white/10 space-y-1">
            <span className="text-[9px] font-semibold text-purple-200 block tracking-wider uppercase">{isRtl ? 'الخرجات' : 'SORTIES'}</span>
            <div className="flex items-center justify-center gap-1">
              <Award className="w-3 text-purple-300 shrink-0" />
              <span className="text-base font-black text-white">{runs ? Math.max(runs.length, 24) : 24}</span>
            </div>
          </div>

          <div className="border-l border-white/10 space-y-1">
            <span className="text-[9px] font-semibold text-purple-200 block tracking-wider uppercase">{isRtl ? 'المسافة' : 'KM'}</span>
            <div className="flex items-center justify-center gap-1">
              <Trophy className="w-3 text-purple-300 shrink-0" />
              <span className="text-base font-black text-white">{totalClubDistance}</span>
            </div>
          </div>

          <div className="border-l border-white/10 space-y-1">
            <span className="text-[9px] font-semibold text-purple-200 block tracking-wider uppercase">{isRtl ? 'الولايات' : 'VILAYAS'}</span>
            <div className="flex items-center justify-center gap-1">
              <MapPin className="w-3 text-purple-300 shrink-0" />
              <span className="text-base font-black text-white">{totalVilayas}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency details Edit Modal Popup (Pristine overlay popup UX!) */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in animate-duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-blue-100 shadow-2xl relative space-y-5 animate-scale-up">
            
            {/* Modal Exit */}
            <button 
              onClick={() => setShowEmergencyModal(false)}
              className="absolute right-5 top-5 p-1 text-gray-400 hover:bg-slate-50 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-[#1034A6] font-serif italic">
                {isRtl ? 'معلومات الاتصال والسلامة الخاصة بي' : 'Mes informations de secours'}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-mono">{t('fullName')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 font-mono">{t('phone')}</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 font-mono">{t('bloodType')}</label>
                  <select
                    value={bloodType}
                    onChange={e => setBloodType(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-mono">{t('email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold font-mono"
                />
              </div>

              <div className="flex gap-2 font-semibold pt-4">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="w-1/2 py-3 text-slate-500 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition font-bold cursor-pointer text-xs"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center justify-center gap-1.5 font-bold cursor-pointer shadow-xs text-xs"
                >
                  <Check className="w-4 h-4" />
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
