import React, { useState } from 'react';
import { RunnerFeedback, RunReport, Run, Runner } from '../types';
import { translations, Language } from '../translations';
import { Award, Thermometer, Calendar, Eye, Send, Star, Users, MapPin, Sparkles, Compass, CheckCircle } from 'lucide-react';

interface ReportsSummaryProps {
  reports: RunReport[];
  runs: Run[];
  currentUser: Runner;
  onAddFeedback: (reportId: string, feedback: Omit<RunnerFeedback, 'id' | 'dateStr' | 'avatarColor'>) => void;
  language: Language;
}

export default function ReportsSummary({ reports, runs, currentUser, onAddFeedback, language }: ReportsSummaryProps) {
  const t = (key: string) => (translations[language] as any)[key] || (translations['fr'] as any)[key] || key;
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [msg, setMsg] = useState('');

  const completedRuns = runs.filter(r => r.completed);

  // Find currently active custom report
  const activeReport = reports.find(rep => rep.id === selectedReportId);

  // Find associated run detail
  const associatedRun = activeReport ? runs.find(r => r.id === activeReport.runId) : null;

  // Handle posting a new review/feedback
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    if (activeReport) {
      onAddFeedback(activeReport.id, {
        runnerName: currentUser.name,
        text: feedbackText,
        rating: rating,
      });

      setFeedbackText('');
      setRating(5);
      const successMsg = language === 'ar' 
        ? 'شكرا لك! تمت إضافة تقريرك بنجاح. 🎉' 
        : language === 'en' 
          ? 'Thank you! Your feedback has been added successfully. 🎉'
          : 'Merci ! Votre compte-rendu a été ajouté et intégré aux statistiques de cette sortie. 🎉';
      setMsg(successMsg);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  // Global Club Metrics for "Tkarir Mlih"
  const totalCompletedRuns = completedRuns.length;
  const totalDistanceCollective = reports.reduce((acc, curr) => acc + (curr.totalDistanceKm * curr.participantsCount), 0);
  const totalReviewsCount = reports.reduce((acc, curr) => acc + curr.feedback.length, 0);

  const averageClubRating = (reports.reduce((acc, curr) => {
    const reportRatingSum = curr.feedback.reduce((sum, f) => sum + f.rating, 0);
    return acc + (curr.feedback.length > 0 ? reportRatingSum / curr.feedback.length : 5);
  }, 0) / (reports.length || 1)).toFixed(1);

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'font-arabic' : ''}`}>
      {/* Overview Cards (Tkarir Stats Dashboard) */}
      <div className={language === 'ar' ? 'text-right' : 'text-left'}>
        <h2 className={`text-xl font-serif italic font-bold text-natural-olive flex items-center gap-1.5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Award className="w-5 h-5 text-natural-accent" />
          {language === 'ar' ? 'تقارير جماعية ومحاضر (تقارير مليحة)' : language === 'en' ? 'Collective Reports & Feedback (Tkarir mlih)' : 'Rapports Collectifs & Comptes-rendus (Tkarir mlih)'}
        </h2>
        <p className="text-xs text-natural-sage font-medium">
          {language === 'ar' ? 'الإحصائيات المجمعة وتعليقات المجتمع حول خرجاتنا السابقة.' : language === 'en' ? 'Consolidated statistics and community feedback on our previous runs.' : 'Les statistiques consolidées et le feedback de la communauté sur nos précédents runs.'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-natural-olive text-white p-4 rounded-2xl border border-natural-border shadow-xs">
          <span className="text-[10px] text-natural-sage-light uppercase tracking-wider font-mono font-bold">{language === 'ar' ? 'مسافة النادي' : 'Distance Club'}</span>
          <p className="text-2xl font-black font-serif italic mt-1">
            {totalDistanceCollective.toFixed(0)} <span className="text-xs font-normal">{language === 'ar' ? 'كلم' : 'KM'}</span>
          </p>
          <span className="text-[9px] text-natural-sage-light font-mono block mt-0.5">{language === 'ar' ? 'تم قطعها إجمالاً' : 'Parcourus au total'}</span>
        </div>

        <div className="bg-natural-bone text-natural-text p-4 rounded-2xl border border-natural-border shadow-xs">
          <span className="text-[10px] text-natural-sage uppercase tracking-wider font-mono font-bold">{language === 'ar' ? 'خرجات منجزة' : 'Sorties Clôturées'}</span>
          <p className="text-2xl font-black font-serif italic mt-1 text-natural-olive">
            {totalCompletedRuns} <span className="text-xs font-normal">{language === 'ar' ? 'خرجة' : 'sorties'}</span>
          </p>
          <span className="text-[9px] text-natural-sage font-mono block mt-0.5">{language === 'ar' ? 'تم احتسابها' : 'Comptabilisées'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-natural-border shadow-xs">
          <span className="text-natural-sage text-[10px] uppercase tracking-wider font-mono font-bold">{language === 'ar' ? 'التقييم العام' : 'Note Globale'}</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-2xl font-black font-serif italic text-natural-olive">{averageClubRating}</span>
            <div className="flex text-amber-400">
              <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
            </div>
            <span className="text-[9px] text-natural-sage font-mono">/5.0</span>
          </div>
          <span className="text-[9px] text-natural-sage font-mono block mt-0.5">{language === 'ar' ? `محسوب على ${totalReviewsCount} رأياً` : `Calculée sur ${totalReviewsCount} avis`}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-natural-border shadow-xs col-span-2 lg:col-span-1">
          <span className="text-natural-sage text-[10px] uppercase tracking-wider font-mono font-bold">{language === 'ar' ? 'كثافة النادي' : 'Intensité club'}</span>
          <p className="text-lg font-bold text-natural-accent mt-1 leading-tight font-serif italic">
            {language === 'ar' ? 'روح المجموعة' : 'Esprit de Groupe'}
          </p>
          <span className="text-[9px] text-natural-sage font-mono block mt-0.5">{language === 'ar' ? '"صفر تخلي" موثق' : '"Zéro abandon" certifié'}</span>
        </div>
      </div>

      {/* Selector for reports */}
      <div className={`bg-natural-sage-light/30 p-3 rounded-2xl border border-natural-border flex items-center gap-3 overflow-x-auto ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <span className="text-[11px] font-bold text-natural-olive uppercase tracking-wider font-mono shrink-0 whitespace-nowrap">
          {language === 'ar' ? 'اختر خرجة :' : language === 'en' ? 'Choose a run:' : 'Choisir un run :'}
        </span>
        <div className="flex gap-2">
          {reports.map(rep => {
            const isActive = rep.id === selectedReportId;
            return (
              <button
                key={rep.id}
                onClick={() => {
                  setSelectedReportId(rep.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-natural-olive text-white border-transparent shadow-sm'
                    : 'bg-white hover:bg-natural-sage-light/50 text-natural-olive border-natural-border/75'
                }`}
              >
                {rep.title.split(':')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Report View */}
      {activeReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photos/Metrics Sidebar Left */}
          <div className="space-y-4">
            {/* Run Profile Summary Card */}
            <div className="bg-natural-olive text-white rounded-3xl p-5 border border-natural-border relative overflow-hidden shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-mono text-natural-accent font-bold block mb-1">
                {language === 'ar' ? 'البطاقة التقنية النهائية' : 'Fiche Technique Finale'}
              </span>
              <h3 className="text-lg font-serif italic font-black text-white leading-tight">
                {activeReport.title}
              </h3>
              <p className="text-[11px] text-natural-sage-light mt-0.5 font-mono">{language === 'ar' ? 'خرجة يوم' : 'Sortie du'} {new Date(activeReport.date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>

              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/10">
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                  <span className="text-natural-sage-light text-[9px] block uppercase font-mono">{t('distance')}</span>
                  <p className="text-md font-bold text-white">{activeReport.totalDistanceKm} {language === 'ar' ? 'كلم' : 'KM'}</p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                  <span className="text-natural-sage-light text-[9px] block uppercase font-mono">{language === 'ar' ? 'متوسط الوتيرة' : 'Cadence Moyenne'}</span>
                  <p className="text-md font-bold text-natural-accent">{activeReport.averagePace}</p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                  <span className="text-natural-sage-light text-[9px] block uppercase font-mono">{t('participants')}</span>
                  <p className="text-md font-bold text-white flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-natural-sage-light" />
                    {activeReport.participantsCount} {language === 'ar' ? 'عداء' : 'coureurs'}
                  </p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                  <span className="text-natural-sage-light text-[9px] block uppercase font-mono">{t('weather')}</span>
                  <p className="text-md font-bold text-white flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-natural-accent" />
                    {activeReport.tempCelsius ? `${activeReport.tempCelsius}°C` : 'N/A'}
                  </p>
                </div>
              </div>

              {activeReport.routeMapDescription && (
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px]">
                  <span className="text-natural-sage-light text-[9px] block uppercase font-mono mb-1">Itinéraire Remporté</span>
                  <div className="p-2 bg-white/15 text-natural-accent rounded-lg border border-white/10 font-mono leading-relaxed font-bold">
                    👣 {activeReport.routeMapDescription}
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Images with attribution referred correctly */}
            <div className="bg-white rounded-3xl p-5 border border-natural-border shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-natural-olive uppercase tracking-wider font-serif italic">Photos du groupe (Mostaganem)</h4>
              <div className="grid grid-cols-2 gap-2">
                {activeReport.galleryUrls.map((url, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden group border border-natural-border shadow-inner">
                    <img
                      src={url}
                      alt="Run de Mostaganem group of runners"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-natural-olive/10" />
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-natural-sage italic text-center font-medium">Images de référence pour illustrer la corniche et la forêt de Ouréah.</p>
            </div>
          </div>

          {/* Details Story & Feedback right and bottom */}
          <div className="lg:col-span-2 space-y-4">
            {/* Highlights Story */}
            <div className="bg-white rounded-3xl p-6 border border-natural-border shadow-sm space-y-3">
              <div className={`flex items-center gap-2 border-b border-natural-divider pb-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Compass className="w-5 h-5 text-natural-olive" />
                <div className={language === 'ar' ? 'text-right' : ''}>
                  <h3 className="font-serif italic font-medium text-natural-olive text-md">
                    {language === 'ar' ? 'ملخص وأبرز الأحداث' : 'Résumé et Faits Marquants'}
                  </h3>
                  <p className="text-[10px] text-natural-sage font-semibold">
                    {language === 'ar' ? 'بقلم اللجنة المنظمة' : "Rédigé par le comité d'organisation"}
                  </p>
                </div>
              </div>
              <p className={`text-xs text-natural-text leading-relaxed whitespace-pre-line font-medium ${language === 'ar' ? 'text-right' : 'text-justify'}`}>
                {activeReport.highlights}
              </p>
            </div>

            {/* Community Reviews & Feedback */}
            <div className="bg-white rounded-3xl p-6 border border-natural-border shadow-sm space-y-5">
              <div className={`flex justify-between items-center border-b border-natural-divider pb-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={language === 'ar' ? 'text-right' : ''}>
                  <h3 className="font-serif italic font-medium text-natural-olive text-md">
                    {language === 'ar' ? 'تعليقات العدائين' : 'Retours des Coureurs'}
                  </h3>
                  <p className="text-[10px] text-natural-sage font-semibold">
                    {language === 'ar' ? 'انطباعات بعد خط الوصول' : "Impressions après la ligne d'arrivée"}
                  </p>
                </div>
                <span className="text-xs font-bold font-mono px-3 py-1 bg-natural-sage-light text-natural-olive rounded-full border border-natural-border">
                  {activeReport.feedback.length} {language === 'ar' ? 'تعليق' : 'commentaires'}
                </span>
              </div>

              {/* Msg of success */}
              {msg && (
                <div className="p-3 bg-natural-sage-light text-natural-olive text-xs font-semibold rounded-xl border border-natural-border flex items-center gap-1.5 animate-pulse font-bold">
                  <CheckCircle className="w-4 h-4 text-natural-olive" />
                  <span>{msg}</span>
                </div>
              )}

              {/* Feedbacks listing */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {activeReport.feedback.map(fb => (
                  <div key={fb.id} className="p-3.5 bg-natural-bone rounded-2xl border border-natural-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full text-natural-olive border border-natural-border flex items-center justify-center font-bold text-xs bg-natural-sage-light/40 shrink-0 font-serif italic`}>
                          {fb.runnerName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-natural-text text-[11px]">{fb.runnerName}</p>
                          <p className="text-[9px] text-natural-sage font-bold font-mono">Le {new Date(fb.dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                        </div>
                      </div>

                      {/* Display star rating */}
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3 h-3 ${idx < fb.rating ? 'fill-amber-400 stroke-amber-400' : 'text-natural-border fill-transparent'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className={`text-xs text-natural-text leading-relaxed italic pr-2 font-medium ${language === 'ar' ? 'text-right' : ''}`}>
                      "{fb.text}"
                    </p>
                  </div>
                ))}
              </div>

              {/* Leave a review form */}
              <form onSubmit={handleSubmitFeedback} className="bg-natural-bone rounded-2xl p-4 border border-natural-border space-y-3">
                <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <h4 className="text-xs font-bold text-natural-olive uppercase tracking-wide font-mono">
                    {language === 'ar' ? 'إضافة تقريري الشخصي' : 'Ajouter mon compte-rendu personnel'}
                  </h4>

                  {/* Rating Selector */}
                  <div className={`flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] text-natural-sage font-mono font-bold mr-1">{t('fealings')} :</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((starIdx) => (
                        <button
                          key={starIdx}
                          type="button"
                          onClick={() => setRating(starIdx)}
                          className="hover:scale-110 transition shrink-0"
                        >
                          <Star
                            className={`w-4 h-4 ${starIdx <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    required
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    placeholder={language === 'ar' ? 'كيف سارت رحلتك؟ الجو، المسار، الصعوبات...' : "Comment s'est passée votre course ? Bonne ambiance, parcours, difficultés..."}
                    className={`w-full text-xs px-3 py-2.5 bg-white border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text placeholder-natural-sage/70 font-semibold ${language === 'ar' ? 'text-right' : ''}`}
                  />
                </div>

                <div className={`flex justify-between items-center bg-transparent pt-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] text-natural-sage font-mono leading-none font-bold">
                    {language === 'ar' ? 'مسجل كـ ' : 'Identifié en tant que '} <strong className="text-natural-olive font-bold">{currentUser.name}</strong>
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-natural-olive hover:bg-natural-olive-hover font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t('send')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center bg-white rounded-3xl border border-natural-border shadow-xs">
          <p className="text-sm font-bold text-natural-olive font-serif italic">Aucun rapport disponible</p>
        </div>
      )}
    </div>
  );
}
