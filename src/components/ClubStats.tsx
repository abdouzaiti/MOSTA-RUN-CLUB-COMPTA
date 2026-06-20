import React, { useState } from 'react';
import { Runner } from '../types';
import { translations, Language } from '../translations';
import { Users, Search, HeartPulse, ShieldCheck, Mail, Phone, ShieldAlert, BadgePlus, Trash2 } from 'lucide-react';

interface ClubStatsProps {
  runners: Runner[];
  currentUser: Runner;
  onAddRunner: (newRunner: Runner) => void;
  onDeleteRunner: (id: string) => void;
  onUpdateRunner: (updatedRunner: Runner) => void;
  language: Language;
}

export default function ClubStats({ runners, currentUser, onAddRunner, onDeleteRunner, onUpdateRunner, language }: ClubStatsProps) {
  const t = (key: string) => (translations[language] as any)[key] || (translations['fr'] as any)[key] || key;
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRunnerForm, setShowAddRunnerForm] = useState(false);
  const [editingRunnerId, setEditingRunnerId] = useState<string | null>(null);
  
  // State for adding/editing 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [role, setRole] = useState<'Membre' | 'Coach' | 'Admin'>('Membre');
  const [errorMsg, setErrorMsg] = useState('');
  const [username, setUsername] = useState('');
  const [isCustomUsername, setIsCustomUsername] = useState(false);

  const generateUsername = (fullName: string) => {
    return fullName
      .toLowerCase()
      .normalize('NFD') // remove accents
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/[^a-z0-9._-]/g, '_') // replace spaces or other chars with underscores
      .replace(/_+/g, '_'); // collapse multiple underscores
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isCustomUsername) {
      setUsername(generateUsername(val));
    }
  };

  const filteredRunners = runners.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.username && r.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.email && r.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.bloodType && r.bloodType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddRunner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Veuillez indiquer au moins le Nom Complet.');
      return;
    }

    const finalUsername = (username.trim() || generateUsername(name)).toLowerCase();

    if (!finalUsername) {
      setErrorMsg("L'identifiant d'utilisateur généré est invalide ou vide.");
      return;
    }

    // Check if runner already exists with this username or name
    const existsName = runners.some(r => r.name.toLowerCase().trim() === name.toLowerCase().trim());
    const existsUser = runners.some(r => r.username?.toLowerCase().trim() === finalUsername);
    
    if (existsName) {
      setErrorMsg('Un athlète portant ce nom existe déjà.');
      return;
    }
    if (existsUser) {
      setErrorMsg(`L'identifiant "@${finalUsername}" est déjà utilisé de manière unique.`);
      return;
    }

    onAddRunner({
      id: 'usr-' + Date.now(),
      name: name.trim(),
      username: finalUsername,
      phone: phone.trim() || '',
      email: email.trim() || '',
      bloodType: bloodType || 'O+',
      runClubRole: role,
      password: finalUsername, // Le mot de passe initial est identique au username de connexion
      passwordChanged: false // Forcer le changement au premier login
    });

    // Reset Form
    setName('');
    setUsername('');
    setIsCustomUsername(false);
    setEmail('');
    setPhone('');
    setBloodType('O+');
    setRole('Membre');
    setErrorMsg('');
    setShowAddRunnerForm(false);
  };

  const handleStartEdit = (runner: Runner) => {
    setEditingRunnerId(runner.id);
    setName(runner.name);
    setUsername(runner.username || '');
    setIsCustomUsername(true);
    setEmail(runner.email || '');
    setPhone(runner.phone || '');
    setBloodType(runner.bloodType || 'O+');
    setRole(runner.runClubRole || 'Membre');
    setErrorMsg('');
    setShowAddRunnerForm(false);
  };

  const handleUpdateRunner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Veuillez indiquer au moins le Nom Complet.');
      return;
    }

    const runnerToUpdate = runners.find(r => r.id === editingRunnerId);
    if (!runnerToUpdate) return;

    onUpdateRunner({
      ...runnerToUpdate,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      phone: phone.trim(),
      email: email.trim(),
      bloodType: bloodType,
      runClubRole: role
    });

    setEditingRunnerId(null);
    setName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setErrorMsg('');
  };

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'font-arabic' : ''}`}>
      {/* Roster Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h2 className={`text-xl font-serif italic font-bold text-natural-olive flex items-center gap-1.5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Users className="w-5 h-5 text-natural-accent" />
            {language === 'ar' ? 'قائمة ودليل الأعضاء' : language === 'en' ? 'Roster & Member Directory' : 'Roster & Annuaire des Membres'}
          </h2>
          <p className="text-xs text-natural-sage font-medium">
            {language === 'ar' ? 'قم بإدارة ملفات رياضيي النادي وجهات اتصالهم في حالات الطوارئ.' : language === 'en' ? 'Manage club athlete files and emergency contacts.' : "Gérez les fiches des athlètes du club et leurs contacts d'urgence."}
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddRunnerForm(!showAddRunnerForm);
            setErrorMsg('');
          }}
          className="flex items-center justify-center gap-1 bg-natural-olive hover:bg-natural-olive-hover text-white px-4 py-2 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer font-serif italic"
        >
          <BadgePlus className="w-3.5 h-3.5 text-natural-accent" />
          {t('addRunner')}
        </button>
      </div>

      {/* Add/Edit Runner Form */}
      {(showAddRunnerForm || editingRunnerId) && (
        <form onSubmit={editingRunnerId ? handleUpdateRunner : handleAddRunner} className="bg-natural-bone p-5 rounded-3xl border border-natural-border space-y-4 animate-fade-in text-xs">
          <div className="border-b border-natural-divider pb-2">
            <h3 className="font-bold font-serif italic text-natural-olive uppercase tracking-wider text-sm">
              {editingRunnerId ? `Modifier le profil de ${runners.find(r => r.id === editingRunnerId)?.name}` : 'Abonner un nouvel athlète (Mode Rapide ⚡)'}
            </h3>
            {!editingRunnerId && (
              <p className="text-xs text-natural-sage font-medium">
                Saisissez uniquement son <strong>Nom complet</strong>. Un <strong>Nom d'utilisateur (Username)</strong> sera généré automatiquement et servira de <strong>Mot de passe initial</strong>.
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 font-bold rounded-lg border border-rose-100 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={language === 'ar' ? 'text-right' : ''}>
              <label className="block text-xs font-bold text-natural-olive mb-1">{t('fullName')} *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Ex. Sofiane Slimani"
                className="w-full px-3 py-2.5 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text text-xs font-semibold placeholder-natural-sage/55"
              />
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <label className="block text-xs font-bold text-natural-olive mb-1">{t('username')} *</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  setIsCustomUsername(true);
                }}
                placeholder="Ex. sofiane_s"
                className="w-full px-3 py-2.5 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text text-xs font-semibold placeholder-natural-sage/55 font-mono"
              />
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <label className="block text-xs font-bold text-natural-olive mb-1">{t('phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text text-xs font-semibold placeholder-natural-sage/55"
              />
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <label className="block text-xs font-bold text-natural-olive mb-1">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text text-xs font-semibold placeholder-natural-sage/55"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={language === 'ar' ? 'text-right' : ''}>
                <label className="block text-xs font-bold text-natural-olive mb-1">{t('bloodType')}</label>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text text-xs font-semibold"
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
              <div className={language === 'ar' ? 'text-right' : ''}>
                <label className="block text-xs font-bold text-natural-olive mb-1">{t('role')}</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text text-xs font-semibold"
                >
                  <option value="Membre">{t('member')}</option>
                  <option value="Coach">{t('coach')}</option>
                  <option value="Admin">{t('admin')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddRunnerForm(false);
                setEditingRunnerId(null);
              }}
              className="px-3 py-1.5 text-natural-sage bg-natural-sage-light/30 hover:bg-natural-sage-light/50 rounded-xl font-bold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-natural-olive hover:bg-natural-olive-hover font-bold rounded-xl shadow-xs cursor-pointer transition"
            >
              {editingRunnerId ? 'Enregistrer les modifications' : 'Créer le Profil'}
            </button>
          </div>
        </form>
      )}

      {/* Roster controls & listings */}
      <div className="bg-natural-sage-light/30 p-4 rounded-2xl border border-natural-border flex flex-col md:flex-row gap-3">
        {/* Search input to roster */}
        <div className="relative flex-1">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-natural-sage`} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full text-xs ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-white border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text placeholder-natural-sage/50 font-semibold`}
          />
        </div>
        <div className="px-3 py-1 bg-white border border-natural-border rounded-xl flex items-center justify-center text-xs font-mono font-bold text-natural-olive whitespace-nowrap">
          👥 {filteredRunners.length} athlètes indexés
        </div>
      </div>

      {filteredRunners.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-natural-border shadow-xs">
          <p className="text-sm font-bold text-natural-olive font-serif italic">Aucun athlète ne correspond aux critères</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRunners.map(runner => {
            const isMe = runner.id === currentUser.id;
            return (
              <div
                key={runner.id}
                className={`bg-white rounded-3xl p-5 border shadow-xs transition duration-300 relative ${
                  isMe ? 'border-natural-olive ring-1 ring-natural-sage-light' : 'border-natural-border hover:border-natural-sage/50'
                }`}
              >
                {/* Algerie Badge for Admins or Coach */}
                {runner.runClubRole === 'Admin' && (
                  <span className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} bg-natural-olive/10 text-natural-olive text-xs font-bold px-2.5 py-1 rounded-md border border-natural-olive/20 font-serif italic`}>
                    {t('admin')}
                  </span>
                )}
                {runner.runClubRole === 'Coach' && (
                  <span className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} bg-natural-accent/15 text-natural-accent text-xs font-bold px-2.5 py-1 rounded-md border border-natural-accent/25 font-serif italic`}>
                    {t('coach')}
                  </span>
                )}
                {runner.runClubRole === 'Membre' && (
                  <span className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} bg-natural-sage-light/40 text-natural-text text-xs font-bold px-2.5 py-1 rounded-md border border-natural-border font-serif italic`}>
                    {t('member')}
                  </span>
                )}

                {/* Main Identity avatar and credentials */}
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-serif italic font-extrabold text-natural-text text-base tracking-wide">
                      {runner.name} {isMe && <span className="text-xs text-natural-accent font-bold font-mono">(Moi)</span>}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs text-natural-sage font-bold font-mono tracking-wider">ID: #{runner.id}</span>
                      {runner.username && (
                        <span className="text-xs bg-natural-sage-light/50 text-natural-olive border border-natural-border/60 font-mono font-bold px-2 py-0.5 rounded">
                          @{runner.username}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Technical contact attributes */}
                <div className="mt-4 pt-4 border-t border-natural-divider space-y-2.5 text-xs text-natural-text">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-natural-sage shrink-0" />
                    {runner.phone ? (
                      <span className="font-mono text-natural-text font-bold text-sm">{runner.phone}</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-bold italic font-mono bg-amber-50 px-2 py-1 rounded border border-amber-100">
                        Téléphone manquant ⚠️
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-natural-sage shrink-0" />
                    {runner.email ? (
                      <span className="truncate font-semibold text-sm">{runner.email}</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-bold italic font-mono bg-amber-50 px-2 py-1 rounded border border-amber-100">
                        Email manquant ⚠️
                      </span>
                    )}
                  </div>
                </div>

                {/* Critical emergency medical badges footer */}
                <div className="mt-4 pt-4 border-t border-natural-divider/60 flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 text-natural-text font-bold ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <HeartPulse className="w-4.5 h-4.5 shrink-0 text-natural-accent" />
                    <span className="text-xs text-natural-sage">{t('bloodType')}:</span>
                    <span className="text-sm font-mono font-bold text-natural-olive">{runner.bloodType || 'O+'}</span>
                  </div>

                  {/* Let the user delete runners if they are not the active currentUser */}
                  <div className={`flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={() => handleStartEdit(runner)}
                      className="p-1 px-2.5 border border-natural-border hover:border-natural-olive/30 hover:bg-natural-olive/5 rounded text-natural-text hover:text-natural-olive text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Modifier les informations"
                    >
                      <BadgePlus className="w-3.5 h-3.5 text-natural-olive rotate-45" />
                      {t('edit')}
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => onDeleteRunner(runner.id)}
                        className="p-1 px-2.5 border border-natural-border hover:border-rose-200 hover:bg-rose-50 rounded text-natural-text hover:text-rose-600 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Résoudre ou suspendre"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        {t('suspend')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Instructions card */}
      <div className="p-4 bg-natural-bone border border-natural-border text-natural-text rounded-3xl flex flex-col md:flex-row items-start gap-3 text-xs leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-natural-accent shrink-0 mt-0.5 animate-pulse" />
        <div>
          <p className="font-bold font-serif italic text-natural-olive flex items-center gap-1">Note de Responsabilité (Alerte d'organisation) :</p>
          <p className="mt-1 text-natural-text font-medium">
            En tant qu'administrateur ou organisateur de parcours de course, vérifiez toujours les conditions météorologiques sur la côte de Mostaganem (Sablettes, Kharouba) avant de valider la sortie. Assurez-vous que la présence d'au moins deux trousses de secours de premier secours est confirmée auprès des entraîneurs participants.
          </p>
        </div>
      </div>
    </div>
  );
}
