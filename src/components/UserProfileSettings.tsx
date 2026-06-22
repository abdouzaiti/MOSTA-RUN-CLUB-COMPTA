import React, { useState, useRef } from 'react';
import { Camera, User, Phone, Mail, Droplet, Globe, Check, Shield, Lock, Image as ImageIcon } from 'lucide-react';
import { Runner } from '../types';
import { Language } from '../translations';

interface UserProfileSettingsProps {
  currentUser: Runner;
  onUpdateCurrentUser: (user: Runner) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80"
];

const dict = {
  ar: {
    sectionTitle: "تعديل ملفي الشخصي والإعدادات",
    sectionDesc: "خصص هويتك الرياضية الرياضية للسباقات وجري المجموعات، لغة لوحة التحكم وخلفية حسابك الكروي.",
    fullName: "الاسم واللقب الرياضي",
    phone: "رقم هاتف الطوارئ",
    email: "البريد الإلكتروني للعداء",
    bloodType: "فصيلة الدم (للطوارئ)",
    username: "اسم المستخدم للولوج",
    password: "كلمة مرور جديدة للدخول",
    language: "لغة العرض الحالية",
    avatar: "صورة حسابك الرسمية (Avatar)",
    choosePreset: "اختر صورة سريعة",
    uploadCustom: "تحميل صورة من الهاتف",
    saveBtn: "تأكيد وتحديث حسابي",
    successMsg: "برافو! تم تحديث ملفك الشخصي وعرضه بنجاح.",
    saving: "جاري الحفظ..."
  },
  fr: {
    sectionTitle: "Éditer Mon Profil & Paramètres",
    sectionDesc: "Personnalisez vos informations d'athlète, changez votre langue d'affichage et importez votre photo de profil officielle du Mosta Run Club.",
    fullName: "Prénom & Nom d'Athlète",
    phone: "Téléphone d'Urgence",
    email: "Adresse e-mail active",
    bloodType: "Groupe Sanguin",
    username: "Identifiant de Connexion",
    password: "Nouveau Mot de Passe",
    language: "Langue d'Affichage",
    avatar: "Photo de Profil (Avatar)",
    choosePreset: "Choisir un portrait rapide",
    uploadCustom: "Importer une photo depuis vos fichiers",
    saveBtn: "Enregistrer mon profil",
    successMsg: "Super ! Vos informations de profil ont été mises à jour.",
    saving: "Enregistrement en cours..."
  },
  en: {
    sectionTitle: "Edit My Profile & Preferences",
    sectionDesc: "Personalize your runner info, emergency phone number, display language, and upload your official profile picture.",
    fullName: "Runner Full Name",
    phone: "Emergency Phone Number",
    email: "Active Email Address",
    bloodType: "Blood Type (Emergency)",
    username: "Login Username",
    password: "New Password",
    language: "Display Language",
    avatar: "Profile Picture (Avatar)",
    choosePreset: "Select a quick portrait",
    uploadCustom: "Upload a photo from your device",
    saveBtn: "Save Profile Preferences",
    successMsg: "Awesome! Your profile has been updated successfully.",
    saving: "Saving..."
  }
};

