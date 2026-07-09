import React, { useState, useRef } from 'react';
import { Camera, User, Phone, Mail, Droplet, Globe, Check, Shield, Lock, Image as ImageIcon, Sliders, Maximize2, Move, RotateCw } from 'lucide-react';
import { Runner } from '../types';
import { Language } from '../translations';

interface UserProfileSettingsProps {
  currentUser: Runner;
  onUpdateCurrentUser: (user: Runner) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/lorelei/png?seed=Lily&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/adventurer/png?seed=Leo&backgroundColor=d1f4ff",
  "https://api.dicebear.com/7.x/lorelei/png?seed=Angel&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/notionists/png?seed=Aria&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/png?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/png?seed=Milo&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/lorelei/png?seed=Jack&backgroundColor=d1f4ff",
  "https://api.dicebear.com/7.x/notionists/png?seed=Kiki&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/png?seed=Buster&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/adventurer/png?seed=Maya&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/lorelei/png?seed=Mimi&backgroundColor=ffdfbf"
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
    saving: "جاري الحفظ...",
    editorTitle: "معدل الإطار والتكبير (Instagram Style)",
    zoomLabel: "التكبير / القياس",
    rotationLabel: "التدوير",
    panXLabel: "الإزاحة الأفقية",
    panYLabel: "الإزاحة العمودية",
    borderWidthLabel: "سمك الإطار",
    borderColorLabel: "نمط ولون الإطار",
    shapeLabel: "شكل الصورة"
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
    saving: "Enregistrement en cours...",
    editorTitle: "Ajuster la photo et la bordure",
    zoomLabel: "Zoom / Taille",
    rotationLabel: "Rotation",
    panXLabel: "Position Horizontale (X)",
    panYLabel: "Position Verticale (Y)",
    borderWidthLabel: "Épaisseur Bordure",
    borderColorLabel: "Style & Couleur de Bordure",
    shapeLabel: "Forme de Découpe"
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
    saving: "Saving...",
    editorTitle: "Adjust Photo & Border Styles",
    zoomLabel: "Zoom / Scale",
    rotationLabel: "Rotation",
    panXLabel: "Horizontal Position (X)",
    panYLabel: "Vertical Position (Y)",
    borderWidthLabel: "Border Thickness",
    borderColorLabel: "Border Style & Color",
    shapeLabel: "Crop Shape"
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
  
  // Customizer state
  const [editorSourceImage, setEditorSourceImage] = useState<string>(currentUser.avatarUrl || '');
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('none');
  const [borderWidth, setBorderWidth] = useState<number>(3);
  const [shape, setShape] = useState<'circle' | 'square' | 'hexagon' | 'octagon'>('circle');

  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = dict[language] || dict['fr'];
  const isRtl = language === 'ar';

