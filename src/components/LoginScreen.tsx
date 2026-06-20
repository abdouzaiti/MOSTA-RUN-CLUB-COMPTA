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
    <div className={`min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col items-center justify-center p-4 ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Visual Identity Logo */}
      <div className="text-center mb-6 space-y-2">
        <span className="font-mono text-[10px] bg-natural-olive/10 border border-natural-olive/20 text-natural-olive font-black tracking-widest px-3 py-1 rounded-full uppercase">
          {language === 'ar' ? '🇩🇿 نادي ألعاب القوى بالكورنيش' : '🇩🇿 Club d\'Athlétisme de la Corniche'}
        </span>
        <h1 className="text-2xl md:text-3xl font-serif italic font-black text-natural-olive tracking-wide">
          MOSTA RUN CLUB
        </h1>
        <p className="text-xs text-natural-sage font-medium max-w-xs mx-auto">
          {language === 'ar' ? 'التخطيط للخرجات الطويلة، المسارات الساحلية، الخدمات اللوجستية خارج الولاية ومتابعة المشتركين.' : 'Planification de sorties longues, trails côtiers, logistique hors-wilaya et suivi des licenciés.'}
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-natural-border shadow-md overflow-hidden p-6 animate-fade-in text-xs space-y-4">
        <div className="flex justify-center gap-2 mb-4">
          <button onClick={() => setLanguage('ar')} className={`px-2 py-1 rounded text-[10px] font-bold ${language === 'ar' ? 'bg-natural-olive text-white' : 'bg-white text-natural-olive border border-natural-olive/20'}`}>AR</button>
          <button onClick={() => setLanguage('fr')} className={`px-2 py-1 rounded text-[10px] font-bold ${language === 'fr' ? 'bg-natural-olive text-white' : 'bg-white text-natural-olive border border-natural-olive/20'}`}>FR</button>
          <button onClick={() => setLanguage('en')} className={`px-2 py-1 rounded text-[10px] font-bold ${language === 'en' ? 'bg-natural-olive text-white' : 'bg-white text-natural-olive border border-natural-olive/20'}`}>EN</button>
        </div>

        <div className="border-b border-natural-divider pb-3 text-center">
          <h2 className="font-bold font-serif italic text-natural-olive text-md uppercase tracking-wider">{t('login')}</h2>
          <p className="text-[10px] text-natural-sage font-bold mt-0.5 font-mono">{t('welcome')}</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 font-bold rounded-xl border border-rose-100 leading-relaxed font-mono text-[11px]">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono uppercase tracking-wider">
              {t('username')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-natural-sage" />
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2.5 bg-natural-bone text-natural-text border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono uppercase tracking-wider">
              {t('password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-natural-sage" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-natural-bone text-natural-text border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold font-mono text-sm leading-normal"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-natural-sage hover:text-natural-olive transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-natural-olive hover:bg-natural-olive-hover text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer font-serif italic text-xs shadow-xs"
          >
            {t('login')}
            <LogIn className="w-4 h-4 text-natural-accent" />
          </button>
        </form>

        <div className="bg-natural-bone p-3.5 rounded-2xl border border-natural-border/70 text-center text-[10px] text-natural-sage font-medium leading-relaxed">
          <span>{language === 'ar' ? 'هل تحتاج إلى وصول؟ يجب على مسؤول أو مدرب من مستغانم تسجيلك في الدليل لتفعيل حسابك.' : "Besoin d'un accès ? Un administrateur ou coach de Mostaganem doit vous enregistrer dans l'annuaire pour activer votre compte."}</span>
        </div>
      </div>
    </div>
  );
}
