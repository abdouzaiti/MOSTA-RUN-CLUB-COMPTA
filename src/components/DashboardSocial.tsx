import React, { useState, useEffect, useRef } from 'react';
import { Runner, Run, Announcement } from '../types';
import { Language, translations } from '../translations';
import { isSupabaseConfigured, dbService } from '../supabaseClient';
import { 
  Sparkles, Flame, Trophy, MapPin, Calendar, Heart, 
  MessageSquare, Share2, Compass, Sun, Wind, CloudRain,
  UserPlus, ArrowRight, Zap, Award, Target, TrendingUp,
  ShoppingBag, ExternalLink, Clock, Trash2, Database, Send
} from 'lucide-react';
import mrcShopPreview from '../assets/images/mrc_shop_preview_1783012220849.jpg';

interface DashboardSocialProps {
  runners: Runner[];
  runs: Run[];
  currentUser: Runner;
  onToggleRegister: (runId: string) => void;
  setActiveTab: (tab: string) => void;
  language: Language;
}

export default function DashboardSocial({ 
  runners, 
  runs, 
  currentUser, 
  onToggleRegister, 
  setActiveTab,
  language 
}: DashboardSocialProps) {
  const isRtl = language === 'ar';
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
    if (!newPostText.trim()) return;

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
      content: newPostText,
      image: null,
      likes: 0,
      liked: false,
      likedBy: [],
      commentsCount: 0,
      comments: []
    };

    setPosts([newPostUi, ...posts]);
    setNewPostText('');

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
          content: newPostText,
          imageUrl: undefined,
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

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Welcome / Hero Banner Banner Section */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#1034A6] via-[#1E56A0] to-[#2F89FC] text-white p-6 sm:p-8 shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 p-8 opacity-40 pointer-events-none transform translate-x-8 -translate-y-12 blur-[2px]">
          <img src="/logo.png" alt="Logo" className="w-80 h-80 object-contain drop-shadow-xl brightness-0 invert" />
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
              posts.map(post => (
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
                  <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-medium select-text">
                    {post.content}
                  </p>

                  {/* Post Attachment Image (if any) */}
                  {post.image && (
                    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 max-h-72">
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
              ))
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
                  <textarea
                    value={newPostText}
                    onChange={e => setNewPostText(e.target.value)}
                    placeholder={isRtl ? `ما الجديد لديك اليوم يا ${currentUser.name.split(' ')[0]}؟` : `Quoi de neuf aujourd'hui, ${currentUser.name.split(' ')[0]} ?`}
                    rows={2}
                    className="flex-1 w-full text-xs bg-[#F8FAFC] border border-slate-200 focus:border-blue-300 focus:bg-white rounded-2xl p-3.5 focus:outline-none transition resize-none font-semibold text-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex gap-1.5" />
                  <button
                    type="submit"
                    disabled={!newPostText.trim()}
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
                    {recentOrders[recentOrderIdx].name}
                  </span>
                  <span className="text-slate-500 block truncate text-[9px]">
                    {isRtl ? 'طلب:' : 'A commandé :'} <span className="font-bold text-blue-600">{recentOrders[recentOrderIdx].item}</span> • <span className="text-[8px] font-mono">{recentOrders[recentOrderIdx].time}</span>
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

            {/* Call to action anchor styled as button */}
            <a 
              href="https://mrc-shop.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#1034A6] hover:bg-[#1E56A0] text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 transform group-hover:translate-y-[-2px] cursor-pointer"
            >
              <span>{isRtl ? 'زيارة المتجر الإلكتروني' : 'Visiter MRC SHOP'}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>

          {/* Upcoming Training Highlight */}
          <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
                {isRtl ? 'التدريب المقبل' : 'PROCHAIN RUN'}
              </h3>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-[9px] text-rose-500 font-black font-mono">COUNTDOWN</span>
              </div>
            </div>

            {/* LIVE COUNTDOWN TIMER BLOCK */}
            <div className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/15 p-3 rounded-2xl flex items-center gap-2.5">
              <div className="p-2 bg-rose-500 text-white rounded-xl animate-pulse">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-rose-700 font-black block uppercase tracking-wider">
                  {isRtl ? 'العد التنازلي المباشر' : 'DÉCOMPTE EN DIRECT'}
                </span>
                <span className="text-[11px] font-mono font-black text-slate-800 block tracking-tight truncate">
                  {countdownStr}
                </span>
              </div>
            </div>

            {upcomingRuns.length > 0 ? (
              upcomingRuns.map(run => {
                const isMyRun = run.participants.some(p => p.id === currentUser.id);
                return (
                  <div key={run.id} className="p-3 bg-blue-50/45 hover:bg-blue-50 border border-blue-100/50 rounded-2xl space-y-2.5 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-serif italic font-extrabold text-xs sm:text-sm text-slate-800">{run.title}</h4>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">📅 {run.date} @ {run.time}</span>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded border border-emerald-100">
                        {run.distance} km
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="font-semibold text-slate-500">{run.participants.length} athlètes</span>
                      <button
                        onClick={() => onToggleRegister(run.id)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition ${
                          isMyRun 
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                            : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
                        }`}
                      >
                        {isMyRun 
                          ? (isRtl ? 'إلغاء' : 'Désister') 
                          : (isRtl ? 'تسجيل' : 'Participer')
                        }
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 font-medium py-2">Aucune sortie planifiée pour le moment.</p>
            )}
          </div>



        </div>

      </div>

    </div>
  );
}