  const updateBakedAvatar = (
    srcUrl: string, 
    z: number, 
    px: number, 
    py: number, 
    bColor: string, 
    bWidth: number, 
    s: 'circle' | 'square' | 'hexagon' | 'octagon',
    rot: number
  ) => {
    if (!srcUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, 300, 300);

      // 1. Clip path
      ctx.save();
      const cx = 150;
      const cy = 150;
      const r = 150 - bWidth / 2;

      if (s === 'circle') {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
      } else if (s === 'square') {
        const size = r * 2;
        const x = cx - r;
        const y = cy - r;
        const radius = 30;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        ctx.lineTo(x + size, y + size - radius);
        ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        ctx.lineTo(x + radius, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();
      } else if (s === 'hexagon') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
      } else if (s === 'octagon') {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i - Math.PI / 8;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
      }

      // 2. Transform & Draw Image
      ctx.save();
      ctx.translate(cx + px, cy + py);
      ctx.rotate((rot * Math.PI) / 180);

      const imgRatio = img.width / img.height;
      let drawW = 300;
      let drawH = 300;
      if (imgRatio > 1) {
        drawW = 300 * imgRatio;
        drawH = 300;
      } else {
        drawW = 300;
        drawH = 300 / imgRatio;
      }

      drawW *= z;
      drawH *= z;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      ctx.restore();

      // 3. Stroke Border
      if (bWidth > 0 && bColor !== 'none') {
        ctx.save();
        ctx.lineWidth = bWidth;
        ctx.beginPath();

        if (s === 'circle') {
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
        } else if (s === 'square') {
          const size = r * 2;
          const x = cx - r;
          const y = cy - r;
          const radius = 30;
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + size - radius, y);
          ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
          ctx.lineTo(x + size, y + size - radius);
          ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
          ctx.lineTo(x + radius, y + size);
          ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
        } else if (s === 'hexagon') {
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        } else if (s === 'octagon') {
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i - Math.PI / 8;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        }

        if (bColor === 'gradient') {
          const grad = ctx.createLinearGradient(0, 0, 300, 300);
          grad.addColorStop(0, '#f9ce34');
          grad.addColorStop(0.5, '#ee2a7b');
          grad.addColorStop(1, '#6228d7');
          ctx.strokeStyle = grad;
        } else if (bColor === 'neon') {
          const grad = ctx.createLinearGradient(0, 300, 300, 0);
          grad.addColorStop(0, '#00f2fe');
          grad.addColorStop(1, '#4facfe');
          ctx.strokeStyle = grad;
        } else if (bColor === 'gold') {
          ctx.strokeStyle = '#D4AF37';
        } else if (bColor === 'blue') {
          ctx.strokeStyle = '#1034A6';
        } else if (bColor === 'red') {
          ctx.strokeStyle = '#EF4444';
        } else if (bColor === 'emerald') {
          ctx.strokeStyle = '#10B981';
        } else {
          ctx.strokeStyle = bColor;
        }

        ctx.stroke();
        ctx.restore();
      }

