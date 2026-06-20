import React, { useState } from 'react';
import { Runner, Run } from '../types';
import { translations, Language } from '../translations';
import { User, Shield, Phone, Mail, Check, CreditCard, Sparkles, HeartPulse } from 'lucide-react';

interface InscriptionsAndProfileProps {
  currentUser: Runner;
  setCurrentUser: (user: Runner) => void;
  runs: Run[];
  language: Language;
}

export default function InscriptionsAndProfile({ currentUser, setCurrentUser, runs, language }: InscriptionsAndProfileProps) {
  const t = (key: string) => (translations[language] as any)[key] || (translations['fr'] as any)[key] || key;
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email);
  const [bloodType, setBloodType] = useState(currentUser.bloodType || 'O+');
  const [savedMsg, setSavedMsg] = useState(false);

  const registeredRuns = runs.filter(
    r => !r.completed && r.participants.some(p => p.id === currentUser.id)
  );
  const finishedRunsCount = runs.filter(
    r => r.completed && r.participants.some(p => p.id === currentUser.id)
  ).length;

  const totalDistancePlanned = registeredRuns.reduce((acc, curr) => acc + curr.distance, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser({
      ...currentUser,
      name,
      phone,
      email,
      bloodType
    });
    setIsEditing(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-natural-border shadow-xs flex flex-col gap-6">
      {/* User Info Stats Summary */}
      <div className={`grid grid-cols-3 gap-2 bg-natural-bone p-3 rounded-2xl border border-natural-border text-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div>
          <span className="text-natural-sage text-xs block uppercase font-mono font-bold">
            {language === 'ar' ? 'مسجل في' : language === 'en' ? 'Registered for' : 'Inscrit à'}
          </span>
          <span className="text-lg font-black text-natural-olive">{registeredRuns.length} run{registeredRuns.length > 1 ? 's' : ''}</span>
        </div>
        <div className="border-x border-natural-divider">
          <span className="text-natural-sage text-xs block uppercase font-mono font-bold">
            {language === 'ar' ? 'منتهية' : language === 'en' ? 'Completed' : 'Terminés'}
          </span>
          <span className="text-lg font-black text-natural-accent">{finishedRunsCount}</span>
        </div>
        <div>
          <span className="text-natural-sage text-xs block uppercase font-mono font-bold">
            {language === 'ar' ? 'إجمالي الكيلومترات' : language === 'en' ? 'Total KMs' : 'Total KMs'}
          </span>
          <span className="text-lg font-black text-natural-olive">{totalDistancePlanned} km</span>
        </div>
      </div>

      {/* Edit Form Trigger or Form */}
      <div className={language === 'ar' ? 'font-arabic' : ''}>
        {!isEditing ? (
          <button
            id="edit-profile-btn"
            onClick={() => setIsEditing(true)}
            className={`w-full py-2.5 px-4 bg-white hover:bg-natural-bone text-natural-olive text-xs font-extrabold font-serif italic rounded-xl border border-natural-border transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${language === 'ar' ? 'flex-row-reverse' : ''}`}
          >
            <User className="w-3.5 h-3.5 text-natural-accent" />
            {language === 'ar' ? 'تعديل معلومات الطوارئ الخاصة بي' : language === 'en' ? 'Edit my emergency information' : 'Modifier mes informations de secours'}
          </button>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 border-t border-natural-divider pt-4">
            <h4 className={`text-xs font-bold text-natural-olive uppercase tracking-wider font-serif italic ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'تعديل معلومات الأمان الخاصة بي' : language === 'en' ? 'Edit my security information' : 'Modifier mes informations de sécurité'}
            </h4>

            <div className={language === 'ar' ? 'text-right' : ''}>
              <label className="block text-[11px] font-bold text-natural-sage mb-1 font-mono">{t('fullName')}</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full text-xs px-3 py-2 border border-natural-border rounded-xl bg-natural-bone/50 text-natural-text focus:bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold ${language === 'ar' ? 'text-right' : ''}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={language === 'ar' ? 'text-right' : ''}>
                <label className="block text-[11px] font-bold text-natural-sage mb-1 font-mono">{t('phone')}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border border-natural-border rounded-xl bg-natural-bone/50 text-natural-text focus:bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold ${language === 'ar' ? 'text-right font-mono' : ''}`}
                />
              </div>
              <div className={language === 'ar' ? 'text-right' : ''}>
                <label className="block text-[11px] font-bold text-natural-sage mb-1 font-mono">{t('bloodType')}</label>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border border-natural-border rounded-xl bg-natural-bone/50 text-natural-text focus:bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold ${language === 'ar' ? 'text-right' : ''}`}
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
              </div>
            </div>

            <div className={language === 'ar' ? 'text-right' : ''}>
              <label className="block text-[11px] font-bold text-natural-sage mb-1 font-mono">{t('email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`w-full text-xs px-3 py-2 border border-natural-border rounded-xl bg-natural-bone/50 text-natural-text focus:bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold ${language === 'ar' ? 'text-right font-mono' : ''}`}
              />
            </div>

            <div className={`flex gap-2 font-semibold text-xs pt-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-1/2 py-2 text-natural-sage bg-white hover:bg-natural-bone rounded-xl border border-natural-border transition font-bold cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 text-white bg-natural-olive hover:bg-natural-olive-hover rounded-xl transition flex items-center justify-center gap-1.5 font-bold cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                {t('save')}
              </button>
            </div>
          </form>
        )}

        {savedMsg && (
          <div className="mt-3 p-2 bg-natural-sage-light text-natural-olive text-[11px] font-bold rounded-xl text-center border border-natural-border">
            {language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح!' : 'Profil mis à jour ! Tous vos runs enregistrés reflètent vos changements.'}
          </div>
        )}
      </div>

      <div className={`border-t border-natural-divider pt-4 ${language === 'ar' ? 'text-right' : ''}`}>
        <h4 className={`text-xs font-bold text-natural-olive uppercase tracking-widest font-serif italic mb-2 flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Shield className="w-3.5 h-3.5 text-natural-accent" />
          {language === 'ar' ? 'ميثاق أمان النادي' : language === 'en' ? 'Club Security Charter' : 'Charte de Sécurité du Club'}
        </h4>
        <ul className={`text-[10px] text-natural-sage font-medium space-y-1.5 list-disc ${language === 'ar' ? 'pr-4 list-inside' : 'pl-4'} leading-relaxed`}>
          <li>{language === 'ar' ? 'ارتداء القميص العاكس إلزامي للجري المسائي.' : language === 'en' ? 'Reflective t-shirt is mandatory for evening runs.' : 'Le port de t-shirt réfléchissant est obligatoire pour les runs du soir.'}</li>
          <li>{language === 'ar' ? 'أدخل دائما رقم هاتف الطوارئ الخاص بك في حالة وقوع مشكلة.' : language === 'en' ? 'Always fill in your emergency phone number in case of trouble.' : "Renseignez toujours votre téléphone d'urgence en cas de pépin."}</li>
          <li>{language === 'ar' ? 'روح المجموعة تأتي أولاً: ننطلق معا، ونصل معا!' : language === 'en' ? 'Group spirit comes first: we start together, we arrive together!' : "L'esprit de groupe prime : on part ensemble, on arrive ensemble !"}</li>
        </ul>
      </div>
    </div>
  );
}
