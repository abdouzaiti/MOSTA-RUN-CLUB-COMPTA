import React, { useState, useRef } from 'react';
import { Runner } from '../types';
import { Language } from '../translations';
import { 
  Activity, Calendar, 
  BarChart3, 
  Map, 
  Users, 
  Trophy, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Globe, 
  Instagram, 
  Facebook,
  Compass,
  Bell,
  Camera
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Runner;
  onUpdateCurrentUser?: (user: Runner) => void;
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  girlMode?: boolean;
  setGirlMode?: (enabled: boolean) => void;
  unreadSupportCount?: number;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onUpdateCurrentUser, 
  onLogout, 
  language, 
  setLanguage, 
  girlMode,
  setGirlMode,
  unreadSupportCount = 0
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuItems = [
    { id: 'dashboard', label: language === 'ar' ? 'الرئيسية' : language === 'en' ? 'Dashboard' : 'Tableau de bord', icon: Compass },
    { id: 'run-recorder', label: language === 'ar' ? 'لنجري' : language === 'en' ? "Let's Run" : 'Allons Courir', icon: Activity },
    { id: 'planning', label: language === 'ar' ? 'التخطيط' : language === 'en' ? 'Planning' : 'Planning', icon: Calendar },
    { id: 'reports', label: language === 'ar' ? 'خرجات النادي' : language === 'en' ? 'List of Runs' : 'Liste des Runs', icon: Map },
    { id: 'roster', label: language === 'ar' ? 'المشاركون' : language === 'en' ? 'Participants' : 'Participants', icon: Users },
    { id: 'lists', label: language === 'ar' ? 'القوائم' : language === 'en' ? 'Lists' : 'Liste', icon: Trophy },
    { id: 'messagerie', label: language === 'ar' ? 'الرسائل والتعليقات' : language === 'en' ? 'Messaging' : 'Messagerie', icon: MessageSquare },
    { id: 'notifications', label: language === 'ar' ? 'الإشعارات' : language === 'en' ? 'Notifications' : 'Notifications', icon: Bell },
    { id: 'settings', label: language === 'ar' ? 'الإعدادات' : language === 'en' ? 'Settings' : 'Paramètres', icon: Settings },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateCurrentUser) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        canvas.width = MAX_WIDTH;
        canvas.height = MAX_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, MAX_WIDTH, MAX_HEIGHT);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onUpdateCurrentUser({
            ...currentUser,
            avatarUrl: dataUrl
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isRtl = language === 'ar';

  return (
    <>
      {/* Mobile Top Header (Sits on top for screens below lg) */}
      <div className={`lg:hidden w-full bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0 relative z-40 ${
        activeTab === 'messagerie' ? 'hidden' : ''
      }`}>
        {/* Left Section Logo & Brand - Clickable Theme Mod Trigger */}
        <div 
          onClick={() => setGirlMode && setGirlMode(!girlMode)}
          className="flex items-center gap-2 cursor-pointer group active:scale-95 transition-transform"
          title={girlMode ? "Mode Normal" : "Girl Mode 🌸"}
        >
          <div className="p-1 shrink-0 relative">
            <img src={girlMode ? "/pinklogo.png" : "/logo.png"} alt="Mosta Run Club Logo" className="w-8 h-8 object-contain drop-shadow-sm group-hover:rotate-12 transition-transform duration-300" referrerPolicy="no-referrer" />
          </div>
          <div>
            <span className={`font-serif italic font-black text-xs tracking-widest block leading-none transition-colors ${girlMode ? 'text-pink-600' : 'text-[#1034A6]'}`}>MOSTA RUN CLUB</span>
            <span className={`text-[8px] font-mono tracking-widest uppercase font-bold transition-colors ${girlMode ? 'text-rose-400' : 'text-[#2F89FC]'}`}>{girlMode ? 'GIRL MODE 🌸' : 'MRC Team'}</span>
          </div>
        </div>
        
        {/* Right Section Actions - Theme Mod Toggle Trigger & Quick controls */}
        <div className="flex items-center gap-1.5">
          {/* Mode Toggle Trigger */}
          <button
            onClick={() => setGirlMode && setGirlMode(!girlMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-300 active:scale-95 cursor-pointer text-[10px] font-black uppercase tracking-wider ${
              girlMode 
                ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-sm' 
                : 'bg-blue-50 border-blue-100 text-blue-600 shadow-sm'
            }`}
          >
            <span className="animate-pulse">🌸</span>
            <span>{language === 'ar' ? 'الوضع' : 'MODE'}</span>
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={() => setActiveTab('notifications')}
            className={`relative p-2 rounded-full border cursor-pointer transition ${
              activeTab === 'notifications' 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className={`absolute top-0 right-0 w-2 h-2 ${girlMode ? 'bg-rose-500' : 'bg-blue-500'} rounded-full animate-pulse`} />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer active:scale-95 transition"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay/Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className={`fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} w-[280px] bg-[#1034A6] shadow-2xl flex flex-col p-6 animate-slide-in-${isRtl ? 'right' : 'left'}`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 brightness-0 invert" referrerPolicy="no-referrer" />
                <span className="text-white font-serif italic font-black text-sm tracking-widest">MRC</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-white/80 hover:text-white cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.id === 'run-recorder') {
                        alert('Feature under development');
                      } else {
                        handleTabClick(item.id);
                      }
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition ${
                      isSelected ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-white/10 space-y-4 pb-24 sm:pb-8">
              {/* Theme & Language Quick Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setLanguage(language === 'ar' ? 'fr' : language === 'fr' ? 'en' : 'ar')}
                  className="flex items-center justify-center gap-2 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{language}</span>
                </button>
                <button 
                  onClick={() => setGirlMode && setGirlMode(!girlMode)}
                  className={`flex items-center justify-center gap-2 py-2 border rounded-xl text-[10px] font-bold cursor-pointer transition ${
                    girlMode ? 'bg-pink-500 border-pink-400 text-white' : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  <span>{girlMode ? '🌸 Mode Fille' : '🌸 Normal'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 overflow-hidden">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">{currentUser.name.substring(0, 2).toUpperCase()}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-white truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-white/60 truncate">{currentUser.runClubRole || 'Membre'}</div>
                </div>
              </div>

              <button 
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-center gap-2 py-3.5 ${
                  girlMode ? 'bg-pink-500 hover:bg-pink-600 shadow-pink-900/20' : 'bg-[#1034A6] hover:bg-blue-700 shadow-blue-900/20'
                } text-white rounded-xl text-sm font-black shadow-lg cursor-pointer transition active:scale-95`}
              >
                <LogOut className="w-5 h-5" />
                <span>{language === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sidebar Container (Hidden on mobile/tablet screen widths below lg) */}
      <aside className={`
        hidden lg:flex flex-col justify-between
        w-66 h-full shrink-0 relative z-40
      `}>
        {/* Floating rounded container mimicking screenshot margins */}
        <div className="m-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] bg-gradient-to-b from-[#1034A6] via-[#1E56A0] to-[#0A1950] rounded-[2.2rem] shadow-xl flex flex-col justify-between p-5 text-white overflow-hidden border border-white/5 relative">
          
          {/* Top Header & Logo stacked */}
          <div className="space-y-6">
            <div className="flex flex-col items-center pt-2 text-center relative z-15">
              <button 
                type="button"
                onClick={() => setGirlMode && setGirlMode(!girlMode)}
                className="p-2 flex items-center justify-center w-24 h-24 transform hover:scale-[1.05] transition duration-300 overflow-hidden cursor-pointer active:scale-95 group focus:outline-hidden"
                title={girlMode ? "Mode Normal" : "Girl Mode 🌸"}
              >
                <img src="/logo.png" alt="Mosta Run Club Logo" className="w-full h-full object-contain drop-shadow-lg group-hover:rotate-12 transition-transform duration-300 brightness-0 invert" referrerPolicy="no-referrer" />
              </button>
            </div>

            {/* Menu Links */}
            <nav className="space-y-0.5 relative z-15 max-h-[50vh] overflow-y-auto no-scrollbar">
              {menuItems.map((item) => {
                const isSelected = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.id === 'run-recorder') {
                        alert('Feature under development');
                      } else {
                        handleTabClick(item.id);
                      }
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11px] transition-all tracking-wide font-semibold cursor-pointer
                      ${isSelected 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-500/50 font-bold scale-[1.01]' 
                        : 'text-slate-100/80 hover:text-white hover:bg-white/5'
                      }
                      text-start
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition ${isSelected ? 'text-white' : 'text-slate-200'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer with Profile & Social links */}
          <div className="space-y-4 pt-3 relative z-15 border-t border-white/5">
            {/* User Profile Quick Access */}
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition group text-start">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden border border-white/20">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    currentUser.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border border-white text-white opacity-0 group-hover:opacity-100 transition shadow-sm cursor-pointer hover:bg-blue-400"
                  title={language === 'ar' ? 'تغيير الصورة' : 'Changer de photo'}
                >
                  <Camera className="w-2.5 h-2.5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[9px] text-slate-300 truncate">{currentUser.runClubRole || 'Membre'}</div>
              </div>
            </div>

            {/* Social handles + Logout Row */}
            <div className="flex items-center justify-between text-slate-300 gap-2">
              <div className="flex items-center gap-1.5">
                <a href="https://www.instagram.com/mostarunclub/" target="_blank" rel="noreferrer" className="hover:text-pink-400 p-1 bg-white/5 hover:bg-white/10 rounded-lg transition">
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a href="https://www.facebook.com/profile.php?id=100054214491761" target="_blank" rel="noreferrer" className="hover:text-blue-400 p-1 bg-white/5 hover:bg-white/10 rounded-lg transition">
                  <Facebook className="w-3.5 h-3.5" />
                </a>
              </div>

              <button 
                onClick={onLogout}
                className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold ${
                  girlMode ? 'hover:bg-rose-500/20 hover:text-rose-400' : 'hover:bg-blue-500/20 hover:text-blue-400'
                } rounded-lg border border-white/10 cursor-pointer transition`}
                title="S'en déconnecter"
              >
                <LogOut className="w-2.5 h-2.5" />
                <span>{language === 'ar' ? 'خروج' : 'Déconnexion'}</span>
              </button>
            </div>

            {/* Copyright stamp */}
            <div className="text-center text-[8px] font-mono font-medium text-slate-400">
              © Mosta Run Club 2026
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
