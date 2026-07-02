import React, { useState } from 'react';
import { Runner, Run } from '../types';
import { Language, translations } from '../translations';
import { 
  Sparkles, Flame, Trophy, MapPin, Calendar, Heart, 
  MessageSquare, Share2, Compass, Sun, Wind, CloudRain,
  UserPlus, ArrowRight, Zap, Award, Target, TrendingUp,
  ShoppingBag, ExternalLink
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

  // Mock social feed posts
  const [posts, setPosts] = useState([
    {
      id: 'post-1',
      author: {
        name: 'Abdou Zaiti',
        avatarUrl: currentUser.avatarUrl || null,
        role: 'Admin',
        initials: 'AZ'
      },
      time: 'Il y a 2 heures',
      timeAr: 'منذ ساعتين',
      content: '🚨 Les gars, la sortie de ce vendredi à Mostaganem s\'annonce magnifique ! Le bus démarre à 06:00 précises de la Posta. Préparez vos gourdes de l\'eau et votre motivation maximale ! 🏃‍♂️🔥',
      image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
      likes: 24,
      liked: true,
      commentsCount: 5,
      comments: [
        { author: 'Amine R.', text: 'Présent à 100% ! 🔥' },
        { author: 'Sofiane K.', text: 'Le tracé de 18km va piquer mais on est prêts.' }
      ]
    },
    {
      id: 'post-2',
      author: {
        name: 'Coach Redouane',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        role: 'Coach',
        initials: 'CR'
      },
      time: 'Hier à 18:30',
      timeAr: 'أمس في 18:30',
      content: 'Conseil de coach du jour : Ne négligez pas vos étirements après les sorties longues. Hydratez-vous avec de l\'eau riche en magnésium. On se voit vendredi pour exploser les chronos individuels ! 💪',
      image: null,
      likes: 18,
      liked: false,
      commentsCount: 2,
      comments: []
    }
  ]);

  const [newPostText, setNewPostText] = useState('');

  const handleLikePost = (postId: string) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: p.liked ? p.likes - 1 : p.likes + 1,
          liked: !p.liked
        };
      }
      return p;
    }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost = {
      id: 'post-' + Date.now(),
      author: {
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl || null,
        role: currentUser.runClubRole || 'Membre',
        initials: currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      },
      time: 'À l\'instant',
      timeAr: 'الآن',
      content: newPostText,
      image: null,
      likes: 0,
      liked: false,
      commentsCount: 0,
      comments: []
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
  };

  // Get active upcoming runs
  const upcomingRuns = runs.filter(r => !r.completed).slice(0, 2);

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
          
          <div className="space-y-6">
            {posts.map(post => (
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
                  <Compass className="w-4 h-4 text-slate-300" />
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
                      <div key={idx} className="flex gap-1.5">
                        <span className="font-extrabold text-[#1034A6] shrink-0">{comment.author}:</span>
                        <span>{comment.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Create New Post Card */}
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
                <div className="flex gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold font-mono">⚡ PostaGang N°27 Collective</span>
                </div>
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

        </div>

        {/* Right Column: Premium Sidebar Widgets (Col Span 4) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Premium Weather / Vibe Card */}
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-slate-100 rounded-[2rem] p-5 shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black tracking-widest text-blue-400 font-mono block uppercase">MÉTÉO RUNNING</span>
                <h4 className="text-sm font-serif italic font-extrabold text-white mt-0.5">Mostaganem, DZ</h4>
              </div>
              <Sun className="w-7 h-7 text-amber-400 animate-spin-slow" />
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black font-mono">24°C</span>
              <span className="text-xs text-emerald-400 font-extrabold">Parfait pour courir !</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold font-mono text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-blue-400" />
                <span>12 km/h</span>
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
              <span className="text-[9px] bg-blue-50 text-blue-600 font-black px-2.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                {isRtl ? 'جديد' : 'NEW'}
              </span>
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
              <Calendar className="w-4 h-4 text-blue-500" />
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

          {/* Quick Hall of Fame Awards Box */}
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-[2rem] p-5 border border-amber-500/15 shadow-3xs space-y-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Award className="w-5 h-5 text-amber-500 animate-bounce" />
              <h4 className="font-serif italic font-black text-xs sm:text-sm uppercase tracking-wider">{isRtl ? 'أبطال الأسبوع' : 'Tableau d\'Honneur'}</h4>
            </div>
            
            <p className="text-[11px] text-amber-800/80 leading-relaxed font-semibold">
              Félicitations collectives aux athlètes ayant le plus grand engagement cette semaine dans la PostaGang !
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-500/10 shadow-3xs text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥇</span>
                  <span className="font-bold text-slate-800">Abdou Zaiti</span>
                </div>
                <span className="font-mono text-amber-700 font-black">28.4 km / sem</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-500/10 shadow-3xs text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥈</span>
                  <span className="font-bold text-slate-800">Coach Redouane</span>
                </div>
                <span className="font-mono text-amber-700 font-black">21.0 km / sem</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
