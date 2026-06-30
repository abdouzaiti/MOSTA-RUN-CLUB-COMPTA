import React, { useState } from 'react';
import { Runner, Run } from '../types';
import { Language, translations } from '../translations';
import { 
  Bell, CheckCircle2, Flame, Award, MapPin, Calendar, 
  MessageSquare, UserPlus, AlertTriangle, Sparkles, Filter, Trash2 
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'run_signup' | 'coach_tip' | 'achievement' | 'general';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  time: string;
  timeAr: string;
  read: boolean;
  avatarIcon: React.ReactNode;
  accentColor: string;
}

interface NotificationsPanelProps {
  currentUser: Runner;
  language: Language;
}

export default function NotificationsPanel({ currentUser, language }: NotificationsPanelProps) {
  const isRtl = language === 'ar';
  
  // Custom mock notifications matching a real running club
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'run_signup',
      title: 'Nouvelle inscription au run !',
      titleAr: 'تسجيل جديد في الخرجة !',
      description: 'Yacine Runner s\'est inscrit à la sortie "Mosta Long Trail" de vendredi.',
      descriptionAr: 'قام ياسين بالتسجيل في خرجة "موستى لونج ترايل" المقررة يوم الجمعة.',
      time: 'Il y a 5 min',
      timeAr: 'منذ 5 دقائق',
      read: false,
      avatarIcon: <UserPlus className="w-4 h-4" />,
      accentColor: 'bg-blue-100 text-[#1034A6] border-blue-200'
    },
    {
      id: 'notif-2',
      type: 'coach_tip',
      title: 'Recommandation importante du Coach',
      titleAr: 'توصية هامة من المدرب',
      description: 'Coach Redouane a publié un nouveau guide de nutrition de course à lire.',
      descriptionAr: 'نشر المدرب رضوان دليلاً جديداً للتغذية الرياضية ينصح بقراءته.',
      time: 'Il y a 1 heure',
      timeAr: 'منذ ساعة',
      read: false,
      avatarIcon: <Flame className="w-4 h-4 text-amber-600" />,
      accentColor: 'bg-amber-100 text-amber-700 border-amber-200'
    },
    {
      id: 'notif-3',
      type: 'achievement',
      title: 'Objectif collectif débloqué ! 🏆',
      titleAr: 'تم فك قفل الهدف الجماعي ! 🏆',
      description: 'Le club a dépassé la barre cumulée des 1 200 km réels enregistrés cette saison !',
      descriptionAr: 'تجاوز النادي عتبة 1200 كيلومتر جماعية مسجلة هذا الموسم !',
      time: 'Hier',
      timeAr: 'أمس',
      read: true,
      avatarIcon: <Award className="w-4 h-4 text-emerald-600" />,
      accentColor: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    {
      id: 'notif-4',
      type: 'general',
      title: 'Attribution de Dossard',
      titleAr: 'تخصيص أرقام الصدريات',
      description: 'Abdou Zaiti vous a attribué le Dossard N° 127 pour le Trail de Mostaganem.',
      descriptionAr: 'قام عبدو زايتي بتخصيص الصدرية رقم 127 لك في سباق مستغانم.',
      time: 'Il y a 2 jours',
      timeAr: 'منذ يومين',
      read: true,
      avatarIcon: <CheckCircle2 className="w-4 h-4 text-indigo-600" />,
      accentColor: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    }
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const handleDeleteNotif = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const displayedNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="bg-white rounded-[2.5rem] p-5 sm:p-6 border border-slate-100 shadow-3xs max-w-3xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header Panel */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-50 pb-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/50 flex items-center justify-center shadow-3xs">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h3 className="font-serif italic font-black text-base sm:text-lg text-slate-800">
              {isRtl ? 'مركز التنبيهات' : 'Centre d\'Alertes & Actu'}
            </h3>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400">
              {isRtl ? 'ابق على اطلاع بخرجات ومستجدات النادي' : 'Restez informé de la vie de la PostaGang.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] rounded-xl transition cursor-pointer"
          >
            {isRtl ? 'تحديد الكل كمقروء' : 'Tout marquer comme lu'}
          </button>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className={`flex gap-1.5 border-b border-slate-50 pb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 text-[10px] font-bold rounded-xl border transition ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white border-transparent'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isRtl ? 'جميع الإشعارات' : 'Toutes les notifications'} ({notifications.length})
        </button>
        <button
          onClick={() => setActiveFilter('unread')}
          className={`px-4 py-2 text-[10px] font-bold rounded-xl border transition ${
            activeFilter === 'unread'
              ? 'bg-blue-600 text-white border-transparent'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isRtl ? 'غير مقروءة' : 'Non lues'} ({notifications.filter(n => !n.read).length})
        </button>
      </div>

      {/* Notification items Container */}
      <div className="space-y-3">
        {displayedNotifications.length > 0 ? (
          displayedNotifications.map(notif => (
            <div 
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all duration-300 flex gap-4 items-start ${
                notif.read 
                  ? 'bg-white border-slate-100 opacity-80' 
                  : 'bg-blue-50/20 border-blue-100/50 shadow-3xs'
              } ${isRtl ? 'flex-row-reverse text-right' : ''}`}
            >
              {/* Type Accent icon */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${notif.accentColor}`}>
                {notif.avatarIcon}
              </div>

              {/* Texts */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className={`flex flex-wrap items-baseline gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <h4 className="font-serif italic font-extrabold text-[13px] text-slate-800">
                    {isRtl ? notif.titleAr : notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">
                    • {isRtl ? notif.timeAr : notif.time}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-relaxed">
                  {isRtl ? notif.descriptionAr : notif.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 self-center">
                <button
                  onClick={() => handleToggleRead(notif.id)}
                  className={`p-1.5 rounded-lg border transition ${
                    notif.read
                      ? 'text-slate-400 bg-slate-50 hover:bg-slate-100 border-slate-200'
                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100'
                  }`}
                  title={notif.read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteNotif(notif.id)}
                  className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">Aucune notification à afficher.</p>
          </div>
        )}
      </div>

    </div>
  );
}
