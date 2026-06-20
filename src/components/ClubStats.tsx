import React, { useState } from 'react';
import { Runner } from '../types';
import { Users, Search, HeartPulse, ShieldCheck, Mail, Phone, ShieldAlert, BadgePlus, Trash2 } from 'lucide-react';

interface ClubStatsProps {
  runners: Runner[];
  currentUser: Runner;
  onAddRunner: (newRunner: Runner) => void;
  onDeleteRunner: (id: string) => void;
}

export default function ClubStats({ runners, currentUser, onAddRunner, onDeleteRunner }: ClubStatsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRunnerForm, setShowAddRunnerForm] = useState(false);
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

  return (
    <div className="space-y-6">
      {/* Roster Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif italic font-bold text-natural-olive flex items-center gap-1.5">
            <Users className="w-5 h-5 text-natural-accent" />
            Roster & Annuaire des Membres
          </h2>
          <p className="text-xs text-natural-sage font-medium">
            Gérez les fiches des athlètes du club et leurs contacts d'urgence.
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
          Ajouter un Coureur
        </button>
      </div>

      {/* Add Runner Form */}
      {showAddRunnerForm && (
        <form onSubmit={handleAddRunner} className="bg-natural-bone p-5 rounded-3xl border border-natural-border space-y-4 animate-fade-in text-xs">
          <div className="border-b border-natural-divider pb-2">
            <h3 className="font-bold font-serif italic text-natural-olive uppercase tracking-wider text-xs">Abonner un nouvel athlète (Mode Rapide ⚡)</h3>
            <p className="text-[10px] text-natural-sage font-medium">
              Saisissez uniquement son <strong>Nom complet</strong>. Un <strong>Nom d'utilisateur (Username)</strong> sera généré automatiquement et servira de <strong>Mot de passe initial</strong>. L'athlète se connectera avec et remplira lui-même l'email, téléphone et groupe sanguin à sa première connexion !
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 text-rose-700 font-bold rounded-lg border border-rose-100">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono">Nom Complet *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Ex. Sofiane Slimani"
                className="w-full px-3 py-2 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text font-semibold placeholder-natural-sage/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono">Nom d'utilisateur (Username de connexion) *</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  setIsCustomUsername(true);
                }}
                placeholder="Ex. sofiane_s"
                className="w-full px-3 py-2 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text font-semibold placeholder-natural-sage/50 font-mono"
              />
              <span className="text-[9px] text-natural-sage font-medium block mt-0.5">
                Utilisé pour se connecter rapidement (ex: @{username || 'username'}).
              </span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono">Téléphone (Optionnel - Laissez vide, l'athlète le remplira)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ex. Laissez vide..."
                className="w-full px-3 py-2 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text font-semibold placeholder-natural-sage/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono">Adresse Email (Optionnelle - Laissez vide, l'athlète la remplira)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex. Laissez vide..."
                className="w-full px-3 py-2 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text font-semibold placeholder-natural-sage/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono">Groupe Sanguin</label>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text font-semibold"
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
              <div>
                <label className="block text-[10px] font-bold text-natural-olive mb-1 font-mono">Rôle Club</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-natural-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text font-semibold"
                >
                  <option value="Membre">Abonné classique</option>
                  <option value="Coach">Coach de Course</option>
                  <option value="Admin">Administrateur</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddRunnerForm(false)}
              className="px-3 py-1.5 text-natural-sage bg-natural-sage-light/30 hover:bg-natural-sage-light/50 rounded-xl font-bold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-natural-olive hover:bg-natural-olive-hover font-bold rounded-xl shadow-xs cursor-pointer transition"
            >
              Créer le Profil
            </button>
          </div>
        </form>
      )}

      {/* Roster controls & listings */}
      <div className="bg-natural-sage-light/30 p-4 rounded-2xl border border-natural-border flex flex-col md:flex-row gap-3">
        {/* Search input to roster */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-natural-sage" />
          <input
            type="text"
            placeholder="Rechercher par nom, groupe sanguin, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text placeholder-natural-sage/50 font-semibold"
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
                  <span className="absolute top-4 right-4 bg-natural-olive/10 text-natural-olive text-[9px] font-bold px-2 py-0.5 rounded-md border border-natural-olive/20 font-serif italic">
                    Administrateur
                  </span>
                )}
                {runner.runClubRole === 'Coach' && (
                  <span className="absolute top-4 right-4 bg-natural-accent/15 text-natural-accent text-[9px] font-bold px-2 py-0.5 rounded-md border border-natural-accent/25 font-serif italic">
                    Coach de course
                  </span>
                )}
                {runner.runClubRole === 'Membre' && (
                  <span className="absolute top-4 right-4 bg-natural-sage-light/40 text-natural-text text-[9px] font-bold px-2 py-0.5 rounded-md border border-natural-border font-serif italic">
                    Abonné
                  </span>
                )}

                {/* Main Identity avatar and credentials */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-natural-sage-light/40 border border-natural-border text-natural-olive font-bold flex items-center justify-center font-serif italic shadow-inner">
                    {runner.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-serif italic font-extrabold text-natural-text text-sm tracking-wide">
                      {runner.name} {isMe && <span className="text-[10px] text-natural-accent font-bold font-mono">(Moi)</span>}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-natural-sage font-bold font-mono tracking-wider">ID: #{runner.id}</span>
                      {runner.username && (
                        <span className="text-[9px] bg-natural-sage-light/50 text-natural-olive border border-natural-border/60 font-mono font-bold px-1.5 py-0.2 rounded">
                          @{runner.username}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Technical contact attributes */}
                <div className="mt-4 pt-3 border-t border-natural-divider space-y-2 text-xs text-natural-text">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-natural-sage shrink-0" />
                    {runner.phone ? (
                      <span className="font-mono text-natural-text font-bold">{runner.phone}</span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-bold italic font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        Téléphone manquant ⚠️
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-natural-sage shrink-0" />
                    {runner.email ? (
                      <span className="truncate font-semibold">{runner.email}</span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-bold italic font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        Email manquant ⚠️
                      </span>
                    )}
                  </div>
                </div>

                {/* Critical emergency medical badges footer */}
                <div className="mt-4 pt-3 border-t border-natural-divider/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-natural-text font-bold">
                    <HeartPulse className="w-4 h-4 shrink-0 text-natural-accent" />
                    <span className="text-[10px] text-natural-sage font-mono">Groupe Sanguin:</span>
                    <span className="text-xs font-mono font-bold text-natural-olive">{runner.bloodType || 'O+'}</span>
                  </div>

                  {/* Let the user delete runners if they are not the active currentUser */}
                  {!isMe && (
                    <button
                      onClick={() => onDeleteRunner(runner.id)}
                      className="p-1 px-2 border border-natural-border hover:border-rose-200 hover:bg-rose-50 rounded text-natural-sage hover:text-rose-600 font-mono text-[9px] flex items-center gap-1 transition cursor-pointer"
                      title="Résoudre ou suspendre"
                    >
                      <Trash2 className="w-3 h-3" />
                      Suspendre
                    </button>
                  )}
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
