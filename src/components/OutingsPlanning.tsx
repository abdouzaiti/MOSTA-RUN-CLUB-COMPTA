import React, { useState } from 'react';
import { Run, Runner, RunParticipant } from '../types';
import {
  Calendar, MapPin, Gauge, ShieldAlert, Plus, Users, Search, Filter,
  Check, X, Compass, CornerDownRight, ArrowUpRight, Flame, Layers,
  Bus, Home, Tag, UserCheck, Settings, Edit3, Save, Info, AlertCircle,
  UserPlus, Trash2, Coins, Shield
} from 'lucide-react';

interface OutingsPlanningProps {
  runs: Run[];
  currentUser: Runner;
  onToggleRegister: (runId: string) => void;
  onAddRun: (newRun: Omit<Run, 'participants' | 'completed'>) => void;
  onUpdateParticipant: (runId: string, runnerId: string, updates: Partial<RunParticipant>) => void;
  runners: Runner[];
  onAddParticipantByAdmin: (runId: string, runner: Runner) => void;
  onRemoveParticipantByAdmin: (runId: string, runnerId: string) => void;
}

export default function OutingsPlanning({
  runs,
  currentUser,
  onToggleRegister,
  onAddRun,
  onUpdateParticipant,
  runners = [],
  onAddParticipantByAdmin,
  onRemoveParticipantByAdmin
}: OutingsPlanningProps) {
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('Tous');
  const [distanceFilter, setDistanceFilter] = useState<string>('Tous');
  const [wilayaFilter, setWilayaFilter] = useState<string>('Tous'); // "Tous", "Mostaganem", "Hors Wilaya"

  // Form states for creating a run
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [distance, setDistance] = useState<number>(10);
  const [elevationGain, setElevationGain] = useState<number>(50);
  const [pace, setPace] = useState('5:45 min/km');
  const [difficulty, setDifficulty] = useState<'Facile' | 'Moyen' | 'Difficile'>('Facile');
  const [startPoint, setStartPoint] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number>(30);

  // New states for Or Wilaya outings
  const [isOrWilaya, setIsOrWilaya] = useState<boolean>(false);
  const [destinationWilaya, setDestinationWilaya] = useState<string>('');
  const [transportPrice, setTransportPrice] = useState<number>(1500);
  const [accommodationPrice, setAccommodationPrice] = useState<number>(2500);

  // Participant bib assignment editing state
  // Stores { [runId_runnerId]: string } for inline bib editing
  const [editingBibs, setEditingBibs] = useState<{ [key: string]: string }>({});

  // Accordion details state
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  // Success message after creating the run
  const [successMsg, setSuccessMsg] = useState('');

  // Get active upcoming runs only
  const upcomingRuns = runs.filter(r => !r.completed);

  // Process filters
  const filteredRuns = upcomingRuns.filter(run => {
    const matchesSearch = run.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          run.startPoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          run.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (run.destinationWilaya && run.destinationWilaya.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDifficulty = difficultyFilter === 'Tous' || run.difficulty === difficultyFilter;

    let matchesDistance = true;
    if (distanceFilter === 'court') {
      matchesDistance = run.distance <= 8;
    } else if (distanceFilter === 'moyen') {
      matchesDistance = run.distance > 8 && run.distance <= 15;
    } else if (distanceFilter === 'long') {
      matchesDistance = run.distance > 15;
    }

    let matchesWilaya = true;
    if (wilayaFilter === 'Mostaganem') {
      matchesWilaya = !run.isOrWilaya;
    } else if (wilayaFilter === 'Hors Wilaya') {
      matchesWilaya = !!run.isOrWilaya;
    }

    return matchesSearch && matchesDifficulty && matchesDistance && matchesWilaya;
  });

  const getDifficultyStyles = (level: string) => {
    switch (level) {
      case 'Facile':
        return 'bg-natural-sage-light text-natural-olive border-natural-sage/20';
      case 'Moyen':
        return 'bg-natural-accent/15 text-natural-olive border-natural-accent/25';
      case 'Difficile':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-natural-bone text-natural-sage border-natural-border';
    }
  };

  const handleCreateRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !startPoint || !description) {
      setFormError('S\'il vous plaît, remplissez tous les champs requis.');
      return;
    }

    if (isOrWilaya && !destinationWilaya) {
      setFormError('S\'il vous plaît, indiquez la Wilaya de destination.');
      return;
    }

    // Verify date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      setFormError('La date de sortie ne peut pas être dans le passé !');
      return;
    }

    onAddRun({
      id: 'run-' + Date.now(),
      title,
      date,
      time,
      distance: Number(distance),
      elevationGain: Number(elevationGain),
      pace,
      difficulty,
      startPoint,
      description,
      maxParticipants: Number(maxParticipants),
      isOrWilaya,
      destinationWilaya: isOrWilaya ? destinationWilaya : undefined,
      transportPrice: isOrWilaya ? Number(transportPrice) : undefined,
      accommodationPrice: isOrWilaya ? Number(accommodationPrice) : undefined
    });

    // Reset Form
    setTitle('');
    setDate('');
    setTime('');
    setDistance(10);
    setElevationGain(50);
    setPace('5:45 min/km');
    setDifficulty('Facile');
    setStartPoint('');
    setDescription('');
    setMaxParticipants(30);
    setIsOrWilaya(false);
    setDestinationWilaya('');
    setTransportPrice(1500);
    setAccommodationPrice(2500);
    setFormError('');
    setShowForm(false);

    setSuccessMsg('Nouveau run planifié avec succès ! 🏃‍♂️🎉 (Spécial Hors-Wilaya enregistré)');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header section with toggle for form */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif italic font-bold text-natural-olive flex items-center gap-2">
            <Flame className="w-5 h-5 text-natural-accent animate-pulse" />
            Planning des Sorties Côte à Côte
          </h2>
          <p className="text-xs text-natural-sage font-medium">
            Rejoignez une sortie de groupe ou planifiez en une pour motiver les autres !
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormError('');
          }}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm border ${
            showForm
              ? 'bg-natural-sage-light hover:bg-natural-sage/25 text-natural-olive border-natural-border'
              : 'bg-natural-olive hover:bg-natural-olive-hover text-white border-transparent'
          }`}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Fermer le formulaire
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-white" />
              Planifier un Run
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-natural-sage-light text-natural-olive border border-natural-border text-xs font-semibold rounded-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5 text-natural-olive shrink-0 animate-pulse" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Propose Run Dialog Form */}
      {showForm && (
        <form onSubmit={handleCreateRun} className="bg-white rounded-3xl p-6 border border-natural-border space-y-4 animate-fade-in shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-natural-olive font-serif italic uppercase tracking-wider mb-1">
              Détails du nouveau Run
            </h3>
            <p className="text-xs text-natural-sage">
              Formulaire administrateur pour planifier les parcours officiels.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-natural-olive mb-1 uppercase tracking-wider">Titre de la sortie *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex. Sortie Cool le long des Sablettes"
                className="w-full text-xs px-3 py-2.5 bg-natural-bone border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive focus:border-natural-olive text-natural-text placeholder-natural-sage/70"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-natural-olive mb-1 uppercase tracking-wider">Point de Départ / RDV *</label>
              <input
                type="text"
                required
                value={startPoint}
                onChange={e => setStartPoint(e.target.value)}
                placeholder="Ex. Rond-point de Salamandre face au port"
                className="w-full text-xs px-3 py-2.5 bg-natural-bone border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive focus:border-natural-olive text-natural-text placeholder-natural-sage/70"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-natural-olive mb-1 uppercase tracking-wider">Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-natural-bone border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-natural-olive mb-1 uppercase tracking-wider">Heure de départ *</label>
                <input
                  type="time"
                  required
                   value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-natural-bone border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-natural-olive mb-1 uppercase tracking-wider">Distance (km) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={distance}
                  onChange={e => setDistance(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-natural-bone border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-natural-olive mb-1 uppercase tracking-wider">Dénivelé positif (m)</label>
                <input
                  type="number"
                  min="0"
                  max="3000"
                  value={elevationGain}
                  onChange={e => setElevationGain(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-natural-bone border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-natural-olive mb-1 uppercase tracking-wider">Allure Estimée *</label>
                <input
                  type="text"
                  required
                  value={pace}
                  onChange={e => setPace(e.target.value)}
                  placeholder="Ex. 5:45 min/km ou Libre"
                  className="w-full text-xs px-3 py-2 bg-natural-bone border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text placeholder-natural-sage/70"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-natural-olive mb-1 uppercase tracking-wider">Difficulté *</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-natural-bone border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text cursor-pointer"
                >
                  <option value="Facile">🟢 Facile (Débutants bienvenus)</option>
                  <option value="Moyen">🟡 Moyen (Habitués du footing)</option>
                  <option value="Difficile">🔴 Difficile (Trail montées / Rythme soutenu)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-natural-olive mb-1 uppercase tracking-wider">Limite Coureurs</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={maxParticipants}
                  onChange={e => setMaxParticipants(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-natural-bone border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text"
                />
              </div>
              <div className="flex items-end pb-1 text-[10px] text-natural-sage leading-relaxed font-mono font-medium">
                * Les participants s'inscrivent directement en un clic.
              </div>
            </div>

            {/* Algerian Outside Wilaya Tour Options (Kharjat Or Wilaya) */}
            <div className="p-4 bg-natural-sage-light/25 rounded-2xl border border-natural-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-natural-olive" />
                  <span className="text-xs font-bold text-natural-olive uppercase tracking-wider">
                    🚙 Sortie Hors Wilaya / National
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOrWilaya}
                    onChange={e => setIsOrWilaya(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-natural-sage/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-natural-olive"></div>
                  <span className="ml-2 text-[11px] font-bold text-natural-olive uppercase tracking-wider">Activer</span>
                </label>
              </div>

              {isOrWilaya && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-natural-olive mb-1 uppercase tracking-wider">
                      Wilaya de Destination *
                    </label>
                    <input
                      type="text"
                      required={isOrWilaya}
                      value={destinationWilaya}
                      onChange={e => setDestinationWilaya(e.target.value)}
                      placeholder="Ex. Chlef, Oran, Algiers..."
                      className="w-full text-xs px-3 py-2 bg-white border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-natural-olive mb-1 uppercase tracking-wider">
                      Prix Transport (DA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={transportPrice}
                      onChange={e => setTransportPrice(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-white border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-natural-olive mb-1 uppercase tracking-wider">
                      Prix Nuitée / Lmbata (DA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={accommodationPrice}
                      onChange={e => setAccommodationPrice(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-white border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-natural-olive mb-1 uppercase tracking-wider">Description du run et recommandations *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez l'itinéraire, les points d'ombre, les éventuelles pauses ravitaillement..."
              className="w-full text-xs px-3 py-2 bg-natural-bone border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive text-natural-text placeholder-natural-sage/70"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError('');
              }}
              className="px-4 py-2 text-natural-olive bg-natural-sage-light/60 hover:bg-natural-sage/20 rounded-xl text-xs font-bold transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-white bg-natural-olive hover:bg-natural-olive-hover font-bold rounded-xl text-xs shadow-sm transition"
            >
              Planifier le Run
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Box */}
      <div className="bg-white rounded-3xl p-4 border border-natural-border grid grid-cols-1 md:grid-cols-4 gap-3 shadow-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-natural-sage" />
          <input
            type="text"
            placeholder="Rechercher par route, phare, wilaya..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 bg-natural-bone text-natural-text border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-natural-sage shrink-0" />
          <span className="text-[11px] text-natural-olive font-bold uppercase font-mono">Difficulté :</span>
          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className="flex-1 text-xs px-2.5 py-2 bg-natural-bone text-natural-text border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive cursor-pointer"
          >
            <option value="Tous">Toutes</option>
            <option value="Facile">🟢 Facile</option>
            <option value="Moyen">🟡 Moyen</option>
            <option value="Difficile">🔴 Difficile</option>
          </select>
        </div>

        {/* Distance Filter */}
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-natural-sage shrink-0" />
          <span className="text-[11px] text-natural-olive font-bold uppercase font-mono">Distance :</span>
          <select
            value={distanceFilter}
            onChange={e => setDistanceFilter(e.target.value)}
            className="flex-1 text-xs px-2.5 py-2 bg-natural-bone text-natural-text border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive cursor-pointer"
          >
            <option value="Tous">Toutes distances</option>
            <option value="court">🍂 Court (≤ 8 KM)</option>
            <option value="moyen">👟 Moyen (8 - 15 KM)</option>
            <option value="long">🔋 Long (&gt; 15 KM)</option>
          </select>
        </div>

        {/* Wilaya Filter */}
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-natural-sage shrink-0" />
          <span className="text-[11px] text-natural-olive font-bold uppercase font-mono">Secteur :</span>
          <select
            value={wilayaFilter}
            onChange={e => setWilayaFilter(e.target.value)}
            className="flex-1 text-xs px-2.5 py-2 bg-natural-bone text-natural-text border border-natural-border rounded-xl focus:outline-none focus:ring-1 focus:ring-natural-olive cursor-pointer"
          >
            <option value="Tous">Tout compris</option>
            <option value="Mostaganem">📍 Mostaganem (Local)</option>
            <option value="Hors Wilaya">🚙 Hors Wilaya (National)</option>
          </select>
        </div>
      </div>

      {/* Runs List */}
      {filteredRuns.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-natural-border shadow-xs">
          <Compass className="w-10 h-10 text-natural-sage mx-auto mb-3 stroke-[1.5]" />
          <p className="text-sm font-bold text-natural-olive font-serif italic">Aucun run ne correspond à vos filtres</p>
          <p className="text-xs text-natural-sage mt-1 font-medium">Essayez d'élargir vos termes de recherche ou de réinitialiser les filtres.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRuns.map(run => {
            const isUserRegistered = run.participants.some(p => p.id === currentUser.id);
            const isFull = run.maxParticipants ? run.participants.length >= run.maxParticipants : false;
            const isExpanded = expandedRunId === run.id;

            return (
              <div
                key={run.id}
                className={`bg-white rounded-3xl border transition-all duration-300 ${
                  isExpanded ? 'border-natural-olive/40 shadow-sm ring-1 ring-natural-olive/20' : 'border-natural-border hover:border-natural-olive/30 shadow-xs'
                }`}
              >
                {/* Main run visual row */}
                <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${getDifficultyStyles(run.difficulty)}`}>
                        {run.difficulty}
                      </span>
                      <span className="text-[10px] text-natural-olive font-mono font-bold flex items-center gap-1.5 bg-natural-sage-light/30 px-2 py-0.5 rounded border border-natural-border/40">
                        <Calendar className="w-3.5 h-3.5 text-natural-olive" />
                        {new Date(run.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {run.time}
                      </span>
                      {run.isOrWilaya && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 font-mono font-black border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-xxs shrink-0">
                          <Compass className="w-3.5 h-3.5 text-amber-700" />
                          HORS WILAYA ({run.destinationWilaya || 'National'})
                        </span>
                      )}
                    </div>

                    <h3 className="text-md md:text-lg font-serif italic font-black text-natural-olive tracking-wide">
                      {run.title}
                    </h3>

                    {/* Meta coordinates details */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-natural-text font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-natural-olive shrink-0" />
                        <span className="truncate max-w-[200px] md:max-w-md">{run.startPoint}</span>
                      </div>
                      <div className="flex items-center gap-1 text-natural-accent">
                        <Gauge className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-bold">Allure: {run.pace}</span>
                      </div>
                    </div>
                  </div>

                  {/* Highlights distance badges & toggle action */}
                  <div className="flex items-center md:justify-end gap-3 md:gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-natural-divider">
                    <div className="text-left md:text-right">
                      <span className="text-[9px] text-natural-sage uppercase tracking-widest font-mono font-bold">Distance</span>
                      <p className="font-serif italic font-black text-2xl text-natural-olive leading-none">
                        {run.distance} <span className="text-xs font-bold text-natural-sage">KM</span>
                      </p>
                      {run.elevationGain && run.elevationGain > 0 ? (
                        <span className="text-[10px] text-natural-sage font-mono block mt-0.5 font-semibold">+{run.elevationGain}m d+</span>
                      ) : null}
                    </div>

                    {/* Participants count bubble */}
                    <div className="px-3 py-1.5 bg-natural-bone rounded-xl text-center border border-natural-border">
                      <span className="text-[9px] text-natural-sage block font-mono font-bold">Abonnés</span>
                      <span className="text-xs font-bold text-natural-olive flex items-center gap-1 justify-center">
                        <Users className="w-3 h-3 text-natural-sage" />
                        {run.participants.length}
                        {run.maxParticipants && <span className="text-natural-sage font-normal">/{run.maxParticipants}</span>}
                      </span>
                    </div>

                    {/* Inscription Action Button */}
                    <button
                      id={`register-btn-${run.id}`}
                      disabled={!isUserRegistered && isFull}
                      onClick={() => onToggleRegister(run.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition shrink-0 flex items-center gap-1 shadow-sm border ${
                        isUserRegistered
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                          : isFull
                          ? 'bg-natural-sage-light/20 text-natural-sage cursor-not-allowed border-natural-border'
                          : 'bg-natural-olive hover:bg-natural-olive-hover text-white border-transparent'
                      }`}
                    >
                      {isUserRegistered ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          Se désinscrire
                        </>
                      ) : isFull ? (
                        'Complet'
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-white bg-white/20 rounded-full" />
                          S'inscrire
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sub row expander toggle */}
                <div
                  id={`details-toggle-${run.id}`}
                  onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                  className="px-5 py-2.5 bg-natural-sage-light/10 border-t border-natural-divider rounded-b-3xl flex items-center justify-between text-xs text-natural-sage hover:bg-natural-sage-light/30 cursor-pointer transition select-none font-bold"
                >
                  <p className="truncate max-w-[280px] md:max-w-md text-[11px] text-natural-sage italic font-normal">
                    {run.description}
                  </p>
                  <span className="text-natural-olive text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                    {isExpanded ? 'Masquer détails ▲' : 'Détails & Participants ▼'}
                  </span>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="p-5 md:p-6 bg-natural-bone/40 border-t border-natural-divider space-y-5 animate-fade-in text-xs rounded-b-3xl">
                    
                    {/* Admin & Coach exclusive logistics panel */}
                    {(currentUser.runClubRole === 'Admin' || currentUser.runClubRole === 'Coach') && (
                      <div className="bg-white border-2 border-natural-olive/35 rounded-2xl p-4.5 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-natural-divider pb-2.5">
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-5 h-5 text-natural-olive animate-pulse shrink-0" />
                            <div>
                              <h4 className="font-bold text-natural-olive uppercase tracking-wide text-xs">
                                👑 Panneau de Logistique & Budgets (Réservé aux Admins & Coachs)
                              </h4>
                              <p className="text-[10px] text-natural-sage font-semibold uppercase tracking-wider">
                                {run.isOrWilaya ? `Sortie Nationale logistique • ${run.destinationWilaya || 'Hors Wilaya'}` : 'Sortie locale • Mostaganem'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-natural-olive text-white px-2.5 py-0.5 rounded font-mono font-bold">
                            Espace Manager
                          </span>
                        </div>

                        {/* Assign a new runner dropdown */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-natural-bone p-3 rounded-xl border border-natural-border">
                          <span className="text-[11px] font-bold text-natural-olive flex items-center gap-1.5 shrink-0">
                            <UserPlus className="w-4 h-4 text-natural-olive" />
                            Inscrire un coureur directement :
                          </span>
                          <select
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              if (!selectedId) return;
                              const matchedRunner = runners.find(r => r.id === selectedId);
                              if (matchedRunner) {
                                onAddParticipantByAdmin(run.id, matchedRunner);
                              }
                              e.target.value = ''; // Reset select
                            }}
                            className="text-[11px] font-bold px-3 py-2 bg-white text-natural-text border border-natural-border rounded-lg outline-none focus:ring-1 focus:ring-natural-olive cursor-pointer"
                          >
                            <option value="">-- Sélectionner un athlète à ajouter --</option>
                            {runners
                              .filter(r => !run.participants.some(p => p.id === r.id))
                              .map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.username || 'Pas d\'username'})</option>
                              ))}
                          </select>
                        </div>

                        {/* Detailed table of current registered runners in logistics */}
                        {run.participants.length === 0 ? (
                          <div className="p-4 text-center text-[11px] text-natural-sage italic border border-dashed border-natural-border rounded-xl">
                            Aucun participant inscrit pour l'instant. Choisissez un athlète ci-dessus pour l'ajouter manuellement !
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px] border-collapse min-w-[650px]">
                              <thead>
                                <tr className="border-b border-natural-border text-natural-sage font-bold font-mono tracking-wider">
                                  <th className="py-2">Athlète</th>
                                  <th className="py-2">Dossard</th>
                                  <th className="py-2">Transport (Bus)</th>
                                  <th className="py-2">Lmbata / Nuitée</th>
                                  <th className="py-2 text-right">Prix Total</th>
                                  <th className="py-2 text-center">Versement</th>
                                  <th className="py-2 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-natural-divider">
                                {run.participants.map(partic => {
                                  const hasTransport = partic.useTransport !== false;
                                  const hasLodging = !!partic.useAccommodation;
                                  
                                  const costTransport = run.isOrWilaya ? (run.transportPrice || 0) : 0;
                                  const costLodging = run.isOrWilaya ? (run.accommodationPrice || 0) : 0;
                                  
                                  const stdTotal = (hasTransport ? costTransport : 0) + (hasLodging ? costLodging : 0);
                                  const displayPrice = partic.customPrice !== undefined ? partic.customPrice : stdTotal;

                                  return (
                                    <tr key={partic.id} className="hover:bg-natural-bone/50 transition-colors">
                                      <td className="py-2.5 font-bold text-natural-text">
                                        <p className="text-[11px]">{partic.name}</p>
                                        <p className="text-[9px] font-mono font-medium text-natural-sage">
                                          {partic.phone || 'Pas de tél.'} • {partic.bloodType || 'O+'}
                                        </p>
                                      </td>
                                      <td className="py-2">
                                        <input
                                          type="text"
                                          value={partic.bibNumber || ''}
                                          placeholder="Ex. 102"
                                          onChange={(e) => onUpdateParticipant(run.id, partic.id, { bibNumber: e.target.value })}
                                          className="w-18 font-mono font-bold text-center border border-natural-border focus:ring-1 focus:ring-natural-olive rounded bg-white px-1.5 py-1"
                                        />
                                      </td>
                                      <td className="py-2">
                                        <select
                                          value={hasTransport ? 'yes' : 'no'}
                                          onChange={(e) => onUpdateParticipant(run.id, partic.id, { useTransport: e.target.value === 'yes' })}
                                          className="text-[10px] font-semibold border border-natural-border rounded bg-white px-2 py-1 cursor-pointer outline-none"
                                        >
                                          <option value="yes">🚌 Bus ({costTransport} DA)</option>
                                          <option value="no">🚫 Solo</option>
                                        </select>
                                      </td>
                                      <td className="py-2">
                                        <select
                                          value={hasLodging ? 'yes' : 'no'}
                                          onChange={(e) => onUpdateParticipant(run.id, partic.id, { useAccommodation: e.target.value === 'yes' })}
                                          className="text-[10px] font-semibold border border-natural-border rounded bg-white px-2 py-1 cursor-pointer outline-none"
                                        >
                                          <option value="yes">🏨 Nuitée ({costLodging} DA)</option>
                                          <option value="no">🚫 Non (A/R)</option>
                                        </select>
                                      </td>
                                      <td className="py-2 text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="number"
                                              value={displayPrice}
                                              onChange={(e) => onUpdateParticipant(run.id, partic.id, { customPrice: Number(e.target.value) })}
                                              className="w-20 font-mono font-bold text-right border border-natural-border focus:ring-1 focus:ring-natural-olive rounded bg-white px-1.5 py-1"
                                            />
                                            <span className="text-[9px] font-mono text-natural-sage">DA</span>
                                          </div>
                                          {partic.customPrice !== undefined && (
                                            <button
                                              onClick={() => onUpdateParticipant(run.id, partic.id, { customPrice: undefined })}
                                              className="text-[8px] font-sans font-bold text-amber-700 hover:underline hover:text-amber-800"
                                            >
                                              Rétablir standard ({stdTotal} DA)
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2 text-center">
                                        <button
                                          onClick={() => onUpdateParticipant(run.id, partic.id, { isPaid: !partic.isPaid })}
                                          className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                            partic.isPaid
                                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                          }`}
                                        >
                                          {partic.isPaid ? '🟢 Payé' : '🔴 Non payé'}
                                        </button>
                                      </td>
                                      <td className="py-2 text-center">
                                        <button
                                          onClick={() => {
                                            if (confirm(`Voulez-vous désinscrire ${partic.name} de cette sortie ?`)) {
                                              onRemoveParticipantByAdmin(run.id, partic.id);
                                            }
                                          }}
                                          title="Désinscrire l'athlète"
                                          className="p-1 hover:bg-rose-50 rounded text-rose-600 hover:text-rose-800 transition"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Outing logistical math summaries */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-natural-bone/40 p-3.5 rounded-xl border border-natural-border text-center">
                          <div className="bg-white p-2.5 rounded-lg border border-natural-border shadow-xxs">
                            <span className="text-[9px] text-natural-sage block font-mono font-bold uppercase leading-normal">Total Athlètes</span>
                            <span className="text-xs font-black text-natural-olive font-mono">
                              {run.participants.length} inscrits
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-natural-border shadow-xxs">
                            <span className="text-[9px] text-natural-sage block font-mono font-bold uppercase leading-normal">Bus (Places)</span>
                            <span className="text-xs font-black text-natural-olive font-mono">
                              {run.participants.filter(p => p.useTransport !== false).length} places
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-natural-border shadow-xxs">
                            <span className="text-[9px] text-natural-sage block font-mono font-bold uppercase leading-normal">Lmbata / Nuitées</span>
                            <span className="text-xs font-black text-natural-olive font-mono">
                              {run.participants.filter(p => p.useAccommodation).length} pers
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-natural-border shadow-xxs bg-emerald-500/5">
                            <span className="text-[9px] text-emerald-800 block font-mono font-bold uppercase leading-normal flex items-center justify-center gap-1">
                              <Coins className="w-3 h-3 text-emerald-700" /> Montant Collecté Club
                            </span>
                            <span className="text-xs font-serif font-black italic text-emerald-800">
                              {run.participants.reduce((sum, partic) => {
                                const hasTransport = partic.useTransport !== false;
                                const hasLodging = !!partic.useAccommodation;
                                const costTransport = run.isOrWilaya ? (run.transportPrice || 0) : 0;
                                const costLodging = run.isOrWilaya ? (run.accommodationPrice || 0) : 0;
                                const stdTotal = (hasTransport ? costTransport : 0) + (hasLodging ? costLodging : 0);
                                return sum + (partic.customPrice !== undefined ? partic.customPrice : stdTotal);
                              }, 0).toLocaleString('fr-FR')} DA
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Detailed Instruction Panel */}
                      <div className="md:col-span-2 space-y-3">
                        <div>
                          <h4 className="font-bold text-natural-olive uppercase tracking-widest font-mono text-[10px] mb-1 flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-natural-accent" />
                            Description & Trajet du Club
                          </h4>
                          <p className="text-natural-text leading-relaxed text-xs font-semibold">
                            {run.description}
                          </p>
                        </div>

                        {run.isOrWilaya && (
                          <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/80 space-y-3">
                            <div className="flex items-center gap-2">
                              <Compass className="w-5 h-5 text-amber-700 animate-pulse" />
                              <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">
                                Logistique Sortie Nationale: {run.destinationWilaya || 'Hors Wilaya'}
                              </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-natural-olive">
                              <div className="bg-white/60 p-3 rounded-xl border border-amber-200">
                                <span className="font-mono text-[10px] block font-bold text-amber-900 uppercase">🚌 Transport Club</span>
                                <span className="font-serif italic font-extrabold text-sm">{run.transportPrice || 0} DA / Pers</span>
                              </div>
                              <div className="bg-white/60 p-3 rounded-xl border border-amber-200">
                                <span className="font-mono text-[10px] block font-bold text-amber-900 uppercase">🏨 Hébergement / Lmbata</span>
                                <span className="font-serif italic font-extrabold text-sm">{run.accommodationPrice || 0} DA / Nuit</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive Personal Booking Settings Panel for registered athletes */}
                        {isUserRegistered && run.isOrWilaya && (
                          (() => {
                            const myParticipantEntry = run.participants.find(p => p.id === currentUser.id);
                            const transportChoice = myParticipantEntry?.useTransport ?? true; // defaults to true
                            const accommodationChoice = myParticipantEntry?.useAccommodation ?? false; // defaults to false
                            const currentBib = myParticipantEntry?.bibNumber ?? '';

                            return (
                              <div className="bg-natural-olive/5 rounded-2xl p-4 border border-natural-olive/20 space-y-3">
                                <div className="flex items-center gap-1.5">
                                  <Settings className="w-4.5 h-4.5 text-natural-olive animate-spin-slow" />
                                  <h4 className="font-bold text-natural-olive uppercase tracking-wide text-xs">
                                    🎯 Vos Options de Voyage (Mosta Run Club)
                                  </h4>
                                </div>
                                
                                <p className="text-[10px] text-natural-sage font-medium">
                                  Configurez vos réservations pour calculer le budget global de la sortie. Elles se synchronisent en temps réel.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Transport Toggle */}
                                  <div className="space-y-1 bg-white p-3 rounded-xl border border-natural-border/60">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-natural-olive flex items-center gap-1">
                                        <Bus className="w-3.5 h-3.5" />
                                        Transport du Club
                                      </span>
                                      <span className="text-[10px] font-mono text-natural-sage font-bold">
                                        {run.transportPrice ? `${run.transportPrice} DA` : 'Gratuit'}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => onUpdateParticipant(run.id, currentUser.id, { useTransport: true })}
                                        className={`py-1 text-[10px] font-bold rounded-lg border transition ${
                                          transportChoice
                                            ? 'bg-natural-olive text-white border-transparent shadow-xs'
                                            : 'bg-natural-bone hover:bg-natural-sage-light/20 text-natural-sage border-natural-border'
                                        }`}
                                      >
                                        Oui, Autocar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onUpdateParticipant(run.id, currentUser.id, { useTransport: false })}
                                        className={`py-1 text-[10px] font-bold rounded-lg border transition ${
                                          !transportChoice
                                            ? 'bg-natural-olive text-white border-transparent shadow-xs'
                                            : 'bg-natural-bone hover:bg-natural-sage-light/20 text-natural-sage border-natural-border'
                                        }`}
                                      >
                                        Non, Solo
                                      </button>
                                    </div>
                                  </div>

                                  {/* Overnight Toggle */}
                                  <div className="space-y-1 bg-white p-3 rounded-xl border border-natural-border/60">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-natural-olive flex items-center gap-1">
                                        <Home className="w-3.5 h-3.5" />
                                        Lmbata / Nuitée
                                      </span>
                                      <span className="text-[10px] font-mono text-natural-sage font-bold">
                                        {run.accommodationPrice ? `${run.accommodationPrice} DA` : 'Gratuit'}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => onUpdateParticipant(run.id, currentUser.id, { useAccommodation: true })}
                                        className={`py-1 text-[10px] font-bold rounded-lg border transition ${
                                          accommodationChoice
                                            ? 'bg-natural-olive text-white border-transparent shadow-xs'
                                            : 'bg-natural-bone hover:bg-natural-sage-light/20 text-natural-sage border-natural-border'
                                        }`}
                                      >
                                        Oui, Nuitée
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onUpdateParticipant(run.id, currentUser.id, { useAccommodation: false })}
                                        className={`py-1 text-[10px] font-bold rounded-lg border transition ${
                                          !accommodationChoice
                                            ? 'bg-natural-olive text-white border-transparent shadow-xs'
                                            : 'bg-natural-bone hover:bg-natural-sage-light/20 text-natural-sage border-natural-border'
                                        }`}
                                      >
                                        Non (A/R)
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Custom Bib inputs */}
                                <div className="bg-white p-3 rounded-xl border border-natural-border/60 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <Tag className="w-3.5 h-3.5 text-natural-olive" />
                                    <span className="text-[11px] font-bold text-natural-olive uppercase tracking-wider">
                                      Mon dossard (#)
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Ex. 705"
                                    value={currentBib}
                                    onChange={e => onUpdateParticipant(run.id, currentUser.id, { bibNumber: e.target.value })}
                                    className="w-24 text-[11px] font-mono font-bold px-2 py-1 text-center bg-natural-bone border border-natural-olive/30 focus:outline-none focus:ring-1 focus:ring-natural-olive rounded-lg"
                                  />
                                </div>
                              </div>
                            );
                          })()
                        )}

                        {run.isOrWilaya && (
                          <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-2.5">
                            <h5 className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                              📊 Rapport Global de Logistique
                            </h5>
                            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                              <div className="bg-white p-2 rounded-lg border border-natural-border/60 shadow-xxs">
                                <span className="text-[9px] text-natural-sage font-mono block font-bold leading-normal">AUTOCAR CLUB</span>
                                <span className="font-black text-natural-olive font-mono text-xs">
                                  {run.participants.filter(p => p.useTransport !== false).length} places
                                </span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-natural-border/60 shadow-xxs">
                                <span className="text-[9px] text-natural-sage font-mono block font-bold leading-normal">LMBATA / NUITÉES</span>
                                <span className="font-black text-natural-olive font-mono text-xs">
                                  {run.participants.filter(p => p.useAccommodation).length} pers
                                </span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-natural-border/60 shadow-xxs">
                                <span className="text-[9px] text-natural-sage font-mono block font-bold leading-normal">DOSSARDS ASSIGNÉS</span>
                                <span className="font-black text-natural-olive font-mono text-xs">
                                  {run.participants.filter(p => p.bibNumber).length} / {run.participants.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="p-4 bg-natural-sage-light/35 border border-natural-border/70 rounded-xl space-y-1">
                          <p className="font-bold text-natural-olive text-[11px] flex items-center gap-1">
                            📢 Consignes Spéciales :
                          </p>
                          <ul className="list-disc pl-4 space-y-1 text-natural-text font-medium text-[11px]">
                            <li>Soyez à l'heure : le briefing des étirements commence 10min avant le départ.</li>
                            <li>Emmenez votre bouteille d'eau ou système d'hydratation de 500ml minimum.</li>
                            <li>En cas de retard, contactez l'un des admins ou signalez-vous sur le canal du club.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Registrants Panel */}
                      <div className="space-y-2.5 bg-white p-3.5 border border-natural-border rounded-2xl shadow-xs">
                        <div className="flex justify-between items-center border-b border-natural-divider pb-1.5">
                          <h4 className="font-bold text-natural-olive uppercase tracking-widest font-mono text-[9px] flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-natural-olive" />
                            Liste des Inscrits
                          </h4>
                          <span className="text-[9px] bg-natural-sage-light text-natural-olive px-2 py-0.2 rounded font-mono font-bold">
                            {run.participants.length} coureurs
                          </span>
                        </div>

                        {run.participants.length === 0 ? (
                          <p className="text-natural-sage italic text-[11px] text-center py-4 bg-natural-bone/40 rounded-xl border border-natural-border font-medium">
                            Aucun inscrit pour le moment. Soyez le premier !
                          </p>
                        ) : (
                          <div className="space-y-1.5 overflow-y-auto max-h-72 pr-0.5">
                            {run.participants.map(partic => {
                              const isMe = partic.id === currentUser.id;
                              return (
                                <div
                                  key={partic.id}
                                  className={`flex flex-col gap-2 p-2.5 rounded-xl border text-xs bg-white ${
                                    isMe ? 'border-natural-olive/35 bg-natural-sage-light/20 shadow-xxs' : 'border-natural-border/60'
                                  }`}
                                >
                                  {/* Info top row */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 truncate">
                                      <div className="w-6 h-6 rounded-full bg-natural-sage/20 text-natural-olive flex items-center justify-center font-bold text-[9px] border shrink-0 font-serif italic">
                                        {partic.name.split(' ').map(n => n[0]).join('')}
                                      </div>
                                      <div className="truncate">
                                        <p className="font-bold text-natural-text truncate text-[11px] flex items-center gap-1">
                                          {partic.name} 
                                          {isMe && <span className="text-[9px] text-natural-accent font-bold font-mono">(Vous)</span>}
                                        </p>
                                        {partic.runClubRole && partic.runClubRole !== 'Membre' && (
                                          <span className="text-[9px] text-natural-accent font-bold uppercase tracking-wider block leading-none">{partic.runClubRole}</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Blood & Bib */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      {partic.bloodType && (
                                        <span className="text-[9px] font-mono font-black px-1.5 py-0.2 bg-rose-50 text-rose-600 rounded border border-rose-100 shrink-0" title="Groupe sanguin">
                                          {partic.bloodType}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Travel Options bottom bar */}
                                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-natural-divider text-[10px]">
                                    {run.isOrWilaya ? (
                                      <div className="flex items-center gap-1">
                                        {/* Transport Badge */}
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-0.5 border ${
                                          partic.useTransport !== false
                                            ? 'bg-sky-50 text-sky-700 border-sky-100'
                                            : 'bg-natural-bone text-natural-sage border-natural-border/40'
                                        }`} title={partic.useTransport !== false ? 'Transport Club réservé' : 'Transport indépendant'}>
                                          <Bus className="w-2.5 h-2.5" />
                                          {partic.useTransport !== false ? 'Bus' : 'Solo'}
                                        </span>

                                        {/* Overnight Badge */}
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-0.5 border ${
                                          partic.useAccommodation
                                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                                            : 'bg-natural-bone text-natural-sage border-natural-border/40'
                                        }`} title={partic.useAccommodation ? "Nuitée avec l'équipe" : "Aller-retour direct"}>
                                          <Home className="w-2.5 h-2.5" />
                                          {partic.useAccommodation ? 'Nuitée' : 'A/R'}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-natural-sage italic font-mono">📍 Local</div>
                                    )}

                                    {/* Bib assigner */}
                                    {(() => {
                                      const key = `${run.id}_${partic.id}`;
                                      const isEditing = editingBibs[key] !== undefined;
                                      
                                      if (isEditing) {
                                        return (
                                          <div className="flex items-center gap-0.5">
                                            <input
                                              type="text"
                                              maxLength={8}
                                              value={editingBibs[key]}
                                              onChange={e => setEditingBibs(prev => ({ ...prev, [key]: e.target.value }))}
                                              className="w-12 text-[10px] font-mono font-bold text-center px-1 py-0.5 bg-white border border-natural-olive rounded"
                                            />
                                            <button
                                              onClick={() => {
                                                onUpdateParticipant(run.id, partic.id, { bibNumber: editingBibs[key] });
                                                setEditingBibs(prev => {
                                                  const copy = { ...prev };
                                                  delete copy[key];
                                                  return copy;
                                                });
                                              }}
                                              className="p-1 bg-natural-olive text-white rounded hover:bg-natural-olive-hover"
                                            >
                                              <Check className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div className="flex items-center gap-1 group">
                                          <span className={`text-[9px] font-mono font-black px-1.5 py-[1px] rounded leading-none shrink-0 ${
                                            partic.bibNumber
                                              ? 'bg-natural-olive/10 text-natural-olive border border-natural-olive/20'
                                              : 'bg-natural-bone text-natural-sage border border-dashed border-natural-border/60'
                                          }`}>
                                            🎽 #{partic.bibNumber || '---'}
                                          </span>
                                          <button
                                            onClick={() => setEditingBibs(prev => ({ ...prev, [key]: partic.bibNumber || '' }))}
                                            className="p-0.5 text-natural-sage hover:text-natural-olive transition duration-150 tooltip shrink-0"
                                            title="Éditer le dossard"
                                          >
                                            <Edit3 className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
