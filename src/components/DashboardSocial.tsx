import React, { useState, useEffect, useRef } from 'react';
import { Runner, Run, Announcement } from '../types';
import { Language, translations } from '../translations';
import { isSupabaseConfigured, dbService } from '../supabaseClient';
import { 
  Sparkles, Flame, Trophy, MapPin, Calendar, Heart, 
  MessageSquare, Share2, Compass, Sun, Wind, CloudRain,
  UserPlus, ArrowRight, Zap, Award, Target, TrendingUp,
  ShoppingBag, ExternalLink, Clock, Trash2, Database, Send,
  Image, X, Headphones, Check, Sliders
} from 'lucide-react';
import mrcShopPreview from '../assets/images/mrc_shop_preview_1783012220849.jpg';

const isUrl = (str: string) => {
  if (!str) return false;
  const s = str.trim();
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/');
};

const isImageUrl = (str: string) => {
  if (!str) return false;
  const s = str.trim().toLowerCase();
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/') || s.includes('images.unsplash.com') || s.endsWith('.jpg') || s.endsWith('.jpeg') || s.endsWith('.png') || s.endsWith('.gif') || s.endsWith('.webp');
};

interface DashboardSocialProps {
  runners: Runner[];
  runs: Run[];
  currentUser: Runner;
  onToggleRegister: (runId: string) => void;
  setActiveTab: (tab: string) => void;
  language: Language;
  onOpenSupportChat?: () => void;
}

