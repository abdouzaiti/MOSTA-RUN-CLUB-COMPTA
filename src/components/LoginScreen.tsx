import React, { useState } from 'react';
import { Runner } from '../types';
import { ShieldCheck, User, Lock, Phone, Mail, HeartPulse, Sparkles, LogIn, ArrowRight, Eye, EyeOff, Globe } from 'lucide-react';
import { translations, Language } from '../translations';

interface LoginScreenProps {
  runners: Runner[];
  onLoginSuccess: (user: Runner) => void;
  onUpdateRunner: (user: Runner) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export default function LoginScreen({ runners, onLoginSuccess, onUpdateRunner, language, setLanguage }: LoginScreenProps) {
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
            <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
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
      className={`min-h-screen grid grid-cols-1 lg:grid-cols-2 items-start lg:items-center gap-12 p-4 pt-12 sm:pt-20 lg:pt-4 bg-cover bg-center bg-fixed ${language === 'ar' ? 'font-arabic' : ''}`} 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      style={{ backgroundImage: "url('/back.png')" }}
    >
      {/* Left Content: Hero Branding */}
      <div className="flex flex-col items-center lg:items-start text-center lg:text-right space-y-6 animate-fade-in order-2 lg:order-1 lg:-mt-20">
        <div className="relative inline-block">
          <img 
            src="/logo.png" 
            alt="Mosta Run Club" 
            className="w-32 h-32 sm:w-48 sm:h-48 object-contain drop-shadow-2xl animate-float" 
          />
        </div>
        
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-black text-blue-950 tracking-tighter shadow-white drop-shadow-sm">
            نجري معا
          </h1>
          <h1 className="text-2xl sm:text-4xl font-black text-blue-950 tracking-tighter shadow-white drop-shadow-sm">
            نتحدى حدودنا
          </h1>
        </div>

        <div className="space-y-0.5">
          <p className="text-xs sm:text-sm font-bold text-slate-600/80 leading-tight">
            إنضم ألى مجتمع مستغانم
          </p>
          <p className="text-xs sm:text-sm font-bold text-slate-600/80 leading-tight">
            للركض وكن جزءا من التغيير
          </p>
        </div>
      </div>

      {/* Right Content: Login Form */}
      <div className="flex justify-center lg:justify-end order-1 lg:order-2">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-[3rem] border border-natural-border shadow-2xl overflow-hidden p-8 sm:p-10 animate-fade-in text-xs space-y-6">
          <div className="flex justify-center gap-3 mb-2">
            <button onClick={() => setLanguage('ar')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${language === 'ar' ? 'bg-natural-olive text-white scale-110 shadow-md' : 'bg-white text-natural-olive border border-natural-olive/20 hover:bg-natural-bone'}`}>AR</button>
            <button onClick={() => setLanguage('fr')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${language === 'fr' ? 'bg-natural-olive text-white scale-110 shadow-md' : 'bg-white text-natural-olive border border-natural-olive/20 hover:bg-natural-bone'}`}>FR</button>
            <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${language === 'en' ? 'bg-natural-olive text-white scale-110 shadow-md' : 'bg-white text-natural-olive border border-natural-olive/20 hover:bg-natural-bone'}`}>EN</button>
          </div>

          <div className="border-b border-natural-divider pb-4 text-center">
            <h2 className="font-bold font-serif italic text-natural-olive text-lg uppercase tracking-widest">{t('login')}</h2>
            <p className="text-[11px] text-natural-sage font-bold mt-1 font-mono uppercase opacity-80 letter-spacing-1">{t('welcome')}</p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 text-rose-700 font-bold rounded-2xl border border-rose-100 leading-relaxed font-mono text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-natural-olive px-1 font-mono uppercase tracking-wider">
                {t('username')}
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-natural-sage group-focus-within:text-natural-olive transition-colors" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-11 pr-4 py-3.5 bg-natural-bone/50 text-natural-text border border-natural-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive font-semibold font-mono transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-natural-olive px-1 font-mono uppercase tracking-wider">
                {t('password')}
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-natural-sage group-focus-within:text-natural-olive transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-natural-bone/50 text-natural-text border border-natural-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive font-semibold font-mono text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-natural-sage hover:text-natural-olive transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-natural-olive hover:bg-natural-olive-hover text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer font-serif italic text-sm shadow-lg hover:shadow-xl active:scale-95 group"
            >
              <span className="uppercase tracking-widest">{t('login')}</span>
              <LogIn className="w-5 h-5 text-natural-accent group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="bg-natural-bone/50 p-4 rounded-2xl border border-natural-border/70 text-center text-[10px] text-natural-sage font-medium leading-relaxed italic">
            <span>{language === 'ar' ? 'هل تحتاج إلى وصول؟ يجب على مسؤول أو مدرب من مستغانم تسجيلك في الدليل لتفعيل حسابك.' : "Besoin d'un accès ? Un administrateur ou coach de Mostaganem doit vous enregistrer dans l'annuaire pour activer votre compte."}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
