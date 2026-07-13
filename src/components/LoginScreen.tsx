import React, { useState } from 'react';
import { Runner } from '../types';
import { ShieldCheck, User, Lock, Phone, Mail, HeartPulse, Sparkles, LogIn, ArrowRight, Eye, EyeOff, Globe, MessageSquare, X, HelpCircle, ArrowLeft, Headphones } from 'lucide-react';
import { translations, Language } from '../translations';
import AdminSupportChat from './AdminSupportChat';

interface LoginScreenProps {
  runners: Runner[];
  onLoginSuccess: (user: Runner) => void;
  onUpdateRunner: (user: Runner) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  girlMode?: boolean;
  setGirlMode?: (mode: boolean) => void;
  unreadSupportCount?: number;
}

export default function LoginScreen({ 
  runners, 
  onLoginSuccess, 
  onUpdateRunner, 
  language, 
  setLanguage, 
  girlMode, 
  setGirlMode,
  unreadSupportCount = 0
}: LoginScreenProps) {
  const t = (key: string) => (translations[language] as any)[key] || (translations['fr'] as any)[key] || key;
  
  // Authentication states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Profile setup states (for first-time login)
  const [tempLoggedInUser, setTempLoggedInUser] = useState<Runner | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneSetup, setPhoneSetup] = useState('');
  const [emailSetup, setEmailSetup] = useState('');
  const [bloodTypeSetup, setBloodTypeSetup] = useState('O+');
  const [setupError, setSetupError] = useState('');

  // Live Support Chat states
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [guestName, setGuestName] = useState(() => localStorage.getItem('mrc_guest_name') || '');
  const [guestId, setGuestId] = useState(() => {
    let id = localStorage.getItem('mrc_guest_id');
    if (!id) {
      id = 'guest-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('mrc_guest_id', id);
    }
    return id;
  });
  const [hasSetGuestName, setHasSetGuestName] = useState(() => !!localStorage.getItem('mrc_guest_name'));
  const [selectedAthleteId, setSelectedAthleteId] = useState(() => localStorage.getItem('mrc_guest_athlete_id') || '');
  const [inputName, setInputName] = useState('');

  const getChatUser = (): Runner => {
    if (selectedAthleteId) {
      const runner = runners.find(r => r.id === selectedAthleteId);
      if (runner) return runner;
    }
    return {
      id: guestId,
      name: guestName || 'Visiteur MRC',
      avatarUrl: undefined,
      phone: '',
      email: '',
      bloodType: 'O+',
      runClubRole: 'Membre',
      password: '',
      passwordChanged: false
    };
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال بيانات الاعتماد الخاصة بك.' : 'Veuillez entrer vos identifiants.');
      return;
    }

    // Search by name (username), phone, or email
    const idClean = identifier.trim().toLowerCase();
    // also support typing with "@" prefix like "@abdou_z"
    const parsedId = idClean.startsWith('@') ? idClean.substring(1) : idClean;

    const foundUser = runners.find(r => 
      r.name.toLowerCase() === parsedId ||
      (r.username && r.username.toLowerCase() === parsedId) ||
      (r.phone && r.phone.replace(/\s+/g, '') === parsedId.replace(/\s+/g, '')) ||
      (r.email && r.email.toLowerCase() === parsedId)
    );

    if (!foundUser) {
      setErrorMsg(language === 'ar' ? 'العداء غير مدرج. اطلب من عبدو زايتي (المسؤول) إضافتك إلى القائمة!' : "Athlète non répertorié. Demandez à Abdou Zaiti (Admin) de vous ajouter au roster !");
      return;
    }

    // Verify password
    // If the athlete has never changed their password, the temporary password is their exact name string or unique username
    const expectedPassword = foundUser.password || foundUser.name;
    const isInitialMatch = !foundUser.passwordChanged && (password === foundUser.name || (foundUser.username && password === foundUser.username));
    
    if (password !== expectedPassword && !isInitialMatch) {
      setErrorMsg(language === 'ar' ? 'كلمة المرور غير صحيحة. بالنسبة للحساب الجديد، أدخل اسمك الكامل (أو اسم المستخدم) للتفعيل.' : "Mot de passe incorrect. Pour un nouveau compte, saisissez votre Nom Complet (ou votre nom d'utilisateur) pour activer.");
      return;
    }

    // Correct password! Now check if password changes are pending
    if (!foundUser.passwordChanged) {
      // Prompt profile upgrade setup screen
      setTempLoggedInUser(foundUser);
      setPhoneSetup(foundUser.phone || '');
      setEmailSetup(foundUser.email || '');
      setBloodTypeSetup(foundUser.bloodType || 'O+');
    } else {
      // Normal login success!
      onLoginSuccess(foundUser);
    }
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    if (!newPassword.trim()) {
      setSetupError('Veuillez saisir votre nouveau mot de passe sécurisé.');
      return;
    }

    if (newPassword === tempLoggedInUser?.name) {
      setSetupError('Votre nouveau mot de passe ne doit pas être identique à votre nom.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSetupError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (!phoneSetup.trim()) {
      setSetupError("Veuillez introduire votre numéro de téléphone pour les fiches d'urgence.");
      return;
    }

    if (!emailSetup.trim() || !emailSetup.includes('@')) {
      setSetupError("Veuillez configurer une adresse email valide.");
      return;
    }

    if (!tempLoggedInUser) return;

    // Build the fully established, upgraded profile
    const savedProfiles: Runner = {
      ...tempLoggedInUser,
      password: newPassword.trim(),
      passwordChanged: true,
      phone: phoneSetup.trim(),
      email: emailSetup.trim().toLowerCase(),
      bloodType: bloodTypeSetup
    };

    // Save and sign in
    onUpdateRunner(savedProfiles);
    onLoginSuccess(savedProfiles);
  };

  // View template switcher
  if (tempLoggedInUser) {
    return (
      <div className={`min-h-screen bg-natural-bg text-natural-text font-sans flex items-center justify-center p-4 ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-lg bg-white rounded-3xl border border-natural-border shadow-md overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-6 bg-natural-olive/10 border-b border-natural-divider text-center space-y-2 relative">
            <img src={girlMode ? "/pinklogo.png" : "/logo.png"} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
            <div className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1`}>
              <Sparkles className="w-3 h-3 animate-pulse" />
              {language === 'ar' ? 'عضو جديد !' : 'Nouveau membre !'}
            </div>
            
            <h2 className="text-xl font-serif italic font-black text-natural-olive">
              {language === 'ar' ? '🔑 أول تسجيل دخول • نادي مستغانم للجري' : '🔑 Première Connexion • Mosta Run Club'}
            </h2>
            <p className="text-[11px] text-natural-sage font-medium max-w-sm mx-auto leading-relaxed">
              {language === 'ar' ? `السلام عليكم ` : 'Salam '} <strong className="text-natural-text">{tempLoggedInUser.name}</strong> ! {language === 'ar' ? 'لتفعيل حسابك، يرجى تخصيص كلمة المرور الخاصة بك وإكمال بياناتك الإلزامية.' : 'Pour activer votre compte, veuillez personnaliser votre mot de passe et remplir vos coordonnées obligatoires.'}
            </p>
          </div>

          <form onSubmit={handleSetupSubmit} className="p-6 space-y-4 text-xs">
            {setupError && (
              <div className="p-3 bg-rose-50 text-rose-700 font-bold rounded-xl border border-rose-100">
                ⚠️ {setupError}
              </div>
            )}

            {/* Custom password inputs */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl space-y-3">
              <span className="font-mono text-[10px] block font-bold text-amber-800 uppercase tracking-wider">
                {language === 'ar' ? '🔒 تأمين كلمة المرور' : '🔒 Sécurisation du mot de passe'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={language === 'ar' ? 'text-right' : ''}>
                  <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono">{language === 'ar' ? 'كلمة المرور الجديدة *' : 'Nouveau mot de passe *'}</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={language === 'ar' ? 'على الأقل 4 أحرف...' : 'Au moins 4 caractères...'}
                    className={`w-full px-3 py-2 border border-natural-border bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text font-semibold ${language === 'ar' ? 'text-right' : ''}`}
                  />
                </div>
                <div className={language === 'ar' ? 'text-right' : ''}>
                  <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono">{language === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirmer le mot de passe *'}</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={language === 'ar' ? 'أعد كتابة كلمة المرور...' : 'Retapez-le mot de passe...'}
                    className={`w-full px-3 py-2 border border-natural-border bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text font-semibold ${language === 'ar' ? 'text-right' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* Technical medical profile inputs */}
            <div className="space-y-3">
              <span className="font-mono text-[10px] block font-bold text-natural-olive uppercase tracking-wider">
                👤 Informations de Fiche Athlète
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-natural-accent" />
                    Téléphone personnel *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneSetup}
                    onChange={e => setPhoneSetup(e.target.value)}
                    placeholder="Ex. 0661987654"
                    className="w-full px-3 py-2 border border-natural-border bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono flex items-center gap-1">
                    <Mail className="w-3 h-3 text-natural-accent" />
                    Adresse Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={emailSetup}
                    onChange={e => setEmailSetup(e.target.value)}
                    placeholder="Ex. hamid@gmail.com"
                    className="w-full px-3 py-2 border border-natural-border bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  Groupe Sanguin (Crucial pour la sécurité côtière)
                </label>
                <select
                  value={bloodTypeSetup}
                  onChange={e => setBloodTypeSetup(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text font-semibold"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                <p className="text-[10px] text-natural-sage mt-1 font-medium">
                  * Indiquer votre vrai groupe sanguin aide notre équipe d'encadrement en cas de blessures ou d'urgence.
                </p>
              </div>
            </div>

            <div className={`pt-4 border-t border-natural-divider flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={() => setTempLoggedInUser(null)}
                className="text-natural-sage font-bold hover:underline"
              >
                {language === 'ar' ? 'عودة' : language === 'en' ? 'Back' : 'Retour'}
              </button>
              <button
                type="submit"
                className="bg-natural-olive hover:bg-natural-olive-hover text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer font-serif italic text-xs shadow-xs"
              >
                {language === 'ar' ? "الانتهاء وفتح مساحة العداء" : language === 'en' ? "Finalize & Open Athlete Space" : "Finaliser et Ouvrir l'Espace Athlète"}
                <ArrowRight className="w-4 h-4 text-natural-accent" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen relative grid grid-cols-1 lg:grid-cols-2 items-center p-4 pt-4 sm:pt-12 lg:p-12 xl:p-16 bg-cover bg-center bg-fixed ${language === 'ar' ? 'font-arabic' : ''}`} 
      dir="ltr"
      style={{ backgroundImage: "url('/back.png')" }}
    >
      {/* Top Left Logo */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-10 animate-fade-in flex items-center gap-2 sm:gap-3">
        <img 
          src={girlMode ? "/pinklogo.png" : "/logo.png"} 
          alt="Mosta Run Club" 
          className="w-10 h-10 sm:w-20 sm:h-20 object-contain drop-shadow-lg" 
        />
        <div className="flex flex-col text-left leading-tight">
          <span className="text-sm sm:text-lg font-black text-brand-blue tracking-wider uppercase drop-shadow-sm font-sans">
            One Club
          </span>
          <span className="text-[10px] sm:text-sm font-bold text-white italic tracking-wide font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
            One Family...
          </span>
        </div>
      </div>

      {/* Spacer on the left for large screens */}
      <div className="hidden lg:block" />

      {/* Right Content: Login Form */}
      <div 
        dir="ltr"
        className="flex flex-col items-center justify-center w-full max-w-md gap-4 z-10 lg:justify-self-end justify-self-center"
      >
        {/* Floating Language Selector */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 animate-fade-in z-10">
          <button 
            onClick={() => setLanguage('en')} 
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[9px] sm:text-[10px] tracking-wider font-extrabold transition-all duration-200 uppercase shadow-sm hover:scale-105 active:scale-95 ${
              language === 'en' 
                ? 'bg-blue-600 text-white shadow-blue-500/20 ring-2 ring-blue-600/5' 
                : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            ENGLISH
          </button>
          <button 
            onClick={() => setLanguage('fr')} 
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[9px] sm:text-[10px] tracking-wider font-extrabold transition-all duration-200 uppercase shadow-sm hover:scale-105 active:scale-95 ${
              language === 'fr' 
                ? 'bg-blue-600 text-white shadow-blue-500/20 ring-2 ring-blue-600/5' 
                : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            FRANÇAIS
          </button>
          <button 
            onClick={() => setLanguage('ar')} 
            className={`px-3.5 py-1.5 sm:px-4.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-black transition-all duration-200 shadow-sm hover:scale-105 active:scale-95 ${
              language === 'ar' 
                ? 'bg-blue-600 text-white font-arabic shadow-blue-500/20 ring-2 ring-blue-600/5' 
                : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-100 hover:bg-slate-50 font-arabic'
            }`}
          >
            العربية
          </button>

          {/* Mode Toggle Trigger */}
          <button
            onClick={() => setGirlMode && setGirlMode(!girlMode)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[9px] sm:text-[10px] tracking-wider font-extrabold transition-all duration-200 uppercase shadow-sm hover:scale-105 active:scale-95 flex items-center gap-1.5 border ${
              girlMode 
                ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-pink-100/50' 
                : 'bg-blue-50 border-blue-100 text-blue-600 shadow-blue-100/50'
            }`}
          >
            <span className="animate-pulse">🌸</span>
            <span>{language === 'ar' ? 'الوضع' : 'MODE'}</span>
          </button>
        </div>

        <div 
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-[2rem] sm:rounded-[3rem] border border-natural-border shadow-2xl overflow-hidden p-6 sm:p-10 animate-fade-in text-xs space-y-4 sm:space-y-6"
        >
          <div className="border-b border-natural-divider pb-3 sm:pb-4 text-center">
            <h2 className="font-extrabold font-sans text-natural-olive text-lg sm:text-xl uppercase tracking-wider">{t('login')}</h2>
            <p className="text-[10px] sm:text-[11px] text-natural-sage font-bold mt-0.5 sm:mt-1 font-sans uppercase opacity-80 tracking-wider">{t('welcome')}</p>
          </div>

          {errorMsg && (
            <div className="p-3 sm:p-4 bg-rose-50 text-rose-700 font-bold rounded-xl sm:rounded-2xl border border-rose-100 leading-relaxed font-sans text-[10px] sm:text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-1">
              <label className="block text-[9px] sm:text-[10px] font-bold text-natural-olive px-1 font-sans uppercase tracking-wider">
                {t('username')}
              </label>
              <div className="relative group">
                <User className={`absolute ${language === 'ar' ? 'right-3.5' : 'left-3.5'} top-3 w-4 h-4 text-natural-sage group-focus-within:text-natural-olive transition-colors`} />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className={`w-full ${language === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'} py-2.5 sm:py-3.5 bg-natural-bone/50 text-natural-text border border-natural-border rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive font-semibold font-sans transition-all`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] sm:text-[10px] font-bold text-natural-olive px-1 font-sans uppercase tracking-wider">
                {t('password')}
              </label>
              <div className="relative group">
                <Lock className={`absolute ${language === 'ar' ? 'right-3.5' : 'left-3.5'} top-3 w-4 h-4 text-natural-sage group-focus-within:text-natural-olive transition-colors`} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full ${language === 'ar' ? 'pr-10 pl-11 text-right' : 'pl-10 pr-11'} py-2.5 sm:py-3.5 bg-natural-bone/50 text-natural-text border border-natural-border rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive font-semibold font-sans text-sm transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${language === 'ar' ? 'left-3.5' : 'right-3.5'} top-2.5 text-natural-sage hover:text-natural-olive transition-colors p-0.5`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-natural-olive hover:bg-natural-olive-hover text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer font-sans text-sm shadow-lg hover:shadow-xl active:scale-95 group"
            >
              <span className="uppercase tracking-widest font-extrabold">{t('login')}</span>
              <LogIn className="w-5 h-5 text-natural-accent group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="bg-gradient-to-br from-blue-50/50 to-blue-50/25 p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] border border-blue-100/60 text-center space-y-2 sm:space-y-3">
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-relaxed">
              {language === 'ar' 
                ? 'هل تحتاج إلى حساب؟ يجب على المسؤول تسجيلك في الدليل لتفعيل حسابك.' 
                : "Besoin d'un accès ? Un administrateur doit vous enregistrer dans l'annuaire pour activer votre compte."}
            </p>
            <button
              type="button"
              id="admin-chat-trigger"
              onClick={() => setIsChatModalOpen(true)}
              className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-[#1034A6] to-[#1E56A0] hover:from-[#1E56A0] hover:to-[#2F89FC] text-white text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all duration-200 relative"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-amber-300 animate-pulse" />
              <span>{language === 'ar' ? 'تحدث مباشرة مع الكابتن عبدو' : "Chat Live avec l'Admin"}</span>
              {unreadSupportCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md animate-bounce border border-white">
                  {unreadSupportCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Support Chat Modal for Guests / Unauthenticated Users */}
      {isChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in text-xs">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#1034A6] to-[#1E56A0] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
                <div>
                  <h3 className="font-serif italic font-black text-sm text-white">
                    {language === 'ar' ? 'محادثة المساعدة المباشرة' : "Chat d'Assistance MRC"}
                  </h3>
                  <p className="text-[9px] text-white/70 font-mono">
                    {language === 'ar' ? 'تواصل مع الكابتن عبدو الزايتي' : "En direct avec Captain Abdou"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition cursor-pointer text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {!hasSetGuestName ? (
                /* Identity setup screen first */
                <div className="space-y-4 py-3">
                  <div className="text-center space-y-1.5 pb-2">
                    <div className="w-12 h-12 bg-blue-50 text-[#1034A6] rounded-full flex items-center justify-center mx-auto">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <h4 className="font-serif italic font-bold text-slate-800 text-sm">
                      {language === 'ar' ? 'من يتحدث معنا؟' : 'Qui nous contacte ?'}
                    </h4>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                      {language === 'ar' 
                        ? 'يرجى تحديد هويتك لنتمكن من مساعدتك وحفظ تاريخ المحادثة بشكل آمن.' 
                        : "Veuillez vous identifier pour que l'Admin puisse vous répondre et suivre votre historique."}
                    </p>
                  </div>

                  {/* Identity input section */}
                  <div className="space-y-3.5">
                    {/* Enter guest/visitor name */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                      <span className="font-mono text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                        {language === 'ar' ? 'الاسم الكامل أو اللقب' : 'Votre Nom Complet / Pseudo'}
                      </span>
                      <input
                        type="text"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        placeholder={language === 'ar' ? 'اكتب اسمك الكامل هنا...' : 'Saisissez votre Nom / Pseudo...'}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1034A6] text-slate-800 font-medium"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      disabled={!inputName.trim()}
                      onClick={() => {
                        const finalName = inputName.trim();
                        setGuestName(finalName);
                        setSelectedAthleteId('');
                        localStorage.setItem('mrc_guest_name', finalName);
                        localStorage.removeItem('mrc_guest_athlete_id');
                        setHasSetGuestName(true);
                      }}
                      className="w-full py-3 bg-[#1034A6] hover:bg-[#1E56A0] disabled:bg-slate-200 text-white disabled:text-slate-400 font-black rounded-xl transition cursor-pointer text-xs"
                    >
                      {language === 'ar' ? 'بدء المحادثة المباشرة ⚡' : 'Lancer le Chat Live ⚡'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Chat view */
                <div className="flex flex-col h-[55vh]">
                  {/* Small identity reminder banner */}
                  <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between mb-3 text-[10px] text-[#1034A6] font-bold">
                    <span>
                      👤 {language === 'ar' ? 'تتحدث بصفتك:' : 'Connecté en tant que :'} <strong className="font-serif italic">{getChatUser().name}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setHasSetGuestName(false);
                      }}
                      className="text-rose-600 hover:underline cursor-pointer"
                    >
                      {language === 'ar' ? 'تغيير الهوية' : "Changer d'identité"}
                    </button>
                  </div>

                  {/* Embedded AdminSupportChat component */}
                  <div className="flex-1 min-h-0 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                    <AdminSupportChat 
                      currentUser={getChatUser()} 
                      runners={runners} 
                      language={language} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
