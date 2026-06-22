import React, { useState, useEffect } from 'react';
import { Run, Runner } from '../types';
import { CalendarRange, Award, Users, TrendingUp, Sparkles, Activity, Clock, LogOut, ClipboardList } from 'lucide-react';
import { translations, Language } from '../translations';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  runs: Run[];
  currentUser: Runner;
  onLogout?: () => void;
  language: Language;
}

export default function Header({ activeTab, setActiveTab, runs, currentUser, onLogout, language }: HeaderProps) {
  const t = (key: string) => (translations[language] as any)[key] || (translations['fr'] as any)[key] || key;
  const [countdownStr, setCountdownStr] = useState<string>('');
  const [logoError, setLogoError] = useState<boolean>(false);

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
        setCountdownStr(`${language === 'ar' ? 'خلال' : 'Dans'} ${Math.floor(diffHrs / 24)} ${language === 'ar' ? 'أيام' : language === 'en' ? 'days' : 'jours'}`);
      } else if (diffHrs > 0) {
        setCountdownStr(`${language === 'ar' ? 'خلال' : 'Dans'} ${diffHrs}h ${diffMins}min`);
      } else {
        setCountdownStr(`${language === 'ar' ? 'خلال' : 'Dans'} ${diffMins} min 🔥`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [runs]);

  const upcomingCount = runs.filter(r => !r.completed).length;
  const completedCount = runs.filter(r => r.completed).length;

  return (
    <header className="relative w-full overflow-hidden bg-white text-natural-text rounded-3xl shadow-sm border border-natural-border">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-natural-olive/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-natural-accent/5 rounded-full blur-3xl -z-10" />

      {/* Top bar with active sportswear gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-natural-olive via-natural-accent to-natural-olive"></div>

      <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          {/* Logo & Slogan */}
          <div className="flex items-center gap-4">
            {!logoError ? (
              <div className="bg-white p-1 rounded-2xl border border-natural-border/60 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Mosta Run Club Logo"
                  className="h-14 w-14 md:h-16 md:w-16 object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="p-3 bg-natural-olive/10 text-natural-olive rounded-2xl border border-natural-olive/20 shadow-inner shrink-0">
                <Activity className="w-8 h-8 animate-pulse text-natural-olive" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-serif italic font-black tracking-tight text-natural-olive">
                  Mosta Run Club
                </h1>
                <span className="text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest bg-natural-sage-light text-natural-olive px-2.5 py-0.5 rounded border border-natural-border/60">
                  Mostaganem 27
                </span>
              </div>
              <p className="text-natural-sage text-xs md:text-sm mt-1 font-medium">
                L-khardjat, tkarir w l-ajwaa t3 s-shat 🏃‍♂️🇩🇿
              </p>
            </div>
          </div>
        </div>

        {/* Quick info / Dashboard metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-xl w-full md:w-auto">
          {/* Active User Badging */}
          <div className="col-span-2 lg:col-span-1 p-3 bg-natural-sage-light/60 rounded-2xl border border-natural-border flex items-center justify-between gap-2.5">
            <div className={`flex items-center gap-2.5 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-natural-olive text-white flex items-center justify-center text-sm font-bold font-serif italic border border-natural-border shadow-sm shrink-0">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-sm text-natural-text truncate max-w-[120px]" title={currentUser.name}>{currentUser.name}</p>
                <div className={`flex items-center gap-1.5 mt-0.5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[11px] px-1.5 py-0.5 bg-natural-accent/20 text-natural-olive font-mono font-bold rounded">
                    {currentUser.bloodType || 'O+'}
                  </span>
                  <span className="text-xs text-natural-sage font-bold uppercase tracking-wider truncate">
                    {currentUser.runClubRole === 'Admin' ? t('admin') : currentUser.runClubRole === 'Coach' ? t('coach') : t('member')}
                  </span>
                </div>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-red-700 hover:text-white hover:bg-red-600 bg-red-50 text-xs font-bold font-mono px-3 py-1.5 rounded-lg border border-red-200 transition cursor-pointer shrink-0 flex items-center gap-1"
                title={t('logout')}
              >
                <LogOut className="w-3 h-3" />
                {t('logout')}
              </button>
            )}
          </div>

          <div className={`p-3 bg-natural-bone rounded-2xl border border-natural-border ${language === 'ar' ? 'text-right' : ''}`}>
            <span className="text-natural-sage text-xs block uppercase font-bold">{language === 'ar' ? 'الخرجة القادمة' : language === 'en' ? 'Next Run' : 'Prochain Run'}</span>
            <div className={`flex items-center gap-1.5 mt-1 text-natural-olive ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Clock className="w-4 h-4 text-natural-olive shrink-0" />
              <span className="font-serif italic font-bold text-sm truncate">{countdownStr}</span>
            </div>
          </div>

          <div className={`p-3 bg-natural-bone rounded-2xl border border-natural-border ${language === 'ar' ? 'text-right' : ''}`}>
            <span className="text-natural-sage text-xs block uppercase font-bold">{language === 'ar' ? 'خرجات النادي' : language === 'en' ? 'Club Outings' : 'Sorties Club'}</span>
            <p className="text-natural-text text-sm font-semibold mt-1">
              <span className="text-natural-olive font-serif italic font-black text-base">{upcomingCount}</span> {language === 'ar' ? 'مخططة' : 'planifiées'} <span className="text-natural-border">|</span> <span className="text-natural-accent font-serif italic font-black text-base">{completedCount}</span> {language === 'ar' ? 'تقارير' : 'tkarir'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-t border-natural-border bg-natural-sage-light/30 p-2 gap-2 overflow-x-auto scroller-hidden">
        <button
          onClick={() => setActiveTab('planning')}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 shrink-0 flex-1 md:flex-none ${
            activeTab === 'planning'
              ? 'bg-natural-olive text-white shadow-md font-bold'
              : 'text-natural-sage hover:text-natural-olive hover:bg-natural-sage-light/60'
          }`}
        >
          <CalendarRange className="w-4 h-4" />
          <span>{t('planning')}</span>
          {upcomingCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${activeTab === 'planning' ? 'bg-white/20 text-white' : 'bg-natural-sage-light text-natural-olive'}`}>
              {upcomingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 shrink-0 flex-1 md:flex-none ${
            activeTab === 'reports'
              ? 'bg-natural-olive text-white shadow-md font-bold'
              : 'text-natural-sage hover:text-natural-olive hover:bg-natural-sage-light/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t('stats')}</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 shrink-0 flex-1 md:flex-none ${
            activeTab === 'roster'
              ? 'bg-natural-olive text-white shadow-md font-bold'
              : 'text-natural-sage hover:text-natural-olive hover:bg-natural-sage-light/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('roster')}</span>
        </button>

        <button
          onClick={() => setActiveTab('lists')}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 shrink-0 flex-1 md:flex-none ${
            activeTab === 'lists'
              ? 'bg-natural-olive text-white shadow-md font-bold'
              : 'text-natural-sage hover:text-natural-olive hover:bg-natural-sage-light/60'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>{t('customLists')}</span>
        </button>
      </div>
    </header>
  );
}
