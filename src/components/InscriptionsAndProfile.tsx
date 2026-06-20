import React, { useState } from 'react';
import { Runner, Run } from '../types';
import { User, Shield, Phone, Mail, Check, CreditCard, Sparkles, HeartPulse } from 'lucide-react';

interface InscriptionsAndProfileProps {
  currentUser: Runner;
  setCurrentUser: (user: Runner) => void;
  runs: Run[];
}

export default function InscriptionsAndProfile({ currentUser, setCurrentUser, runs }: InscriptionsAndProfileProps) {
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
      {/* Visual Athlete License Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-natural-olive via-natural-olive to-natural-olive-hover text-white p-5 rounded-2xl shadow-sm border border-natural-border">
        <div className="absolute top-0 right-0 w-32 h-32 bg-natural-accent/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-28 h-28 bg-natural-sage-light/20 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-natural-accent flex items-center justify-center text-[10px] text-white font-serif italic font-bold">M</div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-natural-sage-light font-mono font-bold leading-none">Athlete Licence</p>
              <p className="text-xs font-bold font-serif italic text-natural-accent">MOSTA RUN CLUB</p>
            </div>
          </div>
          {/* Algerian flag miniature */}
          <div className="flex w-6 h-4 rounded overflow-hidden border border-white/10">
            <div className="w-[45%] bg-emerald-650"></div>
            <div className="w-[10%] bg-white flex items-center justify-center relative">
              <span className="absolute text-[8px] text-red-650 leading-none">♥</span>
            </div>
            <div className="w-[45%] bg-red-650"></div>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <p className="text-natural-sage-light text-[10px] uppercase tracking-wider font-mono">Nom du coureur</p>
            <p className="font-extrabold text-lg text-white font-serif italic tracking-wide truncate max-w-[200px]">
              {currentUser.name}
            </p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
              <div>
                <p className="text-natural-sage-light text-[8px] uppercase font-mono">Groupe Sanguin</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-natural-accent">
                  <HeartPulse className="w-3.5 h-3.5 text-natural-accent" />
                  <span className="font-mono font-bold text-xs">{currentUser.bloodType || 'O+'}</span>
                </div>
              </div>
              <div>
                <p className="text-natural-sage-light text-[8px] uppercase font-mono">Rôle Club</p>
                <p className="text-xs font-bold text-natural-accent mt-0.5">{currentUser.runClubRole || 'Membre'}</p>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end justify-between self-stretch">
            <div className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-right">
              <span className="text-[9px] text-natural-sage-light block font-mono">ID ATHLETE</span>
              <span className="font-mono text-xs font-bold text-natural-accent">#MRC-2026-{currentUser.id.split('-')[1] || '99'}</span>
            </div>

            {/* Fake barcode for authentic ticket/licence style */}
            <div className="mt-4 opacity-50 bg-white p-1 rounded flex gap-[1px] items-center h-5 w-24">
              <div className="bg-black w-[1px] h-full" />
              <div className="bg-black w-[2px] h-full" />
              <div className="bg-black w-[1px] h-full" />
              <div className="bg-black w-[4px] h-full" />
              <div className="bg-black w-[1px] h-full" />
              <div className="bg-black w-[2px] h-full" />
              <div className="bg-black w-[3px] h-full" />
              <div className="bg-black w-[1px] h-full" />
              <div className="bg-black w-[2px] h-full" />
              <div className="bg-black w-[1px] h-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Under License */}
      <div className="grid grid-cols-3 gap-2 bg-natural-bone p-3 rounded-2xl border border-natural-border text-center">
        <div>
          <span className="text-natural-sage text-[9px] block uppercase font-mono font-bold">Inscrit à</span>
          <span className="text-md font-bold text-natural-olive">{registeredRuns.length} run{registeredRuns.length > 1 ? 's' : ''}</span>
        </div>
        <div className="border-x border-natural-divider">
          <span className="text-natural-sage text-[9px] block uppercase font-mono font-bold">Terminés</span>
          <span className="text-md font-bold text-natural-accent">{finishedRunsCount}</span>
        </div>
        <div>
          <span className="text-natural-sage text-[9px] block uppercase font-mono font-bold">Distance Prévu</span>
          <span className="text-md font-bold text-natural-olive">{totalDistancePlanned} km</span>
        </div>
      </div>

      {/* Edit Form Trigger or Form */}
      <div>
        {!isEditing ? (
          <button
            id="edit-profile-btn"
            onClick={() => setIsEditing(true)}
            className="w-full py-2.5 px-4 bg-white hover:bg-natural-bone text-natural-olive text-xs font-extrabold font-serif italic rounded-xl border border-natural-border transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-natural-accent" />
            Modifier mes informations de secours
          </button>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 border-t border-natural-divider pt-4">
            <h4 className="text-xs font-bold text-natural-olive uppercase tracking-wider font-serif italic">
              Modifier mes informations de sécurité
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-natural-sage mb-1 font-mono">Nom complet (Français)</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-natural-border rounded-xl bg-natural-bone/50 text-natural-text focus:bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold"
                placeholder="Ex. Abdou Zaiti"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-natural-sage mb-1 font-mono">Téléphone d'urgence</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-natural-border rounded-xl bg-natural-bone/50 text-natural-text focus:bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold"
                  placeholder="Ex. 0555123456"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-natural-sage mb-1 font-mono">Groupe Sanguin</label>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-natural-border rounded-xl bg-natural-bone/50 text-natural-text focus:bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold"
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

            <div>
              <label className="block text-[11px] font-bold text-natural-sage mb-1 font-mono">Adresse Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-natural-border rounded-xl bg-natural-bone/50 text-natural-text focus:bg-white focus:outline-none focus:ring-1 focus:ring-natural-olive font-semibold"
                placeholder="Ex. runner@example.com"
              />
            </div>

            <div className="flex gap-2 font-semibold text-xs pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-1/2 py-2 text-natural-sage bg-white hover:bg-natural-bone rounded-xl border border-natural-border transition font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 text-white bg-natural-olive hover:bg-natural-olive-hover rounded-xl transition flex items-center justify-center gap-1.5 font-bold cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Enregistrer
              </button>
            </div>
          </form>
        )}

        {savedMsg && (
          <div className="mt-3 p-2 bg-natural-sage-light text-natural-olive text-[11px] font-bold rounded-xl text-center border border-natural-border">
            Profil mis à jour ! Tous vos runs enregistrés reflètent vos changements.
          </div>
        )}
      </div>

      <div className="border-t border-natural-divider pt-4">
        <h4 className="text-xs font-bold text-natural-olive uppercase tracking-widest font-serif italic mb-2 flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-natural-accent" />
          Charte de Sécurité du Club
        </h4>
        <ul className="text-[10px] text-natural-sage font-medium space-y-1.5 list-disc pl-4 leading-relaxed">
          <li>Le port de t-shirt réfléchissant est obligatoire pour les runs du soir.</li>
          <li>Renseignez toujours votre téléphone d'urgence en cas de pépin.</li>
          <li>L'esprit de groupe prime : on part ensemble, on arrive ensemble !</li>
        </ul>
      </div>
    </div>
  );
}
