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
  Facebook,
  Compass,
  Bell
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
    { id: 'dashboard', label: language === 'ar' ? 'الرئيسية' : language === 'en' ? 'Dashboard' : 'Tableau de bord', icon: Compass },
    { id: 'planning', label: language === 'ar' ? 'التخطيط' : language === 'en' ? 'Planning' : 'Planning', icon: Calendar },
    { id: 'reports', label: language === 'ar' ? 'خرجات النادي' : language === 'en' ? 'List of Runs' : 'Liste des Runs', icon: Map },
    { id: 'roster', label: language === 'ar' ? 'المشاركون' : language === 'en' ? 'Participants' : 'Participants', icon: Users },
    { id: 'lists', label: language === 'ar' ? 'القوائم' : language === 'en' ? 'Lists' : 'Liste', icon: Trophy },
    { id: 'stats', label: language === 'ar' ? 'الإحصائيات' : language === 'en' ? 'Stats' : 'Stats', icon: BarChart3 },
    { id: 'messagerie', label: language === 'ar' ? 'الرسائل والتعليقات' : language === 'en' ? 'Messaging' : 'Messagerie', icon: MessageSquare },
    { id: 'notifications', label: language === 'ar' ? 'الإشعارات' : language === 'en' ? 'Notifications' : 'Notifications', icon: Bell },
    { id: 'settings', label: language === 'ar' ? 'الإعدادات' : language === 'en' ? 'Settings' : 'Paramètres', icon: Settings },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  const isRtl = language === 'ar';

  return (
    <>
      {/* Mobile Top Header (Sits on top for screens below lg) */}
      <div className="lg:hidden w-full bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0 relative z-40">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-xl border border-slate-100 shadow-3xs shrink-0">
            <img src="/logo.png" alt="Mosta Run Club Logo" className="w-7 h-7 object-contain" referrerPolicy="no-referrer" />
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
        </div>
      </div>

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
              <div className="bg-white p-2 rounded-[1.5rem] shadow-xl flex items-center justify-center w-20 h-20 border border-blue-100/50 transform hover:scale-[1.05] transition duration-300 overflow-hidden">
                <img src="/logo.png" alt="Mosta Run Club Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            </div>

            {/* Menu Links */}
            <nav className="space-y-0.5 relative z-15 max-h-[50vh] overflow-y-auto no-scrollbar">
              {menuItems.map((item) => {
                const isSelected = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11px] transition-all tracking-wide font-semibold cursor-pointer
                      ${isSelected 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-500/50 font-bold scale-[1.01]' 
                        : 'text-slate-100/80 hover:text-white hover:bg-white/5'
                      }
                      ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition ${isSelected ? 'text-white' : 'text-slate-200'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Aide & Support customized pill-button */}
              <button
                onClick={() => handleTabClick('help')}
                className={`
                  w-full flex items-center justify-center gap-2 px-4.5 py-2 mt-2 rounded-xl text-[10px] font-bold border border-white/10 hover:border-white/20 transition duration-300 cursor-pointer text-slate-200 hover:text-white bg-white/5 hover:bg-white/10
                  ${activeTab === 'help' ? 'bg-blue-600 border-blue-500 font-bold' : ''}
                  ${isRtl ? 'flex-row-reverse' : ''}
                `}
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'ar' ? 'المساعدة والدعم' : language === 'en' ? 'Help & Support' : 'Aide & Support'}</span>
              </button>
            </nav>
          </div>

          {/* Sidebar Footer with Social links */}
          <div className="space-y-4 pt-3 relative z-15 border-t border-white/5">
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
                className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold hover:bg-rose-500/20 hover:text-rose-400 rounded-lg border border-white/10 cursor-pointer transition"
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
