import React, { useState } from 'react';
import { Runner, Run } from '../types';
import { Language, translations } from '../translations';
import { 
  Bell, CheckCircle2, Flame, Award, MapPin, Calendar, 
  MessageSquare, UserPlus, AlertTriangle, Sparkles, Filter, Trash2,
  Volume2, Smartphone, BellRing
} from 'lucide-react';
import { playMessageChime, playAnnouncementChime, triggerPhoneNotification } from '../utils/audioHelper';

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
  
  const [permissionStatus, setPermissionStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const requestMobilePermission = async () => {
    if (!('Notification' in window)) {
      alert(isRtl ? "متصفحك لا يدعم الإشعارات." : "Votre navigateur ne prend pas en charge les notifications.");
      return;
    }
    
    try {
      const res = await Notification.requestPermission();
      setPermissionStatus(res);
      if (res === 'granted') {
        triggerTestNotification();
      }
    } catch (e) {
      console.error("Error requesting notification permission:", e);
    }
  };

  const triggerTestNotification = () => {
    // Play sound chime
    playMessageChime();
    
    // Send browser native notification
    triggerPhoneNotification(
      isRtl ? "مرحباً بك في PostaGang ! 🏃‍♂️" : "Bienvenue sur PostaGang ! 🏃‍♂️",
      isRtl 
        ? "لقد قمت بتفعيل إشعارات الهاتف بنجاح للرسائل والإعلانات." 
        : "Vous avez activé avec succès les notifications sur votre téléphone pour les messages et annonces."
    );
  };
  
  // Custom mock notifications matching a real running club
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

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

      {/* Real-time Phone Notifications Configuration Card */}
      <div className={`p-5 rounded-3xl border transition-all ${
        permissionStatus === 'granted'
          ? 'bg-emerald-50/30 border-emerald-100/80 text-emerald-900'
          : permissionStatus === 'denied'
            ? 'bg-amber-50/40 border-amber-100/80 text-amber-950'
            : 'bg-blue-50/30 border-blue-100/50 text-blue-950'
      } ${isRtl ? 'text-right' : 'text-left'}`}>
        <div className={`flex flex-col md:flex-row gap-4 items-center justify-between ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          <div className="flex items-start gap-3.5 flex-1">
            <div className={`p-3 rounded-2xl shrink-0 ${
              permissionStatus === 'granted'
                ? 'bg-emerald-100/60 text-emerald-600'
                : permissionStatus === 'denied'
                  ? 'bg-amber-100/60 text-amber-600'
                  : 'bg-blue-100/60 text-blue-600 animate-bounce'
            }`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif italic font-extrabold text-[14px]">
                {permissionStatus === 'granted' ? (
                  isRtl ? '🔔 إشعارات الهاتف مفعلة بنجاح !' : '🔔 Notifications mobiles actives !'
                ) : permissionStatus === 'denied' ? (
                  isRtl ? '🔒 الإشعارات محظورة في متصفحك' : '🔒 Notifications bloquées dans votre navigateur'
                ) : (
                  isRtl ? '📱 تفعيل إشعارات الهاتف الفورية' : '📱 Activer les notifications mobiles immédiates'
                )}
              </h4>
              <p className="text-[11px] font-semibold text-slate-500 leading-relaxed max-w-xl">
                {permissionStatus === 'granted' ? (
                  isRtl 
                    ? 'ستتلقى الآن تنبيهاً فورياً ورنيناً صوتياً على هاتفك عند وصول أي رسالة دعم، رد في الدردشة أو إعلان جديد.'
                    : 'Vous recevrez désormais une alerte en temps réel, une vibration et un bip sonore sur votre téléphone pour les messages de support, les discussions de groupe et les annonces importantes.'
                ) : permissionStatus === 'denied' ? (
                  isRtl
                    ? 'لقد قمت بحظر الإشعارات مسبقاً. يرجى الضغط على قفل الأمان بجانب رابط الموقع في متصفحك وتفعيل الإشعارات يدوياً.'
                    : 'Vous avez bloqué les notifications. Veuillez cliquer sur l\'icône de verrou à côté de la barre d\'adresse de votre navigateur mobile pour les réautoriser.'
                ) : (
                  isRtl
                    ? 'احصل على تجربة تطبيق حقيقية ! فعّل الإشعارات لتلقي رسائل المجموعات، إعلانات المدرب، ومستجدات الدعم في الخلفية حتى وهاتفك مغلق.'
                    : 'Obtenez une expérience d\'application réelle ! Activez les notifications pour recevoir les messages, les annonces du coach et les alertes de support en arrière-plan, même avec l\'écran éteint.'
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex gap-2">
            {permissionStatus === 'granted' ? (
              <button
                onClick={triggerTestNotification}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-103 active:scale-97"
              >
                <Volume2 className="w-4 h-4" />
                {isRtl ? 'تجربة الصوت والاهتزاز' : 'Tester le son & vibreur'}
              </button>
            ) : permissionStatus === 'denied' ? (
              <div className="px-3 py-1.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200">
                {isRtl ? 'يرجى تغيير الإعدادات ⚙️' : 'Modifier les réglages ⚙️'}
              </div>
            ) : (
              <button
                onClick={requestMobilePermission}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-200 hover:scale-103 active:scale-97 animate-pulse"
              >
                <BellRing className="w-4 h-4" />
                {isRtl ? 'تفعيل الآن' : 'Activer maintenant'}
              </button>
            )}
          </div>
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
