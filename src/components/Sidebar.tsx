import React, { useState } from 'react';
import { Runner } from '../types';
import { Language } from '../translations';
import { 
  Calendar, 
  BarChart3, 
  Map, 
  Users, 
  Trophy, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X, 
  Globe, 
  Instagram, 
  Facebook 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Runner;
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, language, setLanguage }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'planning', label: language === 'ar' ? 'التخطيط' : language === 'en' ? 'Planning' : 'Planning', icon: Calendar },
    { id: 'stats', label: language === 'ar' ? 'الإحصائيات' : language === 'en' ? 'Stats' : 'Stats', icon: BarChart3 },
    { id: 'reports', label: language === 'ar' ? 'خرجات النادي' : language === 'en' ? 'List of Runs' : 'Liste des Runs', icon: Map },
    { id: 'roster', label: language === 'ar' ? 'المشاركون' : language === 'en' ? 'Participants' : 'Participants', icon: Users },
    { id: 'lists', label: language === 'ar' ? 'القوائم' : language === 'en' ? 'Lists' : 'Liste', icon: Trophy },
    { id: 'messagerie', label: language === 'ar' ? 'الرسائل والتعليقات' : language === 'en' ? 'Messaging' : 'Messagerie', icon: MessageSquare },
    { id: 'settings', label: language === 'ar' ? 'الإعدادات' : language === 'en' ? 'Settings' : 'Paramètres', icon: Settings },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  const isRtl = language === 'ar';

  return (
    <>
      {/* Mobile Header (Sits on top for screens below lg) */}
      <div className="lg:hidden w-full bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0 relative z-40">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-xl border border-slate-100 shadow-3xs shrink-0">
            <img src="/logo.png" alt="Mosta Run Club Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <span className="font-serif italic font-black text-xs text-[#1034A6] tracking-widest block leading-none">MOSTA RUN CLUB</span>
            <span className="text-[8px] font-mono tracking-widest text-[#2F89FC] uppercase font-bold">PostaGang N°27</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Language pill */}
          <button 
            onClick={() => setLanguage(language === 'ar' ? 'fr' : language === 'fr' ? 'en' : 'ar')}
            className="flex items-center gap-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 cursor-pointer"
          >
            <Globe className="w-3 h-3 text-slate-400" />
            <span className="uppercase">{language}</span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar background overlay for Mobile Drawer */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40"
        />
      )}

      {/* Main Sidebar Container */}
      <aside className={`
        fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} lg:relative z-40
        w-64 h-full transform ${isOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')} lg:translate-x-0 
        transition-transform duration-300 ease-in-out shrink-0
        flex flex-col justify-between
      `}>
        {/* Floating rounded container mimicking screenshot margins */}
        <div className="m-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] bg-gradient-to-b from-[#1034A6] via-[#1E56A0] to-[#0A1950] rounded-[2.2rem] shadow-xl flex flex-col justify-between p-5 text-white overflow-hidden border border-white/5 relative">
          
          {/* Top Header & Logo stacked */}
          <div className="space-y-6">
            <div className="flex flex-col items-center pt-2 text-center relative z-15">
              <div className="bg-white p-2 rounded-[1.5rem] shadow-xl flex items-center justify-center w-22 h-22 border border-blue-100/50 transform hover:scale-[1.05] transition duration-300 overflow-hidden">
                <img src="/logo.png" alt="Mosta Run Club Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            </div>

            {/* Menu Links */}
            <nav className="space-y-1 relative z-15 max-h-[50vh] overflow-y-auto no-scrollbar">
              {menuItems.map((item) => {
                const isSelected = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`
                      w-full flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-xs transition-all tracking-wide font-semibold cursor-pointer
                      ${isSelected 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-500/50 font-bold scale-[1.02]' 
                        : 'text-slate-100/80 hover:text-white hover:bg-white/5'
                      }
                      ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}
                    `}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition ${isSelected ? 'text-white' : 'text-slate-200'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Aide & Support customized pill-button */}
              <button
                onClick={() => handleTabClick('help')}
                className={`
                  w-full flex items-center justify-center gap-2 px-4.5 py-2.5 mt-2 rounded-2xl text-xs font-bold border border-white/10 hover:border-white/20 transition duration-300 cursor-pointer text-slate-200 hover:text-white bg-white/5 hover:bg-white/10
                  ${activeTab === 'help' ? 'bg-blue-600 border-blue-500 font-bold' : ''}
                  ${isRtl ? 'flex-row-reverse' : ''}
                `}
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'ar' ? 'المساعدة والدعم' : language === 'en' ? 'Help & Support' : 'Aide & Support'}</span>
              </button>
            </nav>
          </div>

          {/* Sidebar Footer with Runners Graphic + Social link */}
          <div className="space-y-4 pt-4 relative z-15 border-t border-white/5">
            {/* Interactive Image Illustration */}
            <div className="relative rounded-2xl overflow-hidden shadow-inner border border-white/10 h-28 hidden lg:block bg-slate-950/80">
              <img 
                src="/src/assets/images/runners_sidebar_1782124341575.jpg" 
                alt="Mosta Run Club 2026" 
                className="w-full h-full object-cover brightness-90 contrast-105 pointer-events-none filter select-none transition duration-500 hover:scale-[1.1]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-2.5 text-center">
                <span className="text-[8px] font-mono tracking-[0.2em] font-bold text-slate-300 uppercase leading-none">We run together</span>
              </div>
            </div>

            {/* Social handles + Logout Row */}
            <div className="flex items-center justify-between text-slate-300 gap-2">
              <div className="flex items-center gap-2">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-pink-400 p-1 bg-white/5 hover:bg-white/10 rounded-lg transition">
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-blue-400 p-1 bg-white/5 hover:bg-white/10 rounded-lg transition">
                  <Facebook className="w-3.5 h-3.5" />
                </a>
              </div>

              <button 
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold hover:bg-rose-500/20 hover:text-rose-400 rounded-lg border border-white/10 cursor-pointer transition"
                title="S'en déconnecter"
              >
                <LogOut className="w-3 h-3" />
                <span>{language === 'ar' ? 'خروج' : 'Déconnexion'}</span>
              </button>
            </div>

            {/* Copyright stamp */}
            <div className="text-center text-[9px] font-mono font-medium text-slate-400">
              © Mosta Run Club 2024
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
