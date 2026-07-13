import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, RotateCcw, MapPin, Activity, Save, Loader2, CheckCircle } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase, isSupabaseConfigured, dbService } from '../supabaseClient';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Point {
  lat: number;
  lng: number;
  timestamp: number;
}

export default function RunRecorder({ language, currentUser }: { language: 'en' | 'fr' | 'ar', currentUser: any }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [distance, setDistance] = useState(0); // in meters
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // Haversine formula to calculate distance between two points in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  useEffect(() => {
    // Get initial location even if not recording
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn('Initial location error:', error.message);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      // Start Timer
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Start GPS Watch
      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const newPoint: Point = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: position.timestamp,
            };
            
            setCurrentLocation([newPoint.lat, newPoint.lng]);

            setPoints((prevPoints) => {
              if (prevPoints.length > 0) {
                const lastPoint = prevPoints[prevPoints.length - 1];
                const dist = calculateDistance(lastPoint.lat, lastPoint.lng, newPoint.lat, newPoint.lng);
                // Only add point if distance is greater than 2 meters to avoid drift noise
                if (dist > 2) {
                  setDistance((prev) => prev + dist);
                  return [...prevPoints, newPoint];
                }
                return prevPoints;
              } else {
                return [newPoint];
              }
            });
          },
          (error) => {
            setErrorMsg(language === 'ar' ? 'خطأ في GPS: ' + error.message : 'GPS Error: ' + error.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000,
          }
        );
      } else {
        setErrorMsg('Geolocation is not supported by this browser.');
      }
    } else {
      // Pause or Stop
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isRecording, isPaused, language]);

  const handleStart = () => {
    setIsRecording(true);
    setIsPaused(false);
    setErrorMsg('');
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleStop = () => {
    setIsRecording(false);
    setIsPaused(false);
  };
  
  const handleReset = () => {
    setIsRecording(false);
    setIsPaused(false);
    setPoints([]);
    setDistance(0);
    setElapsedTime(0);
    setErrorMsg('');
  };

  const handleSaveRun = async () => {
    if (!isSupabaseConfigured || !supabase || !currentUser) {
      setErrorMsg(language === 'ar' ? 'حدث خطأ: قاعدة البيانات غير متصلة' : 'Error: Database not connected');
      return;
    }
    setIsSaving(true);
    setErrorMsg('');
    
    // Recalculate pace for saving
    let savePace = '--:--';
    const saveDistKm = distance / 1000;
    if (saveDistKm > 0) {
      const paceSeconds = elapsedTime / saveDistKm;
      if (paceSeconds < 5999) {
        const pm = Math.floor(paceSeconds / 60);
        const ps = Math.floor(paceSeconds % 60);
        savePace = `${pm}:${ps.toString().padStart(2, '0')}`;
      }
    }

    try {
      const { error } = await supabase.from('mrc_runs').insert({
        id: crypto.randomUUID(),
        user_id: currentUser.id,
        user_name: currentUser.name,
        distance: distance,
        elapsed_time: elapsedTime,
        pace: savePace,
        points: points,
        date: new Date().toISOString()
      });
      
      if (error) throw error;
      
      // Create an announcement
      const newAnnouncement = {
        id: crypto.randomUUID(),
        authorName: currentUser.name,
        authorAvatarUrl: currentUser.avatarUrl,
        authorRole: currentUser.runClubRole || 'Membre',
        authorInitials: currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2),
        timeFr: 'À l\'instant',
        timeAr: 'الآن',
        content: `🏃 ${currentUser.name} a terminé une course de ${saveDistKm.toFixed(2)} km en ${formatTime(elapsedTime)} (Allure: ${savePace} /km).`,
        likes: 0,
        likedBy: [],
        comments: [],
        createdAt: new Date().toISOString()
      };
      await dbService.upsertAnnouncement(newAnnouncement);
      
      setSaveSuccess(true);
      setTimeout(() => {
        handleReset();
        setSaveSuccess(false);
      }, 3000);
      
    } catch (err: any) {
      setErrorMsg(language === 'ar' ? 'فشل الحفظ: ' + err.message : 'Save failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate Pace (minutes per km)
  let paceStr = '--:--';
  const distKm = distance / 1000;
  if (distKm > 0) { // Calculate pace as long as we have distance
    const paceSeconds = elapsedTime / distKm;
    if (paceSeconds < 5999) { // cap at 99 min/km
      const pm = Math.floor(paceSeconds / 60);
      const ps = Math.floor(paceSeconds % 60);
      paceStr = `${pm}:${ps.toString().padStart(2, '0')}`;
    }
  }

  const polylinePositions: [number, number][] = points.map(p => [p.lat, p.lng]);
  const centerPosition = currentLocation || (points.length > 0 ? [points[points.length-1].lat, points[points.length-1].lng] : [0, 0]);

  return (
    <div className="w-full h-full max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in flex flex-col relative z-0">
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
          <Activity className="w-6 h-6 text-orange-500" />
          {language === 'ar' ? 'تسجيل الجري' : language === 'en' ? 'Run Recorder' : 'Enregistreur de Course'}
        </h2>
        <p className="text-slate-500 text-sm font-medium">
          {language === 'ar' ? 'سجل مسارك باستخدام GPS (Strava Style)' : language === 'en' ? 'Record your route with GPS (Strava Style)' : 'Enregistrez votre itinéraire avec le GPS (Style Strava)'}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
          {errorMsg}
        </div>
      )}

      {/* Main Stats Card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sm:p-8 mb-6 flex flex-col items-center justify-center">
        <div className="text-[4rem] sm:text-[5rem] font-mono font-black tracking-tighter text-slate-800 leading-none mb-6 tabular-nums">
          {formatTime(elapsedTime)}
        </div>
        
        <div className="flex w-full justify-between items-center px-4 sm:px-12 divide-x divide-slate-100">
          <div className="flex-1 text-center">
            <div className="text-[2rem] sm:text-[2.5rem] font-bold text-slate-800 tracking-tight leading-none">
              {distKm.toFixed(2)}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">KM</div>
          </div>
          
          <div className="flex-1 text-center">
            <div className="text-[2rem] sm:text-[2.5rem] font-bold text-slate-800 tracking-tight leading-none">
              {paceStr}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">/KM</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-8">
        {!isRecording && elapsedTime === 0 && (
          <button 
            onClick={handleStart}
            className="w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform cursor-pointer"
          >
            <Play className="w-8 h-8 ml-1" />
          </button>
        )}

        {isRecording && !isPaused && (
          <button 
            onClick={handlePause}
            className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 hover:scale-105 transition-transform cursor-pointer"
          >
            <Pause className="w-8 h-8" />
          </button>
        )}

        {(isPaused || (elapsedTime > 0 && !isRecording)) && (
          <>
            <button 
              onClick={handleStart}
              className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
            >
              <Play className="w-6 h-6 ml-1" />
            </button>
            <button 
              onClick={handleStop}
              className="w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
            >
              <Square className="w-8 h-8" />
            </button>
          </>
        )}
        
        {elapsedTime > 0 && !isRecording && (
          <>
           <button 
             onClick={handleReset}
             className="w-16 h-16 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer"
           >
             <RotateCcw className="w-6 h-6" />
           </button>
           <button
             onClick={handleSaveRun}
             disabled={isSaving || saveSuccess}
             className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-transform cursor-pointer ${saveSuccess ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:scale-105 disabled:opacity-50'}`}
           >
             {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : saveSuccess ? <CheckCircle className="w-6 h-6" /> : <Save className="w-6 h-6" />}
           </button>
          </>
        )}
      </div>

      {/* Map Preview */}
      <div className="flex-1 bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden relative min-h-[300px] z-0">
        {centerPosition && centerPosition[0] !== 0 ? (
          <MapContainer
            center={centerPosition as [number, number]}
            zoom={16}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {polylinePositions.length > 1 && (
               <Polyline positions={polylinePositions} pathOptions={{ color: '#FC4C02', weight: 5 }} />
            )}
            {currentLocation && (
              <Marker position={currentLocation as [number, number]} />
            )}
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
             <MapPin className="w-8 h-8 animate-bounce" />
             <p className="text-sm font-semibold">{language === 'ar' ? 'جارٍ تحديد الموقع...' : 'Locating GPS...'}</p>
          </div>
        )}
      </div>

    </div>
  );
}