export default function UserProfileSettings({
  currentUser,
  onUpdateCurrentUser,
  language,
  setLanguage
}: UserProfileSettingsProps) {
  const [formName, setFormName] = useState(currentUser.name);
  const [formPhone, setFormPhone] = useState(currentUser.phone || '');
  const [formEmail, setFormEmail] = useState(currentUser.email || '');
  const [formBloodType, setFormBloodType] = useState(currentUser.bloodType || 'O+');
  const [formUsername, setFormUsername] = useState(currentUser.username || '');
  const [formPassword, setFormPassword] = useState(currentUser.password || '');
  const [formAvatar, setFormAvatar] = useState(currentUser.avatarUrl || '');
  
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = dict[language] || dict['fr'];
  const isRtl = language === 'ar';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        canvas.width = MAX_WIDTH;
        canvas.height = MAX_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, MAX_WIDTH, MAX_HEIGHT);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormAvatar(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert(language === 'ar' ? 'الاسم مطلوب' : 'Le nom est obligatoire');
      return;
    }

    const updatedUser: Runner = {
      ...currentUser,
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      bloodType: formBloodType,
      username: formUsername.trim(),
      password: formPassword.trim(),
      avatarUrl: formAvatar
    };

    onUpdateCurrentUser(updatedUser);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);
  };

  return (
    <div className={`p-6 bg-white rounded-3xl border border-slate-100 shadow-3xs space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      
      {/* Tab Head */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h3 className="text-base font-black text-[#1034A6] font-serif italic flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            {t.sectionTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            {t.sectionDesc}
          </p>
        </div>

        {/* Live Language selector directly inside the Profile preferences */}
        <div className={`flex items-center gap-1.5 self-start md:self-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{t.language}:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            {(['fr', 'ar', 'en'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-lg transition cursor-pointer ${
                  language === lang
                    ? 'bg-[#1034A6] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-2.5 shadow-3xs animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold font-mono">{t.successMsg}</span>
        </div>
      )}

      {/* Main Profile Customizer Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Profile photo block customization */}
        <div className={`flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
          
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-black border-4 border-white shadow-md overflow-hidden relative">
              {formAvatar ? (
                <img src={formAvatar} alt={formName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                formName ? formName.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() : 'MR'
              )}
            </div>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 bg-[#1034A6] hover:bg-blue-700 text-white rounded-full border-2 border-white shadow-sm transition"
              title={t.uploadCustom}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-3 w-full">
            <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              {t.avatar}
            </label>
            
            {/* Quick Presets Selection */}
            <div className={`flex flex-wrap items-center gap-2 ${isRtl ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] text-slate-500 mr-1">{t.choosePreset}:</span>
              <div className="flex gap-1.5 items-center">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormAvatar(url)}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      formAvatar === url ? 'border-[#1034A6] scale-110 shadow-3xs' : 'border-transparent hover:scale-105'
                    } overflow-hidden`}
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
                
                {/* Clear custom avatar */}
                {formAvatar && (
                  <button
                    type="button"
                    onClick={() => setFormAvatar('')}
                    className="text-[9px] font-mono font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-2 py-1 transition"
                  >
                    {isRtl ? 'حذف الصورة' : 'Retirer'}
                  </button>
                )}
              </div>
            </div>

            {/* Quick File Explorer instruction */}
            <div className={`text-[10px] text-slate-400 flex items-center gap-1 justify-center sm:justify-start ${isRtl ? 'flex-row-reverse' : ''}`}>
              <ImageIcon className="w-3 h-3 text-slate-300" />
              <span>{t.uploadCustom}</span>
            </div>
          </div>
        </div>

        {/* Input Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              {t.fullName}
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 flex items-center text-slate-400 px-3 ${isRtl ? 'right-0' : 'left-0'}`}>
                <User className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={`w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 bg-white ${
                  isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                }`}
              />
            </div>
          </div>

          {/* Emergency Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              {t.phone}
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 flex items-center text-slate-400 px-3 ${isRtl ? 'right-0' : 'left-0'}`}>
                <Phone className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="Ex. 0555 XXXXXX"
                className={`w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 bg-white ${
                  isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                }`}
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              {t.email}
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 flex items-center text-slate-400 px-3 ${isRtl ? 'right-0' : 'left-0'}`}>
                <Mail className="w-3.5 h-3.5" />
              </span>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="runner@example.com"
                className={`w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 bg-white ${
                  isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                }`}
              />
            </div>
          </div>

          {/* Blood Type Selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              {t.bloodType}
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 flex items-center text-slate-400 px-3 ${isRtl ? 'right-0' : 'left-0'}`}>
                <Droplet className="w-3.5 h-3.5 text-red-500" />
              </span>
              <select
                value={formBloodType}
                onChange={(e) => setFormBloodType(e.target.value)}
                className={`w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 bg-white ${
                  isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-auto'
                }`}
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Username (Identifiant unique) */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              {t.username}
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 flex items-center text-slate-400 px-3 ${isRtl ? 'right-0' : 'left-0'}`}>
                <Shield className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className={`w-full text-xs font-semibold px-3 py-2.5 border border-[#1034A6]/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 bg-white ${
                  isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              {t.password}
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 flex items-center text-slate-400 px-3 ${isRtl ? 'right-0' : 'left-0'}`}>
                <Lock className="w-3.5 h-3.5" />
              </span>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className={`w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 bg-white ${
                  isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                }`}
              />
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className={`pt-2 flex ${isRtl ? 'justify-start' : 'justify-end'}`}>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#1034A6] hover:bg-blue-700 text-white font-bold text-xs shrink-0 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t.saveBtn}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