      try {
        const bakedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setFormAvatar(bakedDataUrl);
      } catch (err) {
        console.error("Failed to bake image to data URL:", err);
      }
    };
    img.src = srcUrl;
  };

  React.useEffect(() => {
    if (editorSourceImage) {
      const timer = setTimeout(() => {
        updateBakedAvatar(editorSourceImage, zoom, panX, panY, borderColor, borderWidth, shape, rotation);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [editorSourceImage, zoom, panX, panY, borderColor, borderWidth, shape, rotation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const originalDataUrl = event.target?.result as string;

      // Downscale high-resolution mobile photos for performance and memory safety
      const img = new Image();
      img.onload = () => {
        const maxDim = 800; // Optimal size for high quality profile pic & smooth rendering
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const downscaledDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setEditorSourceImage(downscaledDataUrl);
          } catch (err) {
            console.warn("Could not downscale image, using original:", err);
            setEditorSourceImage(originalDataUrl);
          }
        } else {
          setEditorSourceImage(originalDataUrl);
        }

        // Reset sliders
        setZoom(1);
        setPanX(0);
        setPanY(0);
        setRotation(0);
      };
      img.src = originalDataUrl;
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
        <div className={`flex flex-col sm:flex-row items-start gap-6 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
          
          {/* Avatar Preview */}
          <div className="relative group shrink-0 self-center sm:self-start">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-black border-4 border-white shadow-md overflow-hidden relative cursor-pointer hover:opacity-95 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title={t.uploadCustom}
            >
              {formAvatar ? (
                <img src={formAvatar} alt={formName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                formName ? formName.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() : 'MR'
              )}
              {/* Overlaid Camera Icon on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-2.5 bg-[#1034A6] hover:bg-blue-700 text-white rounded-full border-2 border-white shadow-md transition cursor-pointer flex items-center justify-center"
              style={{ minWidth: '44px', minHeight: '44px' }}
              title={t.uploadCustom}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-4 w-full">
            <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              {t.avatar}
            </label>
            
            {/* Quick Presets Selection & Device Upload */}
            <div className="flex flex-col gap-3 w-full">
              <div className={`flex flex-wrap items-center gap-2.5 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#1034A6] hover:text-blue-800 border border-blue-200/60 font-bold text-xs rounded-xl transition cursor-pointer min-h-[44px]"
                >
                  <Camera className="w-4 h-4 text-[#1034A6]" />
                  <span>{t.uploadCustom}</span>
                </button>

                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.choosePreset}:</span>
                
                <div className="flex flex-wrap gap-1.5 items-center">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setEditorSourceImage(url);
                        setZoom(1);
                        setPanX(0);
                        setPanY(0);
                        setRotation(0);
                      }}
                      className={`w-9 h-9 rounded-full border-2 transition cursor-pointer ${
                        editorSourceImage === url ? 'border-[#1034A6] scale-110 shadow-3xs' : 'border-transparent hover:scale-105'
                      } overflow-hidden`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                  
                  {/* Clear custom avatar */}
                  {(formAvatar || editorSourceImage) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormAvatar('');
                        setEditorSourceImage('');
                      }}
                      className="text-[10px] font-mono font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl px-3 py-2 transition cursor-pointer min-h-[38px]"
                    >
                      {isRtl ? 'حذف الصورة' : 'Retirer'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick File Explorer instruction */}
            <div className={`text-[10px] text-slate-400 flex items-center gap-1 justify-center sm:justify-start ${isRtl ? 'flex-row-reverse' : ''}`}>
              <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
              <span>{isRtl ? 'يمكنك ضبط وتكبير وتعديل الصورة بعد اختيارها مباشرة.' : 'Vous pouvez ajuster, zoomer et cadrer la photo juste après l\'avoir sélectionnée.'}</span>
            </div>
          </div>
        </div>

        {/* Photo Customizer Section (Instagram & Facebook style sliders) */}
        {editorSourceImage && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-4 animate-fade-in">
            <div className={`flex items-center gap-2 pb-2 border-b border-slate-200/50 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Sliders className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">{t.editorTitle || "Ajuster la photo et la bordure"}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Live Interactive Preview Container */}
              <div className="md:col-span-4 flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-slate-200/40 shadow-3xs">
                <div 
                  className="w-32 h-32 relative overflow-hidden transition-all duration-300 shadow-md flex items-center justify-center bg-slate-100"
                  style={{
                    borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? '1.5rem' : '0px',
                    clipPath: shape === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : shape === 'octagon' ? 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' : 'none',
                    border: borderWidth > 0 && borderColor !== 'none' && (shape === 'circle' || shape === 'square') ? `${borderWidth * 0.426}px solid ${borderColor === 'blue' ? '#1034A6' : borderColor === 'gold' ? '#D4AF37' : borderColor === 'red' ? '#EF4444' : borderColor === 'emerald' ? '#10B981' : borderColor === 'gradient' ? '#ee2a7b' : borderColor === 'neon' ? '#00f2fe' : borderColor}` : 'none',
                    padding: borderWidth > 0 && borderColor !== 'none' && (shape === 'circle' || shape === 'square') ? `${borderWidth * 0.426}px` : '0px'
                  }}
                >
                  {/* Image under transform */}
                  <div 
                    className="w-full h-full relative"
                    style={{
                      transform: `scale(${zoom}) translate(${(panX * 128) / 300}px, ${(panY * 128) / 300}px) rotate(${rotation}deg)`,
                      transition: 'transform 0.05s ease-out',
                    }}
                  >
                    <img 
                      src={editorSourceImage} 
                      alt="Source Preview" 
                      className="w-full h-full object-cover pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* If it is gradient or neon and we can't use standard solid borders, we simulate them */}
                  {borderWidth > 0 && borderColor === 'gradient' && (shape === 'circle' || shape === 'square') && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        border: `${borderWidth * 0.426}px solid transparent`,
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #f9ce34, #ee2a7b, #6228d7)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'content-box, border-box',
                        borderRadius: shape === 'circle' ? '50%' : '1.5rem',
                      }}
                    />
                  )}
                  {borderWidth > 0 && borderColor === 'neon' && (shape === 'circle' || shape === 'square') && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        border: `${borderWidth * 0.426}px solid transparent`,
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #00f2fe, #4facfe)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'content-box, border-box',
                        borderRadius: shape === 'circle' ? '50%' : '1.5rem',
                      }}
                    />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-2 font-mono">{shape.toUpperCase()} PREVIEW</span>
              </div>

              {/* Controls panel */}
              <div className="md:col-span-8 space-y-3.5 text-xs">
                
                {/* Zoom and Rotation in Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Zoom slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3 text-blue-500" /> {t.zoomLabel}</span>
                      <span className="font-mono text-slate-400">{zoom.toFixed(2)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.02" 
                      value={zoom} 
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-[#1034A6] h-1 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Rotation Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><RotateCw className="w-3 h-3 text-blue-500" /> {t.rotationLabel}</span>
                      <span className="font-mono text-slate-400">{rotation}°</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="360" 
                      step="1" 
                      value={rotation} 
                      onChange={(e) => setRotation(parseInt(e.target.value))}
                      className="w-full accent-[#1034A6] h-1 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Horizontal & Vertical Positioning */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pan X Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Move className="w-3 h-3 text-blue-500" /> {t.panXLabel}</span>
                      <span className="font-mono text-slate-400">{panX}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="-120" 
                      max="120" 
                      step="1" 
                      value={panX} 
                      onChange={(e) => setPanX(parseInt(e.target.value))}
                      className="w-full accent-[#1034A6] h-1 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Pan Y Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Move className="w-3 h-3 text-blue-500" /> {t.panYLabel}</span>
                      <span className="font-mono text-slate-400">{panY}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="-120" 
                      max="120" 
                      step="1" 
                      value={panY} 
                      onChange={(e) => setPanY(parseInt(e.target.value))}
                      className="w-full accent-[#1034A6] h-1 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Shape Selection */}
                <div className="space-y-1.5 pt-1">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.shapeLabel}</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(['circle', 'square', 'hexagon', 'octagon'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setShape(s)}
                        className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                          shape === s 
                            ? 'bg-[#1034A6] border-[#1034A6] text-white shadow-xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {s === 'circle' ? (isRtl ? 'دائري' : 'Rond') : 
                         s === 'square' ? (isRtl ? 'مربع' : 'Carré') : 
                         s === 'hexagon' ? (isRtl ? 'مسدس' : 'Hexagone') : (isRtl ? 'مثمن' : 'Octogone')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Thickness & Style in Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                  {/* Border Width Slider */}
                  <div className="sm:col-span-4 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>{t.borderWidthLabel}</span>
                      <span className="font-mono text-slate-400">{borderWidth}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="12" 
                      step="1" 
                      value={borderWidth} 
                      onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                      className="w-full accent-[#1034A6] h-1 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Border Color Presets */}
                  <div className="sm:col-span-8 space-y-1.5">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.borderColorLabel}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'none', label: isRtl ? 'بدون' : 'Aucun', bg: 'bg-slate-200' },
                        { id: 'blue', label: 'MRC', bg: 'bg-[#1034A6]' },
                        { id: 'gold', label: 'Gold', bg: 'bg-amber-400' },
                        { id: 'red', label: 'Red', bg: 'bg-red-500' },
                        { id: 'emerald', label: 'Green', bg: 'bg-emerald-500' },
                        { id: 'gradient', label: 'Rainbow', bg: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' },
                        { id: 'neon', label: 'Neon', bg: 'bg-gradient-to-tr from-cyan-400 to-blue-500' },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setBorderColor(preset.id)}
                          className={`flex items-center gap-1.5 py-1 px-2 text-[9px] font-bold rounded-lg border transition cursor-pointer ${
                            borderColor === preset.id 
                              ? 'border-slate-800 ring-2 ring-blue-500/10' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${preset.bg}`} />
                          <span className="text-slate-600">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

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
