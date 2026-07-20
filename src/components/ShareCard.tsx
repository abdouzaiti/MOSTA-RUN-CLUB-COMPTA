import React from 'react';
import { MapContainer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface ShareCardProps {
  activity: any;
  onClose: () => void;
}

export default function ShareCard({ activity, onClose }: ShareCardProps) {
  const dist = (activity.distance / 1000).toFixed(2);
  const hrs = Math.floor(activity.moving_time / 3600);
  const mins = Math.floor((activity.moving_time % 3600) / 60);
  const secs = activity.moving_time % 60;
  const timeStr = `${mins > 0 ? mins + 'min ' : ''}${secs}s`;
      
  const pace_sec = activity.moving_time / (activity.distance / 1000);
  const p_min = Math.floor(pace_sec / 60);
  const p_sec = Math.round(pace_sec % 60).toString().padStart(2, '0');
  const paceStr = `${p_min}:${p_sec}`;

  const positions: [number, number][] = (activity.points || []).map((p: any) => [p.lat, p.lon]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="bg-black text-white p-6 rounded-3xl w-full max-w-sm flex flex-col items-center shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500">✕</button>
        
        <div className="text-center space-y-6 w-full">
          <div className="text-slate-400 font-semibold uppercase tracking-wider text-sm">Distance</div>
          <div className="text-5xl font-extrabold">{dist} km</div>
          
          <div className="text-slate-400 font-semibold uppercase tracking-wider text-sm">Allure</div>
          <div className="text-5xl font-extrabold">{paceStr} /km</div>
          
          <div className="text-slate-400 font-semibold uppercase tracking-wider text-sm">Temps</div>
          <div className="text-5xl font-extrabold">{timeStr}</div>
        </div>
        
        <div className="text-4xl font-extrabold text-[#0070f3] mt-8">MRC</div>
      </div>
    </div>
  );
}
