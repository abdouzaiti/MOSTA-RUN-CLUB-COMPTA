import React, { useState, useEffect } from 'react';
import { Run, Runner } from '../types';
import { translations, Language } from '../translations';
import { Calendar, Map, CheckCircle2, Shield, Bell, Sparkles, Globe } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  runs: Run[];
  currentUser: Runner;
  onLogout?: () => void;
  language: Language;
  setLanguage?: (lang: Language) => void;
}

export default function Header({ 
  activeTab, 
  setActiveTab, 
  runs, 
  currentUser, 
  onLogout, 
  language,
  setLanguage
}: HeaderProps) {
  const [countdownStr, setCountdownStr] = useState<string>('');

  // Calculate next run countdown
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const upcoming = runs
        .filter(r => !r.completed)
        .map(r => new Date(`${r.date}T${r.time}`))
        .filter(d => d > now)
        .sort((a, b) => a.getTime() - b.getTime());

      if (upcoming.length === 0) {
        setCountdownStr(language === 'ar' ? 'لا يوجد جري مبرمج' : language === 'en' ? 'No runs planned' : 'Aucun run de planifié');
        return;
      }

      const nextRun = upcoming[0];
      const diffMs = nextRun.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHrs > 24) {
        setCountdownStr(`${Math.floor(diffHrs / 24)} ${language === 'ar' ? 'أيام' : language === 'en' ? 'days' : 'jours'}`);
      } else if (diffHrs > 0) {
        setCountdownStr(`${diffHrs}h ${diffMins}min`);
      } else {
        setCountdownStr(`${diffMins} min 🔥`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [runs, language]);

  const upcomingCount = runs.filter(r => !r.completed).length;
  const completedCount = runs.filter(r => r.completed).length;

  // Split name for initials
  const initials = currentUser.name
    ? currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'ZA';

  const isRtl = language === 'ar';

  return (
    <div className={`w-full bg-white rounded-[2rem] p-4.5 border border-blue-50/50 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden ${isRtl ? 'md:flex-row-reverse' : ''}`}>
      
      {/* City skyline decoration lines - inline SVG to render natively and matches perfectly! */}
      <div className={`absolute bottom-0 opacity-10 pointer-events-none select-none h-16 w-1/3 text-blue-900 ${isRtl ? 'left-0' : 'right-0'}`}>
        <svg viewBox="0 0 300 100" className="w-full h-full object-cover" preserveAspectRatio="none">
          <path fill="currentColor" d="M 0 100 L 10 70 L 15 70 L 25 100 L 30 100 L 40 40 L 45 40 L 55 100 L 60 100 L 70 80 L 80 100 L 90 50 L 100 50 L 110 100 L 120 100 L 132 85 L 140 100 L 150 30 L 160 30 L 175 100 L 190 75 L 205 100 L 210 60 L 220 60 L 235 100 L 250 82 L 265 L 265 100 L 280 45 L 290 100 Z" />
          <circle cx="155" cy="15" r="4" fill="currentColor" />
        </svg>
      </div>

      {/* Slogan and big titles block */}
      <div className="flex items-center gap-3.5 select-none md:flex-row flex-col text-center md:text-left">
        {/* Simple elegant inline round logo */}
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-blue-100 shadow-xs shrink-0 transform rotate-3 overflow-hidden p-1">
          <img src="/logo.png" alt="Mosta Run Club Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>

        <div>
          <div className={`flex items-center gap-2 flex-wrap justify-center md:justify-start ${isRtl ? 'flex-row-reverse' : ''}`}>
            <h1 className="text-2xl md:text-3xl font-serif italic font-black text-[#1034A6] tracking-tight">
              Mosta Run Club
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#1034A6] px-3 py-1 rounded-full border border-blue-200 shadow-3xs cursor-default">
              POSTAGANG N°27
            </span>
          </div>
          <p className={`text-slate-500 text-xs md:text-sm mt-1 font-medium select-text flex items-center gap-1.5 justify-center md:justify-start ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span>L-khardt, tkair w l-javasa t3-shat ⭐</span>
          </p>
        </div>
      </div>

      {/* Right blocks profile & statistics metrics details */}
      <div className={`flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
        
        {/* Interactive profile badge */}
        <div className={`p-2 pl-3 bg-blue-50/50 hover:bg-blue-50 rounded-2xl border border-blue-100/40 flex items-center gap-3 select-none transition min-w-[180px] w-full sm:w-auto justify-between sm:justify-start ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="font-bold text-xs text-slate-800 truncate pr-2" title={currentUser.name}>
              {currentUser.name}
            </h4>
            <div className={`flex items-center gap-1 text-[9px] uppercase font-bold text-[#2F89FC] font-mono mt-0.5 ${isRtl ? 'justify-end' : ''}`}>
              <Shield className="w-2.5 h-2.5" />
              <span>{currentUser.runClubRole || 'Membre'}</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black tracking-tighter shrink-0 border border-blue-400 shadow-sm overflow-hidden">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              initials
            )}
          </div>
        </div>

        {/* Quick Information Cards */}
        <div className={`flex items-center gap-2.5 w-full sm:w-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
          
          {/* Card: Prochain Run */}
          <div className="p-2 px-3.5 bg-[#F8FAFC] rounded-2xl border border-slate-200/60 text-center flex-1 sm:flex-none min-w-[110px] sm:min-w-[125px]">
            <span className="text-slate-400 text-[8px] sm:text-[9px] block uppercase font-mono font-bold tracking-wider leading-none">
              {isRtl ? 'الخرجة المقبلة' : 'PROCHAIN RUN'}
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold text-[#1034A6] mt-1.5 block leading-none truncate" title={countdownStr}>
              📅 {countdownStr}
            </span>
          </div>

          {/* Card: Sorties Club */}
          <div className="p-2 px-3.5 bg-[#F8FAFC] rounded-2xl border border-slate-200/60 text-center flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px]">
            <span className="text-slate-400 text-[8px] sm:text-[9px] block uppercase font-mono font-bold tracking-wider leading-none">
              {isRtl ? 'خرجات النادي' : 'SORTIES CLUB'}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-700 mt-1.5 block leading-none">
              <span className="text-blue-600 font-extrabold">{upcomingCount}</span> <span className="text-slate-400 font-medium text-[9px]">{isRtl ? 'مبرمجة' : 'planifiées'}</span>
              <span className="mx-1 text-slate-300">|</span>
              <span className="text-[#1034A6] font-extrabold">{completedCount}</span> <span className="text-slate-400 font-medium text-[9px]">{isRtl ? 'منتهية' : 'terminées'}</span>
            </span>
          </div>
        </div>

        {/* Global selector: Change languages */}
        {setLanguage && (
          <button 
            onClick={() => setLanguage(language === 'ar' ? 'fr' : language === 'fr' ? 'en' : 'ar')}
            className="hidden sm:flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-2.5 py-2.5 text-xs font-bold text-slate-500 cursor-pointer shadow-3xs"
            title="Changer de langue / Change Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="uppercase text-[10px]">{language}</span>
          </button>
        )}
      </div>
    </div>
  );
}