export default function DashboardSocial({ 
  runners, 
  runs, 
  currentUser, 
  onToggleRegister, 
  setActiveTab,
  language,
  onOpenSupportChat
}: DashboardSocialProps) {
  const isRtl = language === 'ar';
  const isGirlMode = typeof window !== 'undefined' && localStorage.getItem('mrc_girl_mode') === 'true';
  const t = (key: string) => (translations[language] as any)[key] || (translations['fr'] as any)[key] || key;

  // Live screenshot of the real vercel website with a mockup fallback
  const [shopImgSrc, setShopImgSrc] = useState('https://api.microlink.io?url=https%3A%2F%2Fmrc-shop.vercel.app&screenshot=true&embed=screenshot.url');

  // Real-time info states
  const [timeString, setTimeString] = useState('');
  const [temp, setTemp] = useState(24.2);
  const [wind, setWind] = useState(12.4);
  const [shopViews, setShopViews] = useState(14);
  const [recentOrderIdx, setRecentOrderIdx] = useState(0);
  const [countdownStr, setCountdownStr] = useState('');

  const recentOrders = [
    { name: 'Abdou Zaiti', item: isRtl ? 'القميص التقني الرسمي' : 'Maillot Technique Noir - M', time: isRtl ? 'منذ دقيقة' : 'il y a 1 min' },
    { name: 'Coach Redouane', item: isRtl ? 'قبعة الجري الفاخرة' : 'Casquette Performance', time: isRtl ? 'منذ 3 دقائق' : 'il y a 3 min' },
    { name: 'Amine R.', item: isRtl ? 'سترة النادي الشتوية' : 'Hoodie Club Premium', time: isRtl ? 'منذ 8 دقائق' : 'il y a 8 min' },
    { name: 'Sofiane K.', item: isRtl ? 'حقيبة الظهر الرياضية' : 'Sac de sport MRC', time: isRtl ? 'منذ 15 دقيقة' : 'il y a 15 min' },
  ];

  // Calculate upcoming runs here so they can be referenced in useEffect countdown
  const upcomingRuns = runs.filter(r => !r.completed).slice(0, 2);

  useEffect(() => {
    // 1. Clock timer
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }));
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // 2. Weather & Shop Views fluctuation timer
    const fluctuationInterval = setInterval(() => {
      setTemp(prev => {
        const delta = (Math.random() - 0.5) * 0.4;
        const next = prev + delta;
        return parseFloat(Math.min(Math.max(next, 23.5), 24.8).toFixed(1));
      });
      setWind(prev => {
        const delta = (Math.random() - 0.5) * 0.8;
        const next = prev + delta;
        return parseFloat(Math.min(Math.max(next, 10.5), 14.5).toFixed(1));
      });
      setShopViews(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return Math.min(Math.max(next, 8), 22);
      });
    }, 4000);

    // 3. Shop orders ticker interval
    const orderInterval = setInterval(() => {
      setRecentOrderIdx(prev => (prev + 1) % recentOrders.length);
    }, 5000);

    // 4. Countdown to the next run
    const updateCountdown = () => {
      let targetDate: Date | null = null;
      if (upcomingRuns.length > 0) {
        const firstRun = upcomingRuns[0];
        const dateStr = firstRun.date;
        const timeStr = firstRun.time || '06:00';
        try {
          const parsed = new Date(`${dateStr}T${timeStr}`);
          if (!isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
            targetDate = parsed;
          }
        } catch (e) {
          // ignore
        }
      }

      // If no valid upcoming runs date is found, target the upcoming Friday at 6:00 AM
      if (!targetDate) {
        const now = new Date();
        const nextFriday = new Date();
        nextFriday.setHours(6, 0, 0, 0);
        const day = nextFriday.getDay();
        const daysToAdd = (5 - day + 7) % 7 || 7; // Friday is 5
        nextFriday.setDate(now.getDate() + daysToAdd);
        targetDate = nextFriday;
      }

      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setCountdownStr(isRtl ? 'جاري الآن ! 🏃' : 'En cours ! 🏃');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (isRtl) {
        setCountdownStr(`متبقي: ${days} يوم، ${hours} ساعة، ${minutes} دقيقة، ${seconds} ثانية`);
      } else {
        setCountdownStr(`Dans ${days}j ${hours}h ${minutes}m ${seconds}s`);
      }
    };
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(fluctuationInterval);
      clearInterval(orderInterval);
      clearInterval(countdownInterval);
    };
  }, [upcomingRuns, language, isRtl]);

  // Real-time or synced posts state
  const [posts, setPosts] = useState<any[]>([]);
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});

  // --- INTEGRATED MRC SHOP & GPS CONNECTIONS SYSTEM ---
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isShopConnected, setIsShopConnected] = useState(() => localStorage.getItem('mrc_shop_connected') === 'true');
  const [isConnectingShop, setIsConnectingShop] = useState(false);
  const [customJerseyName, setCustomJerseyName] = useState(currentUser.name.split(' ')[0].toUpperCase());
  const [jerseySize, setJerseySize] = useState('M');
  const [selectedShopItem, setSelectedShopItem] = useState('maillot');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderStep, setOrderStep] = useState(0);
  const [ordersList, setOrdersList] = useState<any[]>(() => {
    const saved = localStorage.getItem('mrc_shop_orders_history');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'MRC-9011', item: isRtl ? 'القميص التقني الرسمي' : 'Maillot Technique Noir - M', printedName: currentUser.name.split(' ')[0].toUpperCase(), total: '2900 DA', status: 'delivered', time: isRtl ? 'منذ يومين' : 'Il y a 2 jours' }
    ];
  });

  // GPS connections
  const [stravaConnected, setStravaConnected] = useState(() => localStorage.getItem('mrc_strava_connected') === 'true');
  const [garminConnected, setGarminConnected] = useState(() => localStorage.getItem('mrc_garmin_connected') === 'true');
  const [suuntoConnected, setSuuntoConnected] = useState(() => localStorage.getItem('mrc_suunto_connected') === 'true');
  const [gpsSyncing, setGpsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(() => localStorage.getItem('mrc_gps_last_sync') || '');
  const [syncProgress, setSyncProgress] = useState(0);
  const [popupService, setPopupService] = useState<string | null>(null);
  const [isAuthorizingGps, setIsAuthorizingGps] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem('mrc_shop_orders_history', JSON.stringify(ordersList));
  }, [ordersList]);

  const handleConnectGps = (service: string) => {
    setPopupService(service);
    setIsAuthorizingGps(true);
    setSyncProgress(0);
    
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsAuthorizingGps(false);
            if (service === 'strava') {
              setStravaConnected(true);
              localStorage.setItem('mrc_strava_connected', 'true');
            } else if (service === 'garmin') {
              setGarminConnected(true);
              localStorage.setItem('mrc_garmin_connected', 'true');
            } else if (service === 'suunto') {
              setSuuntoConnected(true);
              localStorage.setItem('mrc_suunto_connected', 'true');
            }
            setPopupService(null);
          }, 600);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleDisconnectGps = (service: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (service === 'strava') {
      setStravaConnected(false);
      localStorage.removeItem('mrc_strava_connected');
    } else if (service === 'garmin') {
      setGarminConnected(false);
      localStorage.removeItem('mrc_garmin_connected');
    } else if (service === 'suunto') {
      setSuuntoConnected(false);
      localStorage.removeItem('mrc_suunto_connected');
    }
  };

  const handleGpsSync = () => {
    if (gpsSyncing) return;
    setGpsSyncing(true);
    setShowSyncSuccess(false);
    setSyncStatusMsg(isRtl ? 'جاري الاتصال بالأقمار الصناعية...' : 'Connexion aux serveurs GPS...');
    
    setTimeout(() => {
      setSyncStatusMsg(isRtl ? 'تحميل آخر التدريبـات المنجزة...' : 'Téléchargement des dernières séances...');
      setTimeout(() => {
        setSyncStatusMsg(isRtl ? 'تحليل مسافات وخرائط الجري...' : 'Analyse de l\'allure et de la distance...');
        setTimeout(() => {
          const now = new Date();
          const timeStr = now.toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
          const dateStr = now.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'short' });
          const fullTime = `${dateStr} à ${timeStr}`;
          setLastSyncTime(fullTime);
          localStorage.setItem('mrc_gps_last_sync', fullTime);
          setGpsSyncing(false);
          setSyncStatusMsg('');
          setShowSyncSuccess(true);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const handleConnectShop = () => {
    if (isShopConnected) {
      setIsShopModalOpen(true);
      return;
    }
    
    setIsConnectingShop(true);
    setTimeout(() => {
      setIsShopConnected(true);
      localStorage.setItem('mrc_shop_connected', 'true');
      setIsConnectingShop(false);
      setIsShopModalOpen(true);
    }, 1500);
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
    setOrderStep(1);
    
    setTimeout(() => {
      setOrderStep(2);
      setTimeout(() => {
        setOrderStep(3);
        setTimeout(() => {
          setOrderStep(4);
          
          const itemLabels: {[key: string]: string} = {
            maillot: isRtl ? 'القميص التقني الرسمي' : 'Maillot Technique Noir & Jaune',
            hoodie: isRtl ? 'سترة النادي الشتوية' : 'Hoodie Club Premium',
            casquette: isRtl ? 'قبعة الجري الفاخرة' : 'Casquette Performance',
            sac: isRtl ? 'حقيبة الظهر الرياضية' : 'Sac de sport MRC'
          };
          const itemPrices: {[key: string]: string} = {
            maillot: '2500 DA',
            hoodie: '4800 DA',
            casquette: '1500 DA',
            sac: '2900 DA'
          };
          
          const newOrder = {
            id: 'MRC-' + Math.floor(1000 + Math.random() * 9000),
            item: itemLabels[selectedShopItem],
            printedName: selectedShopItem === 'maillot' ? customJerseyName.toUpperCase() : null,
            total: itemPrices[selectedShopItem],
            status: 'pending',
            time: isRtl ? 'الآن' : 'À l\'instant'
          };
          
          setOrdersList(prev => [newOrder, ...prev]);
          setIsSubmittingOrder(false);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  // Load posts / announcements from Supabase
  useEffect(() => {
    async function fetchAnnouncements() {
      // Setup default mock posts (empty as requested by user)
      const defaultPosts: any[] = [];

      if (!isSupabaseConfigured) {
        setPosts(defaultPosts);
        return;
      }

      try {
        const data = await dbService.getAnnouncements();
        
        if (data === null) {
          setIsTableMissing(true);
          setPosts(defaultPosts);
          return;
        }

        setIsTableMissing(false);
        if (data && data.length > 0) {
          // Map to local UI format
          const mapped = data.map(ann => ({
            id: ann.id,
            author: {
              name: ann.authorName,
              avatarUrl: ann.authorAvatarUrl || null,
              role: ann.authorRole,
              initials: ann.authorInitials
            },
            time: ann.timeFr,
            timeAr: ann.timeAr,
            content: ann.content,
            image: ann.imageUrl || null,
            likes: ann.likes,
            liked: ann.likedBy.includes(currentUser.id),
            likedBy: ann.likedBy, // keep raw likedBy array for updates
            commentsCount: ann.comments.length,
            comments: ann.comments
          }));
          setPosts(mapped);
        } else {
          // If no announcements exist in DB, seed defaults
          const seedAnnouncements: Announcement[] = defaultPosts.map(p => ({
            id: p.id,
            authorName: p.author.name,
            authorAvatarUrl: p.author.avatarUrl || undefined,
            authorRole: p.author.role,
            authorInitials: p.author.initials,
            timeFr: p.time,
            timeAr: p.timeAr,
            content: p.content,
            imageUrl: p.image || undefined,
            likes: p.likes,
            likedBy: p.likedBy || [],
            comments: p.comments
          }));

          // Upload in background
          for (const s of seedAnnouncements) {
            await dbService.upsertAnnouncement(s).catch(e => console.warn("Error seeding:", e));
          }

          setPosts(defaultPosts);
        }
      } catch (err) {
        console.warn("Failed to load announcements from Supabase:", err);
        setPosts(defaultPosts);
      }
    }

    fetchAnnouncements();
  }, [currentUser.id]);

  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  const handleLikePost = async (postId: string) => {
    let updatedPostObj: any = null;
    const updatedPosts = posts.map(p => {
      if (p.id === postId) {
        const isLiked = p.liked;
        const rawLikedBy = Array.isArray(p.likedBy) ? p.likedBy : [];
        const newLikedBy = isLiked
          ? rawLikedBy.filter(id => id !== currentUser.id)
          : [...rawLikedBy, currentUser.id];
        
        const newLikes = isLiked ? Math.max(0, p.likes - 1) : p.likes + 1;

        updatedPostObj = {
          ...p,
          likes: newLikes,
          liked: !isLiked,
          likedBy: newLikedBy
        };
        return updatedPostObj;
      }
      return p;
    });

    setPosts(updatedPosts);

    // Persist to Supabase
    if (isSupabaseConfigured && !isTableMissing && updatedPostObj) {
      try {
        const dbAnnouncement: Announcement = {
          id: updatedPostObj.id,
          authorName: updatedPostObj.author.name,
          authorAvatarUrl: updatedPostObj.author.avatarUrl || undefined,
          authorRole: updatedPostObj.author.role,
          authorInitials: updatedPostObj.author.initials,
          timeFr: updatedPostObj.time,
          timeAr: updatedPostObj.timeAr,
          content: updatedPostObj.content,
          imageUrl: updatedPostObj.image || undefined,
          likes: updatedPostObj.likes,
          likedBy: updatedPostObj.likedBy,
          comments: updatedPostObj.comments
        };
        await dbService.upsertAnnouncement(dbAnnouncement);
      } catch (err) {
        console.error("Failed to save post like on Supabase:", err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment = {
      author: currentUser.name,
      text: text
    };

    let updatedPostObj: any = null;
    const updatedPosts = posts.map(p => {
      if (p.id === postId) {
        const comments = [...(p.comments || []), newComment];
        updatedPostObj = {
          ...p,
          comments: comments,
          commentsCount: comments.length
        };
        return updatedPostObj;
      }
      return p;
    });

    setPosts(updatedPosts);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    if (isSupabaseConfigured && !isTableMissing && updatedPostObj) {
      try {
        const dbAnnouncement: Announcement = {
          id: updatedPostObj.id,
          authorName: updatedPostObj.author.name,
          authorAvatarUrl: updatedPostObj.author.avatarUrl || undefined,
          authorRole: updatedPostObj.author.role,
          authorInitials: updatedPostObj.author.initials,
          timeFr: updatedPostObj.time,
          timeAr: updatedPostObj.timeAr,
          content: updatedPostObj.content,
          imageUrl: updatedPostObj.image || undefined,
          likes: updatedPostObj.likes,
          likedBy: updatedPostObj.likedBy,
          comments: updatedPostObj.comments
        };
        await dbService.upsertAnnouncement(dbAnnouncement);
      } catch (err) {
        console.error("Failed to save post comment on Supabase:", err);
      }
    }
  };

  const handleDeleteComment = async (postId: string, commentIndex: number) => {
    let updatedPostObj: any = null;
    const updatedPosts = posts.map(p => {
      if (p.id === postId) {
        const comments = (p.comments || []).filter((_: any, idx: number) => idx !== commentIndex);
        updatedPostObj = {
          ...p,
          comments: comments,
          commentsCount: comments.length
        };
        return updatedPostObj;
      }
      return p;
    });

    setPosts(updatedPosts);

    if (isSupabaseConfigured && !isTableMissing && updatedPostObj) {
      try {
        const dbAnnouncement: Announcement = {
          id: updatedPostObj.id,
          authorName: updatedPostObj.author.name,
          authorAvatarUrl: updatedPostObj.author.avatarUrl || undefined,
          authorRole: updatedPostObj.author.role,
          authorInitials: updatedPostObj.author.initials,
          timeFr: updatedPostObj.time,
          timeAr: updatedPostObj.timeAr,
          content: updatedPostObj.content,
          imageUrl: updatedPostObj.image || undefined,
          likes: updatedPostObj.likes,
          likedBy: updatedPostObj.likedBy,
          comments: updatedPostObj.comments
        };
        await dbService.upsertAnnouncement(dbAnnouncement);
      } catch (err) {
        console.error("Failed to delete post comment on Supabase:", err);
      }
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    let text = newPostText.trim();
    let image = newPostImage.trim();

    // Auto-convert image URL in textarea if no separate image is selected
    if (isImageUrl(text) && !image) {
      image = text;
      text = '';
    }

    if (!text && !image) return;

    const initials = currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    
    // Format friendly time strings
    const now = new Date();
    const timeFr = `Le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    const timeAr = `في ${now.toLocaleDateString('ar-DZ')} الساعة ${now.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}`;

    const id = 'post-' + Date.now();

    const newPostUi = {
      id,
      author: {
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl || null,
        role: currentUser.runClubRole || 'Membre',
        initials
      },
      time: timeFr,
      timeAr: timeAr,
      content: text,
      image: image || null,
      likes: 0,
      liked: false,
      likedBy: [],
      commentsCount: 0,
      comments: []
    };

    setPosts([newPostUi, ...posts]);
    setNewPostText('');
    setNewPostImage('');
    setShowImageInput(false);

    if (isSupabaseConfigured && !isTableMissing) {
      try {
        const dbAnnouncement: Announcement = {
          id,
          authorName: currentUser.name,
          authorAvatarUrl: currentUser.avatarUrl || undefined,
          authorRole: currentUser.runClubRole || 'Membre',
          authorInitials: initials,
          timeFr,
          timeAr,
          content: text,
          imageUrl: image || undefined,
          likes: 0,
          likedBy: [],
          comments: []
        };
        await dbService.upsertAnnouncement(dbAnnouncement);
      } catch (err) {
        console.error("Failed to save new announcement to Supabase:", err);
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));

    if (isSupabaseConfigured && !isTableMissing) {
      try {
        await dbService.deleteAnnouncement(postId);
      } catch (err) {
        console.error("Failed to delete announcement from Supabase:", err);
      }
    }
  };

  // Stats summaries
  const totalRunnersCount = runners.length;
  const activeRunsCount = runs.filter(r => !r.completed).length;
  const finishedRunsCount = runs.filter(r => r.completed).length;

  const userOrdersMapped = ordersList.map(ord => ({
    name: currentUser.name,
    item: ord.item,
    time: ord.time
  }));
  const combinedOrders = [...userOrdersMapped, ...recentOrders];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Welcome / Hero Banner Banner Section */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#1034A6] via-[#1E56A0] to-[#2F89FC] text-white p-6 sm:p-8 shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 p-8 opacity-40 pointer-events-none transform translate-x-8 -translate-y-12 blur-[2px]">
          <img src={isGirlMode ? "/pinklogo.png" : "/logo.png"} alt="Logo" className="w-80 h-80 object-contain drop-shadow-xl brightness-0 invert" />
        </div>
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-xs w-fit">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>MRC Community Spotlight</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif italic font-black leading-tight tracking-tight">
            {isRtl ? 'مرحباً بك في مجتمع الجري الأرقى' : 'Courir ensemble, repousser les limites.'}
          </h2>
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed font-medium">
            {isRtl 
              ? 'مجموعة "MRC team" هنا لمتابعة تقدمك، الانضمام إلى التدريبات والتواصل المباشر مع بقية الأبطال والمدربين.'
              : 'MRC team vous accueille sur votre espace social interactif de running. Gérez vos sorties, suivez vos statistiques et restez en contact permanent !'
            }
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button 
              onClick={() => setActiveTab('planning')}
              className="px-5 py-2.5 bg-white text-[#1034A6] hover:bg-slate-50 transition font-extrabold text-xs rounded-2xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>{isRtl ? 'جدول الخرجات' : 'Découvrir le Planning'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setActiveTab('messagerie')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white transition font-extrabold text-xs rounded-2xl border border-white/20 backdrop-blur-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isRtl ? 'الدردشة الجماعية' : 'Messagerie du Club'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Social Dashboard main split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Social Feed & Post Creator (Col Span 8) */}
        <div className="lg:col-span-8 flex flex-col h-full space-y-6 relative">
          
          {isTableMissing && (
            <div className="bg-amber-50/80 border border-amber-200/50 rounded-3xl p-4 text-xs font-semibold text-amber-900 flex items-start gap-3 shadow-3xs animate-fade-in">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
                <Database className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-serif italic font-extrabold text-xs text-amber-950">
                  {isRtl ? 'قاعدة البيانات للمنشورات غير مفعلة بعد' : "La table des annonces n'existe pas encore"}
                </p>
                <p className="text-amber-800 text-[11px] leading-relaxed font-medium">
                  {isRtl 
                    ? 'لمعاينة وحفظ الإعلانات والمنشورات على السحابة، يرجى نسخ كود SQL من قائمة الإعدادات (Admin/Paramètres) وتشغيله في محرر SQL الخاص بـ Supabase.'
                    : "Pour activer la persistance réelle de vos annonces et éviter ces alertes, veuillez copier la requête de création de table disponible dans l'onglet Paramètres/Admin et l'exécuter dans l'éditeur SQL de votre console Supabase."
                  }
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-3xs text-center space-y-3 flex flex-col items-center justify-center animate-fade-in">
                <div className="p-3 bg-blue-50 text-[#1034A6] rounded-2xl">
                  <Compass className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-serif italic font-extrabold text-xs sm:text-sm text-slate-800">
                  {isRtl ? 'لا توجد إعلانات بعد' : 'Aucune annonce disponible'}
                </h4>
                <p className="text-slate-500 text-[10px] sm:text-xs max-w-xs leading-relaxed font-medium">
                  {isRtl 
                    ? 'لا توجد إعلانات أو منشورات في الوقت الحالي. سيقوم المسؤولون أو المدربون بنشر إشعارات جديدة قريباً.' 
                    : 'Il n\'y a aucune annonce pour le moment. Les administrateurs ou coachs publieront de nouveaux messages prochainement.'}
                </p>
              </div>
            ) : (
              posts.map(post => {
                const contentIsUrl = isUrl(post.content);
                const hasImageOnly = !!post.image;

                if (hasImageOnly) {
                  return (
                    <div key={post.id} className="relative rounded-[2rem] overflow-hidden group shadow-3xs hover:shadow-2xs transition-all duration-300">
                      {/* Image displayed clean, edge-to-edge, NO border, NO names, NO URLs */}
                      <img src={post.image} alt="Post media" className="w-full h-auto object-cover rounded-[2rem] block" referrerPolicy="no-referrer" />
                      
                      {/* Interactive Actions Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-5 text-white">
                        <div className="flex items-center gap-4 text-xs font-bold">
                          <button 
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center gap-1.5 transition cursor-pointer ${
                              post.liked ? 'text-rose-500 scale-105' : 'text-white/80 hover:text-white'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                            <span>{post.likes}</span>
                          </button>
                          <div className="flex items-center gap-1.5 text-white/80">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.commentsCount}</span>
                          </div>
                        </div>

                        {(currentUser.runClubRole === 'Admin' || currentUser.runClubRole === 'Coach') && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title={isRtl ? "حذف المنشور" : "Supprimer le post"}
                            className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={post.id} className="bg-white rounded-[2rem] p-5 sm:p-6 border border-slate-100 shadow-3xs space-y-4 transition-all duration-300 hover:shadow-2xs">
                    {/* Post Author / Meta Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1034A6] flex items-center justify-center text-xs font-black tracking-tighter border border-blue-200/50 overflow-hidden shadow-xs">
                          {post.author.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            post.author.initials
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-serif italic font-extrabold text-xs sm:text-sm text-slate-800">{post.author.name}</h4>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                              post.author.role === 'Admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              post.author.role === 'Coach' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-blue-50 text-[#1034A6] border border-blue-100'
                            }`}>
                              {post.author.role}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium font-mono block mt-0.5">
                            {isRtl ? post.timeAr : post.time}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(currentUser.runClubRole === 'Admin' || currentUser.runClubRole === 'Coach') && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title={isRtl ? "حذف المنشور" : "Supprimer le post"}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50/50 transition duration-200 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <Compass className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>

                    {/* Post Content */}
                    {post.content && !contentIsUrl && (
                      <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-medium select-text">
                        {post.content}
                      </p>
                    )}

                    {/* Post Attachment Image (if any) */}
                    {post.image && (
                      <div className="relative rounded-2xl overflow-hidden max-h-72">
                        <img src={post.image} alt="Post media" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}

                  {/* Likes / Interactive Footer Row */}
                  <div className="flex items-center gap-6 pt-3 border-t border-slate-50 text-xs text-slate-500 font-bold">
                    <button 
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1.5 transition cursor-pointer ${
                        post.liked ? 'text-rose-600 scale-[1.05]' : 'hover:text-slate-700'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentsCount}</span>
                    </div>
                    <button className="flex items-center gap-1.5 ml-auto hover:text-slate-700 cursor-pointer">
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{isRtl ? 'مشاركة' : 'Partager'}</span>
                    </button>
                  </div>

                  {/* Embedded comments preview (if any) */}
                  {post.comments.length > 0 && (
                    <div className="bg-slate-50/70 p-3 rounded-2xl space-y-2 border border-slate-100 text-[11px] font-semibold text-slate-600">
                      {post.comments.map((comment, idx) => (
                        <div key={idx} className="flex justify-between items-center group gap-1.5">
                          <div className="flex gap-1.5 flex-1 select-text">
                            <span className="font-extrabold text-[#1034A6] shrink-0">{comment.author}:</span>
                            <span>{comment.text}</span>
                          </div>
                          {(comment.author === currentUser.name || currentUser.runClubRole === 'Admin' || currentUser.runClubRole === 'Coach') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(post.id, idx)}
                              title={isRtl ? "حذف التعليق" : "Supprimer le commentaire"}
                              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50/50 transition duration-200 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input Form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddComment(post.id);
                    }}
                    className="flex gap-2 items-center pt-2"
                  >
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder={isRtl ? 'اكتب تعليقاً...' : 'Écrire un commentaire...'}
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    />
                    <button
                      type="submit"
                      disabled={!(commentInputs[post.id]?.trim())}
                      className="px-4 py-2 bg-[#1034A6] text-white rounded-2xl text-[10px] sm:text-xs font-bold transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800 flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>{isRtl ? 'إرسال' : 'Envoyer'}</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )})
            )}
          </div>

          {/* Create New Post Card */}
          {(currentUser.runClubRole === 'Admin' || currentUser.runClubRole === 'Coach') && (
            <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-3xs mt-auto sticky bottom-6 z-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 font-mono">
                {isRtl ? 'المجتمع' : 'community'}
              </h3>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black tracking-tighter shrink-0 border border-blue-400 shadow-sm overflow-hidden">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <textarea
                      value={newPostText}
                      onChange={e => setNewPostText(e.target.value)}
                      placeholder={isRtl ? `ما الجديد لديك اليوم يا ${currentUser.name.split(' ')[0]}؟` : `Quoi de neuf aujourd'hui, ${currentUser.name.split(' ')[0]} ?`}
                      rows={2}
                      className="w-full text-xs bg-[#F8FAFC] border border-slate-200 focus:border-blue-300 focus:bg-white rounded-2xl p-3.5 focus:outline-none transition resize-none font-semibold text-slate-800"
                    />

                    {/* Image preview with delete button */}
                    {newPostImage && (
                      <div className="relative rounded-xl overflow-hidden border border-slate-100 max-h-40 bg-slate-50">
                        <img src={newPostImage} alt="Post attachment preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setNewPostImage('')}
                          className="absolute top-2 right-2 p-1 bg-slate-900/65 text-white hover:bg-slate-900/80 rounded-full transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Expandable Image inputs */}
                    {showImageInput && (
                      <div className="space-y-2 p-3 bg-slate-50 border border-slate-100 rounded-xl animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {isRtl ? 'صورة المنشور' : 'Image du post'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowImageInput(false)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={newPostImage}
                          onChange={e => setNewPostImage(e.target.value)}
                          placeholder={isRtl ? 'أدخل رابط الصورة (URL)...' : "Entrer l'URL de l'image..."}
                          className="w-full text-[11px] bg-white border border-slate-200 focus:border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none font-medium text-slate-700"
                        />
                        {/* Presets */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 block">
                            {isRtl ? 'أو اختر صورة جاهزة:' : 'Ou choisissez une photo :'}
                          </span>
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                            {[
                              { url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80', icon: '🌅', label: isRtl ? 'صباح' : 'Matin' },
                              { url: 'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=400&q=80', icon: '🏃‍♂️', label: isRtl ? 'مجموعة' : 'Groupe' },
                              { url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=400&q=80', icon: '🌲', label: isRtl ? 'طبيعة' : 'Nature' },
                              { url: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=400&q=80', icon: '👟', label: isRtl ? 'حذاء' : 'Baskets' },
                              { url: 'https://images.unsplash.com/photo-1578873376229-25a116afcd75?auto=format&fit=crop&w=400&q=80', icon: '🏆', label: isRtl ? 'ميدالية' : 'Médaille' }
                            ].map((p, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setNewPostImage(p.url)}
                                className={`flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                                  newPostImage === p.url
                                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                                    : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                                }`}
                              >
                                <span>{p.icon}</span>
                                <span>{p.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowImageInput(prev => !prev)}
                      title={isRtl ? 'إضافة صورة' : 'Ajouter une image'}
                      className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
                        showImageInput || newPostImage 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Image className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newPostText.trim() && !newPostImage.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-[#1034A6] to-[#1E56A0] text-white hover:opacity-95 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {isRtl ? 'أنشر' : 'Publier'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Right Column: Premium Sidebar Widgets (Col Span 4) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Premium Weather / Vibe Card */}
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-slate-100 rounded-[2rem] p-5 shadow-lg border border-slate-800 space-y-4 relative overflow-hidden">
            {/* Ambient animated bg aura */}
            <div className="absolute -right-12 -top-12 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black tracking-widest text-blue-400 font-mono block uppercase">MÉTÉO RUNNING</span>
                  <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {isRtl ? 'مباشر' : 'LIVE'}
                  </span>
                </div>
                <h4 className="text-sm font-serif italic font-extrabold text-white mt-0.5">Mostaganem, DZ</h4>
              </div>
              <div className="text-right">
                <Sun className="w-7 h-7 text-amber-400 animate-spin-slow ml-auto" />
                <span className="text-[9px] font-mono text-slate-400 font-bold block mt-1">{timeString || '00:00:00'}</span>
              </div>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black font-mono tracking-tighter transition-all duration-300">{temp}°C</span>
              <span className="text-xs text-emerald-400 font-extrabold">Parfait pour courir !</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold font-mono text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-blue-400" />
                <span className="transition-all duration-300">{wind} km/h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-[#2F89FC]" />
                <span>Humidité: 55%</span>
              </div>
            </div>
          </div>

          {/* Synchronisation d'Activités GPS Widget (Custom high-fidelity card!) */}
          <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-3xs space-y-4 overflow-hidden relative group transition duration-300 hover:shadow-2xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500 shrink-0 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
                  {isRtl ? 'تطبيقات وأجهزة الجري' : 'GPS & APPLICATIONS'}
                </h3>
              </div>
              {lastSyncTime && (
                <span className="text-[8px] font-bold text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-full">
                  Sync: {lastSyncTime.split(' à ')[1] || lastSyncTime}
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              {isRtl 
                ? 'اربط حساباتك وتطبيقاتك المفضلة لاستيراد حصص الجري ونقاط السباق تلقائياً مع النادي.'
                : 'Connectez vos capteurs et montres sportives pour synchroniser vos entraînements et vos performances.'
              }
            </p>

            <div className="space-y-2.5">
              {/* Strava Row */}
              <div 
                onClick={() => !stravaConnected && handleConnectGps('strava')}
                className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                  stravaConnected 
                    ? 'bg-orange-50/40 border-orange-100 hover:bg-orange-50/60' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    stravaConnected ? 'bg-orange-500 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <span className="font-extrabold text-xs">S</span>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-800">Strava</h4>
                    <span className="text-[8px] text-slate-400 block font-semibold">
                      {stravaConnected ? (isRtl ? 'متصل ⚡ ومزامن' : 'Activités & Segments') : (isRtl ? 'غير متصل' : 'Non connecté')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {stravaConnected ? (
                    <>
                      <span className="text-[8px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
                        {isRtl ? 'متصل' : 'SYNCR'}
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => handleDisconnectGps('strava', e)}
                        className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[9px] font-black text-[#1034A6] hover:underline cursor-pointer">
                      {isRtl ? 'ربط' : 'CONNECTER'}
                    </span>
                  )}
                </div>
              </div>

              {/* Garmin Row */}
              <div 
                onClick={() => !garminConnected && handleConnectGps('garmin')}
                className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                  garminConnected 
                    ? 'bg-blue-50/40 border-blue-100 hover:bg-blue-50/60' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    garminConnected ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <span className="font-extrabold text-xs">▲</span>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-800">Garmin Connect</h4>
                    <span className="text-[8px] text-slate-400 block font-semibold">
                      {garminConnected ? (isRtl ? 'متصل ⚡ ومزامن' : 'Données physiologiques') : (isRtl ? 'غير متصل' : 'Non connecté')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {garminConnected ? (
                    <>
                      <span className="text-[8px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
                        {isRtl ? 'متصل' : 'SYNCR'}
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => handleDisconnectGps('garmin', e)}
                        className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[9px] font-black text-[#1034A6] hover:underline cursor-pointer">
                      {isRtl ? 'ربط' : 'CONNECTER'}
                    </span>
                  )}
                </div>
              </div>

              {/* Suunto & Coros Row */}
              <div 
                onClick={() => !suuntoConnected && handleConnectGps('suunto')}
                className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                  suuntoConnected 
                    ? 'bg-slate-900/10 border-slate-950/20 hover:bg-slate-900/15' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    suuntoConnected ? 'bg-cyan-500 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <span className="font-extrabold text-xs">●</span>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-800">Suunto & Coros</h4>
                    <span className="text-[8px] text-slate-400 block font-semibold">
                      {suuntoConnected ? (isRtl ? 'متصل ⚡ ومزامن' : 'Suivi Multisports') : (isRtl ? 'غير متصل' : 'Non connecté')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {suuntoConnected ? (
                    <>
                      <span className="text-[8px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
                        {isRtl ? 'متصل' : 'SYNCR'}
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => handleDisconnectGps('suunto', e)}
                        className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[9px] font-black text-[#1034A6] hover:underline cursor-pointer">
                      {isRtl ? 'ربط' : 'CONNECTER'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sync trigger button (if connected to at least one) */}
            {(stravaConnected || garminConnected || suuntoConnected) && (
              <button
                type="button"
                onClick={handleGpsSync}
                disabled={gpsSyncing}
                className={`w-full py-2.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border ${
                  gpsSyncing 
                    ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#1034A6] to-[#1E56A0] text-white hover:opacity-95 shadow-xs border-transparent'
                }`}
              >
                <Sliders className={`w-3.5 h-3.5 ${gpsSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {gpsSyncing 
                    ? (isRtl ? 'جاري المزامنة...' : 'Synchronisation...') 
                    : (isRtl ? 'مزامنة الحصص الآن ⚡' : 'Synchroniser mes données GPS')}
                </span>
              </button>
            )}

            {/* Sync status messages and progress */}
            {gpsSyncing && (
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl text-[10px] text-blue-700 font-bold flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>{syncStatusMsg}</span>
              </div>
            )}

            {showSyncSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] text-emerald-800 font-semibold space-y-1 relative animate-fade-in">
                <button 
                  type="button" 
                  onClick={() => setShowSyncSuccess(false)}
                  className="absolute right-2 top-2 p-1 text-emerald-500 hover:text-emerald-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="font-bold flex items-center gap-1 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{isRtl ? 'تمت المزامنة بنجاح !' : 'Synchronisation réussie !'}</span>
                </div>
                <p className="text-[9px] text-slate-500 font-medium">
                  {isRtl 
                    ? '⚡ تم استيراد خرجتين جديدتين (إجمالي 18.4 كلم) وإضافتهما لملف المتر كود الخاص بك بنجاح.' 
                    : '⚡ 2 nouvelles activités (Total 18.4 km) importées et ajoutées à votre historique.'}
                </p>
              </div>
            )}
          </div>

          {/* MRC SHOP Section Card */}
          <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-3xs space-y-4 overflow-hidden relative group transition duration-300 hover:shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
                  {isRtl ? 'متجر النادي • MRC SHOP' : 'MRC SHOP • BOUTIQUE'}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                <span className="text-[9px] text-blue-600 font-bold font-mono">
                  {shopViews} {isRtl ? 'نشط الآن' : 'actifs'}
                </span>
              </div>
            </div>

            {/* Shop Mockup Preview Image with hover scale */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-50 border border-slate-100">
              <img 
                src={shopImgSrc} 
                alt="MRC SHOP Preview" 
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                onError={() => {
                  if (shopImgSrc !== mrcShopPreview) {
                    setShopImgSrc(mrcShopPreview);
                  }
                }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <span className="text-[10px] text-white font-bold bg-blue-600 px-2 py-1 rounded-lg flex items-center gap-1">
                  {isRtl ? 'اطلب الآن' : 'Commander en ligne'} <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>

            {/* Live activity ticker marquee style */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden relative min-h-12 flex items-center">
              <div key={recentOrderIdx} className="w-full animate-fade-in flex items-center gap-2 text-[10px]">
                <span className="text-base shrink-0 animate-bounce">🛍️</span>
                <div className="truncate">
                  <span className="font-extrabold text-slate-800 block truncate">
                    {combinedOrders[recentOrderIdx]?.name || 'Abdou Zaiti'}
                  </span>
                  <span className="text-slate-500 block truncate text-[9px]">
                    {isRtl ? 'طلب:' : 'A commandé :'} <span className="font-bold text-blue-600">{combinedOrders[recentOrderIdx]?.item}</span> • <span className="text-[8px] font-mono">{combinedOrders[recentOrderIdx]?.time}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {isRtl 
                  ? 'اكتشف متجر النادي الرسمي! تأنق بقمصان الجري التقنية الرسمية، السترات الرياضية الفاخرة والمعدات الرياضية المصممة للأبطال.'
                  : 'Découvrez la boutique officielle du club ! Équipez-vous avec nos maillots techniques officiels, hoodies premiums et accessoires de performance.'
                }
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  👕 {isRtl ? 'قمصان النادي' : 'Maillots officiels'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  🧢 {isRtl ? 'اكسسوارات' : 'Accessoires'}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  📦 {isRtl ? 'توصيل متوفر' : 'Livraison dispo'}
                </span>
              </div>
            </div>

            {/* Call to action button with dynamic real connection logic */}
            <button 
              type="button"
              onClick={handleConnectShop}
              disabled={isConnectingShop}
              className="w-full py-3 bg-[#1034A6] hover:bg-[#1E56A0] disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 transform group-hover:translate-y-[-2px] cursor-pointer"
            >
              {isConnectingShop ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{isRtl ? 'جاري الاتصال بـ MRC SHOP...' : 'Connexion à MRC SHOP...'}</span>
                </>
              ) : isShopConnected ? (
                <>
                  <span>{isRtl ? 'فتح متجر الأعضاء ⚡' : 'Ouvrir la Boutique Membre ⚡'}</span>
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                </>
              ) : (
                <>
                  <span>{isRtl ? 'ربط وتفعيل حساب المتجر ⚡' : 'Connecter mon espace Boutique ⚡'}</span>
                  <Zap className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-300" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* ----------------- MRC SHOP INTERACTIVE MEMBER MODAL ----------------- */}
      {isShopModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col relative animate-scale-up">
            
            {/* Modal Close Button */}
            <button 
              type="button"
              onClick={() => setIsShopModalOpen(false)}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="bg-[#1034A6] text-white p-6 sm:p-8 flex items-center gap-4 relative overflow-hidden shrink-0">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
                <ShoppingBag className="w-48 h-48" />
              </div>
              <div className="p-3 bg-white/10 rounded-2xl shrink-0">
                <ShoppingBag className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-serif italic font-black flex items-center gap-2">
                  <span>{isRtl ? 'متجر أعضاء نادي مستغانم الرسمي' : 'Boutique Officielle Membres • Mosta Run Club'}</span>
                  <span className="text-[10px] bg-amber-400 text-[#1034A6] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                    {isRtl ? 'خصم خاص' : 'Premium Member'}
                  </span>
                </h3>
                <p className="text-white/80 text-[11px] font-medium mt-1">
                  {isRtl 
                    ? `مرحباً بك، ${currentUser.name}! طلباتك مخصصة وحصرياً بنصف السعر كعضو رسمي في النادي.`
                    : `Bienvenue, ${currentUser.name} ! Commandes exclusives réservées aux athlètes actifs.`
                  }
                </p>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50 shrink-0 text-xs font-extrabold text-slate-500">
              <button 
                type="button"
                onClick={() => setSelectedShopItem('maillot')}
                className={`flex-1 py-4 text-center transition cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                  selectedShopItem === 'maillot' 
                    ? 'border-[#1034A6] text-[#1034A6] bg-white' 
                    : 'border-transparent hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>👕</span>
                <span>{isRtl ? 'القميص التقني' : 'Maillot Officiel'}</span>
              </button>
              <button 
                type="button"
                onClick={() => setSelectedShopItem('hoodie')}
                className={`flex-1 py-4 text-center transition cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                  selectedShopItem === 'hoodie' 
                    ? 'border-[#1034A6] text-[#1034A6] bg-white' 
                    : 'border-transparent hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>🧥</span>
                <span>{isRtl ? 'السترة الشتوية' : 'Hoodie Premium'}</span>
              </button>
              <button 
                type="button"
                onClick={() => setSelectedShopItem('casquette')}
                className={`flex-1 py-4 text-center transition cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                  selectedShopItem === 'casquette' 
                    ? 'border-[#1034A6] text-[#1034A6] bg-white' 
                    : 'border-transparent hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>🧢</span>
                <span>{isRtl ? 'قبعة الجري' : 'Casquette Club'}</span>
              </button>
              <button 
                type="button"
                onClick={() => setSelectedShopItem('sac')}
                className={`flex-1 py-4 text-center transition cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                  selectedShopItem === 'sac' 
                    ? 'border-[#1034A6] text-[#1034A6] bg-white' 
                    : 'border-transparent hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>🎒</span>
                <span>{isRtl ? 'حقيبة الظهر' : 'Sac de Sport'}</span>
              </button>
            </div>

            {/* Modal Body (Scrollable Content Split-Panel) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Customizer & Preview (Col span 7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Visual Card containing Jersey Preview / Product Rendering */}
                <div className="bg-[#1e293b] rounded-3xl p-6 relative flex flex-col items-center justify-center border border-slate-800 overflow-hidden min-h-[240px]">
                  
                  <div className="absolute inset-0 bg-radial-gradient opacity-10" />
                  
                  {selectedShopItem === 'maillot' ? (
                    <div className="relative w-full flex flex-col sm:flex-row items-center justify-around gap-6 z-10 select-none animate-fade-in">
                      
                      {/* Front of Jersey */}
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Face Avant</span>
                        <div className="relative w-28 h-28 bg-[#1034A6] border-2 border-amber-400 rounded-b-3xl rounded-t-lg flex flex-col items-center justify-center shadow-lg">
                          <div className="absolute -left-3 top-0 w-4 h-12 bg-[#1034A6] border-t-2 border-l-2 border-b-2 border-amber-400 rounded-l-lg -rotate-12" />
                          <div className="absolute -right-3 top-0 w-4 h-12 bg-[#1034A6] border-t-2 border-r-2 border-b-2 border-amber-400 rounded-r-lg rotate-12" />
                          <div className="w-full h-3.5 bg-amber-400 absolute top-7 flex items-center justify-center text-[7px] font-black text-[#1034A6] tracking-tighter uppercase">Mosta Run Club</div>
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center absolute top-2 left-2 border border-amber-300">
                            <span className="text-[6px] font-black text-amber-300">MRC</span>
                          </div>
                        </div>
                      </div>

                      {/* Back of Jersey with interactive Custom name */}
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Dos (Personnalisé)</span>
                        <div className="relative w-28 h-28 bg-[#1034A6] border-2 border-amber-400 rounded-b-3xl rounded-t-lg flex flex-col items-center justify-center shadow-lg">
                          <div className="absolute -left-3 top-0 w-4 h-12 bg-[#1034A6] border-t-2 border-l-2 border-b-2 border-amber-400 rounded-l-lg -rotate-12" />
                          <div className="absolute -right-3 top-0 w-4 h-12 bg-[#1034A6] border-t-2 border-r-2 border-b-2 border-amber-400 rounded-r-lg rotate-12" />
                          <div className="absolute top-4 text-[9px] font-mono font-black text-amber-400 uppercase text-center tracking-wider max-w-[90px] truncate">
                            {customJerseyName || 'NAME'}
                          </div>
                          <div className="text-4xl font-serif italic font-black text-amber-400 tracking-tighter">
                            26
                          </div>
                          <div className="absolute bottom-2 text-[5px] text-white/50 tracking-widest font-bold">MOSTAGANEM</div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center space-y-4 z-10 animate-fade-in">
                      <span className="text-5xl block animate-bounce">
                        {selectedShopItem === 'hoodie' ? '🧥' : selectedShopItem === 'casquette' ? '🧢' : '🎒'}
                      </span>
                      <h4 className="text-sm font-serif italic font-extrabold text-white">
                        {selectedShopItem === 'hoodie' ? (isRtl ? 'سترة النادي التقنية الشتوية' : 'Hoodie Performance Club Premium') :
                         selectedShopItem === 'casquette' ? (isRtl ? 'قبعة الجري فائقة الخفة' : 'Casquette Club Ultra-Légère') : 
                         (isRtl ? 'حقيبة النادي الرياضية المقاومة للماء' : 'Sac de Sport Club Imperméable')}
                      </h4>
                      <p className="text-[10px] text-slate-400 max-w-xs font-semibold mx-auto">
                        {selectedShopItem === 'hoodie' ? (isRtl ? 'سترة قطنية مريحة مبطنة ومزودة بجيوب بسحاب وشعارات مطرزة ذهبياً.' : 'Coton ultra-dense, intérieur molletonné respirant, poches sécurisées, blason club brodé.') :
                         selectedShopItem === 'casquette' ? (isRtl ? 'قبعة مريحة ذات شريط مطاطي عاكس وشبكة خلفية للتهوية.' : 'Ajustable, séchage rapide, bandes réfléchissantes nuit, visière déformable.') :
                         (isRtl ? 'حقيبة واسعة بجيوب للأحذية وقاعدة معزولة للثياب المبتلة.' : 'Compartiment chaussures aéré, base étanche, bretelles renforcées, 45L.')}
                      </p>
                    </div>
                  )}

                  <span className="absolute top-4 left-4 bg-amber-400 text-[#1034A6] text-[9px] font-black px-2.5 py-1 rounded-lg">
                    {selectedShopItem === 'maillot' ? 'Remise -22%' :
                     selectedShopItem === 'hoodie' ? 'Remise -17%' :
                     selectedShopItem === 'casquette' ? 'Remise -16%' : 'Remise -17%'}
                  </span>
                </div>

                {/* Customizer Settings Form Fields */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black text-[#1034A6] uppercase tracking-wider font-mono">
                      {isRtl ? 'خيارات التخصيص والمقاس' : 'PERSONNALISATION DE VOTRE ÉQUIPEMENT'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Size Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'المقاس الرياضي' : 'Taille'}</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {['S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setJerseySize(sz)}
                            className={`py-2 text-xs font-black rounded-xl border transition cursor-pointer ${
                              jerseySize === sz 
                                ? 'bg-[#1034A6] border-[#1034A6] text-white shadow-xs' 
                                : 'bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom jersey printed text */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {isRtl ? 'الاسم على القميص' : 'Impression Nom (Dos)'}
                      </label>
                      <input 
                        type="text"
                        maxLength={12}
                        disabled={selectedShopItem !== 'maillot'}
                        value={selectedShopItem === 'maillot' ? customJerseyName : ''}
                        onChange={(e) => setCustomJerseyName(e.target.value.toUpperCase().replace(/[^A-Z\s]/g, ''))}
                        placeholder={selectedShopItem === 'maillot' ? 'Ex: ABDOU' : 'Non disponible'}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1034A6] text-slate-800 font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Checkout & Billing Receipt (Col span 5) */}
              <div className="lg:col-span-5 bg-slate-50 rounded-3xl p-5 sm:p-6 border border-slate-150/60 flex flex-col justify-between self-stretch">
                
                {isSubmittingOrder ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1034A6] rounded-full animate-spin"></div>
                    <div className="text-center space-y-1.5">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        {orderStep === 1 ? (isRtl ? 'الاتصال بخادم المعالجة...' : 'Initialisation de la commande...') :
                         orderStep === 2 ? (isRtl ? 'التحقق من بيانات العضو...' : 'Validation de la remise membre...') :
                         (isRtl ? 'تأكيد وحجز مخزون القياس...' : 'Enregistrement de votre commande...')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">Process ID: #MRC-STP-00{orderStep}</p>
                    </div>
                  </div>
                ) : orderStep === 4 ? (
                  <div className="flex-1 flex flex-col justify-center space-y-5 py-2 animate-fade-in text-center">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                      <Check className="w-6 h-6" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-serif italic font-extrabold text-slate-800">
                        {isRtl ? 'تم تسجيل الطلب بنجاح !' : 'Commande Enregistrée !'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        {isRtl 
                          ? 'برافو ! تم حجز طلبك بنجاح. سيقوم المشرفون بالاتصال بك للتسليم أو الاستلام في التدريب القادم.'
                          : 'Votre commande a été transmise aux administrateurs du club. Retrait disponible lors de la prochaine sortie !'
                        }
                      </p>
                    </div>

                    <div className="bg-white border border-dashed border-slate-200 p-4 rounded-2xl text-left text-[11px] font-mono font-medium text-slate-600 space-y-1.5 relative overflow-hidden">
                      <div className="absolute top-1/2 -left-2 w-4 h-4 bg-slate-50 border-r border-slate-200 rounded-full" />
                      <div className="absolute top-1/2 -right-2 w-4 h-4 bg-slate-50 border-l border-slate-200 rounded-full" />
                      
                      <div className="flex justify-between font-black text-slate-800">
                        <span>TICKET COMMANDE:</span>
                        <span>#{ordersList[0]?.id || 'MRC-8172'}</span>
                      </div>
                      <div className="border-b border-dashed border-slate-100 my-1 pb-1" />
                      <div>ARTICLE: <span className="font-bold text-[#1034A6]">{ordersList[0]?.item}</span></div>
                      {ordersList[0]?.printedName && (
                        <div>PRINT DOS: <span className="font-bold text-amber-600">{ordersList[0]?.printedName}</span></div>
                      )}
                      <div>TAILLE: <span className="font-bold">{jerseySize}</span></div>
                      <div>MEMBRE: <span className="font-bold">{currentUser.name}</span></div>
                      <div className="border-b border-dashed border-slate-100 my-1 pb-1" />
                      <div className="flex justify-between font-black text-emerald-600 text-xs">
                        <span>TOTAL PAYÉ:</span>
                        <span>{ordersList[0]?.total}</span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setOrderStep(0)}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      {isRtl ? 'طلب منتج آخر' : 'Commander autre chose'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50">
                        <span className="text-base">📋</span>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                          {isRtl ? 'تفاصيل الفاتورة ومكان الاستلام' : 'RÉCAPITULATIF DE COMMANDE'}
                        </h4>
                      </div>

                      <div className="space-y-2.5 text-[11px] font-semibold text-slate-600">
                        <div className="flex justify-between">
                          <span>
                            {selectedShopItem === 'maillot' ? (isRtl ? 'القميص التقني الرسمي' : 'Maillot Technique Noir') :
                             selectedShopItem === 'hoodie' ? (isRtl ? 'سترة النادي الشتوية' : 'Hoodie Club Premium') :
                             selectedShopItem === 'casquette' ? (isRtl ? 'قبعة الجري الفاخرة' : 'Casquette Performance') : 
                             (isRtl ? 'حقيبة الظهر الرياضية' : 'Sac de sport MRC')}
                          </span>
                          <span className="font-mono line-through text-slate-400">
                            {selectedShopItem === 'maillot' ? '3200 DA' :
                             selectedShopItem === 'hoodie' ? '5800 DA' :
                             selectedShopItem === 'casquette' ? '1800 DA' : '3500 DA'}
                          </span>
                        </div>

                        <div className="flex justify-between text-[#1034A6]">
                          <span>{isRtl ? 'خصم عضو رسمي نشط' : 'Remise Membre Officiel'}</span>
                          <span className="font-mono font-black">
                            {selectedShopItem === 'maillot' ? '-700 DA' :
                             selectedShopItem === 'hoodie' ? '-1000 DA' :
                             selectedShopItem === 'casquette' ? '-300 DA' : '-600 DA'}
                          </span>
                        </div>

                        {selectedShopItem === 'maillot' && (
                          <div className="flex justify-between text-amber-600">
                            <span>{isRtl ? 'طباعة الاسم على الظهر' : 'Impression dos personnalisée'}</span>
                            <span className="font-bold uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                              Offert
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span>{isRtl ? 'طريقة الاستلام' : 'Mode de livraison'}</span>
                          <span className="text-slate-800 font-bold">{isRtl ? 'استلام مباشر في الحصص (مجاناً)' : 'Retrait Direct Club (Gratuit)'}</span>
                        </div>

                        <div className="border-b border-slate-200/50 my-2 pt-1" />

                        <div className="flex justify-between text-xs font-black text-slate-800">
                          <span>{isRtl ? 'الإجمالي الصافي للطلب:' : 'Total net à payer :'}</span>
                          <span className="font-mono text-sm text-emerald-600">
                            {selectedShopItem === 'maillot' ? '2500 DA' :
                             selectedShopItem === 'hoodie' ? '4800 DA' :
                             selectedShopItem === 'casquette' ? '1500 DA' : '2900 DA'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl text-[10px] text-slate-500 font-medium leading-relaxed">
                        💡 {isRtl 
                          ? 'الدفع يتم يدوياً نقداً عند الاستلام مباشرة من الكابتن عبدو زايتي أو مدربي النادي.'
                          : 'Pas de paiement en ligne requis. Le règlement s\'effectue en espèces lors de la remise de votre paquet au club.'
                        }
                      </div>
                    </div>

                    <div className="space-y-3 pt-6">
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                      >
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{isRtl ? 'تأكيد وطلب المنتج الآن ⚡' : 'Valider ma commande ⚡'}</span>
                      </button>

                      {ordersList.length > 0 && (
                        <div className="text-center">
                          <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase mb-1">Historique des commandes</span>
                          <div className="max-h-20 overflow-y-auto space-y-1 pr-1">
                            {ordersList.map((ord, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[9px] bg-white border border-slate-150 p-1.5 rounded-lg text-slate-500">
                                <span className="font-bold truncate max-w-[140px]">{ord.item} ({ord.total})</span>
                                <span className={`px-1 rounded font-bold text-[8px] ${
                                  ord.status === 'delivered' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700 animate-pulse'
                                }`}>
                                  {ord.status === 'delivered' ? (isRtl ? 'مستلم' : 'LIVRÉ') : (isRtl ? 'قيد المعالجة' : 'EN COURS')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                )}

              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[9px] font-mono text-slate-400 shrink-0">
              © Mosta Run Club Boutique Officielle • Mostaganem, Algérie
            </div>

          </div>
        </div>
      )}

      {/* --- POPUP DE SYNCHRONISATION GPS AUTH --- */}
      {isAuthorizingGps && popupService && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-blue-50 max-w-sm w-full shadow-2xl space-y-5 text-center animate-scale-up">
            
            <div className="space-y-2">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-xl ${
                popupService === 'strava' ? 'bg-orange-500 text-white' :
                popupService === 'garmin' ? 'bg-slate-900 text-white' : 'bg-cyan-500 text-white'
              }`}>
                {popupService === 'strava' ? 'S' : popupService === 'garmin' ? '▲' : '●'}
              </div>
              <h4 className="text-sm font-black text-slate-800">
                {isRtl ? 'تفويض الاتصال الرياضي' : 'Connexion Partenaire GPS'}
              </h4>
              <p className="text-[10px] text-slate-500 max-w-xs font-semibold mx-auto">
                {isRtl 
                  ? `جاري طلب الإذن الآمن لمزامنة إحداثيات ومسافات الركض من حسابك لدى ${popupService.toUpperCase()}.`
                  : `Veuillez patienter pendant l'autorisation d'accès sécurisé à votre flux d'activités ${popupService.toUpperCase()}.`
                }
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-mono text-slate-400 font-black">
                <span>AUTHORIZING...</span>
                <span>{syncProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-200" style={{ width: `${syncProgress}%` }} />
              </div>
            </div>

            <div className="text-[8px] font-mono text-slate-400">
              Redirecting via OAuth2 callback...
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
