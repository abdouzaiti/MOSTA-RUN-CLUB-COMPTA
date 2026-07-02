import React, { useState, useEffect, useRef } from 'react';
import { Runner } from '../types';
import { Language, translations } from '../translations';
import { 
  MessageSquare, Search, Send, Pin, Phone, Video, Info, 
  Smile, Image as ImageIcon, Paperclip, Mic, CheckCheck, Play, Pause,
  Reply, ChevronRight, ChevronLeft, X, Heart, ThumbsUp, Flame, Star, Volume2, Film, Check,
  VideoOff, MicOff, PhoneOff, Camera, VolumeX, Users,
  Database, Wifi, WifiOff, Copy, Zap, Sparkles, Trash2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AgoraManager, isAgoraConfigured } from '../lib/agora';
import MountainVistaBackground from './MountainVistaBackground';


interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  avatarUrl?: string | null;
  text: string;
  time: string;
  type?: 'text' | 'voice' | 'image' | 'video' | 'file';
  duration?: string; // for voice
  mediaUrl?: string; // for image/video
  fileSize?: string; // for file
  reactions?: { [emoji: string]: number };
  replyTo?: { id: string; sender: string; text: string } | null;
  read?: boolean;
}

interface ChatChannel {
  id: string;
  name: string;
  isGroup: boolean;
  avatarUrl?: string;
  pinned: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  membersCount?: number;
}

interface MessageriePremiumProps {
  currentUser: Runner;
  runners: Runner[];
  language: Language;
}

export default function MessageriePremium({ currentUser, runners, language }: MessageriePremiumProps) {
  const isRtl = language === 'ar';
  const t = (key: string) => (translations[language] as any)[key] || (translations['fr'] as any)[key] || key;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Search keyword state
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearch, setChatSearch] = useState('');

  // Active channel
  const [activeChannelId, setActiveChannelId] = useState('chan-group-1');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Input States
  const [inputText, setInputText] = useState('');
  const [typingChannel, setTypingChannel] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Agora Manager Ref
  const agoraManagerRef = useRef<AgoraManager | null>(null);

  // Playback of voice states
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const activeSynthRef = useRef<{ stop: () => void } | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Voice Note Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Mobile/Touch Gestures & Options Modal States
  const [selectedMobileMsg, setSelectedMobileMsg] = useState<Message | null>(null);
  const touchTimerRefMap = useRef<{ [msgId: string]: any }>({});
  const lastTapTimeRef = useRef<{ [msgId: string]: number }>({});
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  // Active Call States
  interface ActiveCall {
    type: 'voice' | 'video';
    status: 'ringing' | 'connected' | 'ended';
    partnerName: string;
    partnerAvatar: string | null;
    isGroup: boolean;
  }

  interface CallParticipant {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
    isMuted: boolean;
    isSpeaking: boolean;
    isLocal: boolean;
  }

  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callParticipants, setCallParticipants] = useState<CallParticipant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0); // Live voice waveform simulation or analytical level
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const callTimerRef = useRef<any>(null);
  const ringtoneOscRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Hidden file inputs refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic list of group members combining currentUser and all other runners from the database
  const groupMembers = [
    currentUser,
    ...(runners || []).filter(r => r.id !== currentUser.id)
  ];

  // Load channels and messages from localStorage to ensure realistic, fully durable storage
  const [channels, setChannels] = useState<ChatChannel[]>(() => {
    const saved = localStorage.getItem('mrc_real_chat_channels');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing channels from localStorage:", e);
      }
    }
    const defaultChannels = [
      {
        id: 'chan-group-1',
        name: 'community',
        isGroup: true,
        pinned: true,
        unreadCount: 0,
        lastMessage: 'Pas encore de messages',
        lastMessageTime: '--:--',
        membersCount: groupMembers.length
      }
    ];
    localStorage.setItem('mrc_real_chat_channels', JSON.stringify(defaultChannels));
    return defaultChannels;
  });

  const [channelMessages, setChannelMessages] = useState<{ [chanId: string]: Message[] }>(() => {
    const saved = localStorage.getItem('mrc_real_chat_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing messages from localStorage:", e);
      }
    }
    const defaultMessages = {
      'chan-group-1': []
    };
    localStorage.setItem('mrc_real_chat_messages', JSON.stringify(defaultMessages));
    return defaultMessages;
  });

  // Keep localStorage updated and enforce single group setup on start
  useEffect(() => {
    const defaultChannels = [
      {
        id: 'chan-group-1',
        name: 'community',
        isGroup: true,
        pinned: true,
        unreadCount: 0,
        lastMessage: channels[0]?.lastMessage || 'Pas encore de messages',
        lastMessageTime: channels[0]?.lastMessageTime || '--:--',
        membersCount: groupMembers.length
      }
    ];
    localStorage.setItem('mrc_real_chat_channels', JSON.stringify(defaultChannels));
    if (channels.length !== 1 || channels[0]?.id !== 'chan-group-1' || channels[0]?.membersCount !== groupMembers.length || channels[0]?.name !== 'community') {
      setChannels(defaultChannels);
    }
  }, [groupMembers.length]);

  useEffect(() => {
    localStorage.setItem('mrc_real_chat_messages', JSON.stringify(channelMessages));
  }, [channelMessages]);

  // Sync a single message to Supabase if configured
  const syncMessageToSupabase = (msg: Message) => {
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('mrc_messages')
        .insert([{
          id: msg.id,
          sender_id: msg.senderId,
          sender_name: msg.senderName,
          sender_role: msg.senderRole || 'Membre',
          avatar_url: msg.avatarUrl || null,
          text: msg.text,
          time: msg.time,
          type: msg.type || 'text',
          media_url: msg.mediaUrl || null,
          file_size: msg.fileSize || null,
          duration: msg.duration || null,
          reply_to: msg.replyTo || null,
          reactions: msg.reactions || {},
          read: msg.read || false
        }])
        .then(({ error }) => {
          if (error) console.error("Error inserting to Supabase:", error);
        });
    }
  };

  // Supabase Realtime synchronization effect
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch existing messages from Supabase
      supabase
        .from('mrc_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .then(({ data, error }) => {
          if (error) {
            console.error("Error loading messages from Supabase:", error);
          } else if (data) {
            const formatted: Message[] = data.map(item => ({
              id: item.id,
              senderId: item.sender_id,
              senderName: item.sender_name,
              senderRole: item.sender_role,
              avatarUrl: item.avatar_url,
              text: item.text || '',
              time: item.time,
              type: item.type as any,
              mediaUrl: item.media_url,
              fileSize: item.file_size,
              duration: item.duration,
              replyTo: item.reply_to,
              reactions: item.reactions || {},
              read: item.read
            }));
            
            setChannelMessages(prev => ({
              ...prev,
              'chan-group-1': formatted
            }));

            // Update channel last message
            if (formatted.length > 0) {
              const last = formatted[formatted.length - 1];
              setChannels(prev => prev.map(c => {
                if (c.id === 'chan-group-1') {
                  return {
                    ...c,
                    lastMessage: `${last.senderName.split(' ')[0]}: ${last.text || (last.type === 'image' ? '📷 Photo' : '🎙️ Vocal')}`,
                    lastMessageTime: last.time
                  };
                }
                return c;
              }));
            }
          }
        });

      // 2. Subscribe to real-time additions/reactions in Supabase
      const channel = supabase
        .channel('mrc_messages_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'mrc_messages' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newRow = payload.new;
              const newMsg: Message = {
                id: newRow.id,
                senderId: newRow.sender_id,
                senderName: newRow.sender_name,
                senderRole: newRow.sender_role,
                avatarUrl: newRow.avatar_url,
                text: newRow.text || '',
                time: newRow.time,
                type: newRow.type as any,
                mediaUrl: newRow.media_url,
                fileSize: newRow.file_size,
                duration: newRow.duration,
                replyTo: newRow.reply_to,
                reactions: newRow.reactions || {},
                read: newRow.read
              };

              setChannelMessages(prev => {
                const current = prev['chan-group-1'] || [];
                if (current.some(m => m.id === newMsg.id)) return prev;
                return {
                  ...prev,
                  'chan-group-1': [...current, newMsg]
                };
              });

              setChannels(prev => prev.map(c => {
                if (c.id === 'chan-group-1') {
                  return {
                    ...c,
                    lastMessage: `${newRow.sender_name.split(' ')[0]}: ${newRow.text || (newRow.type === 'image' ? '📷 Photo' : '🎙️ Vocal')}`,
                    lastMessageTime: newRow.time
                  };
                }
                return c;
              }));
            } else if (payload.eventType === 'UPDATE') {
              const updatedRow = payload.new;
              setChannelMessages(prev => {
                const current = prev['chan-group-1'] || [];
                return {
                  ...prev,
                  'chan-group-1': current.map(m => {
                    if (m.id === updatedRow.id) {
                      return {
                        ...m,
                        reactions: updatedRow.reactions || {},
                        read: updatedRow.read
                      };
                    }
                    return m;
                  })
                };
              });
            } else if (payload.eventType === 'DELETE') {
              const oldRow = payload.old;
              setChannelMessages(prev => {
                const current = prev['chan-group-1'] || [];
                return {
                  ...prev,
                  'chan-group-1': current.filter(m => m.id !== oldRow.id)
                };
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isSupabaseConfigured]);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const messages = channelMessages[activeChannelId] || [];

  // Recording seconds ticking effect
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Cleanup synthesizer and audio on unmount
  useEffect(() => {
    return () => {
      if (activeSynthRef.current) {
        activeSynthRef.current.stop();
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    };
  }, []);

  // Format seconds into digital clock string
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Web Audio synth for playing vocal note with beautiful synthetic running beeps
  const playVoiceSynth = (durationSeconds: number, onStop: () => void) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        onStop();
        return null;
      }
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'triangle'; // smoother sound than square, warmer than sine
      const startTime = ctx.currentTime;
      
      // Fun pitch patterns for speech representation
      const pitchChanges = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
      const step = 0.4; // pitch change every 400ms
      const totalSteps = Math.ceil(durationSeconds / step);
      
      for (let i = 0; i < totalSteps; i++) {
        const time = startTime + i * step;
        const pitch = pitchChanges[Math.floor(Math.random() * pitchChanges.length)];
        // Let's glide into each frequency for a fun synthesized speaking flow
        osc.frequency.setTargetAtTime(pitch, time, 0.05);
        
        // Pulse gain
        gainNode.gain.setValueAtTime(0.08, time);
        gainNode.gain.setTargetAtTime(0, time + step - 0.05, 0.03);
      }
      
      osc.start();
      
      const timeout = setTimeout(() => {
        try {
          osc.stop();
          ctx.close();
        } catch (err) {}
        onStop();
      }, durationSeconds * 1000);
      
      return {
        stop: () => {
          clearTimeout(timeout);
          try {
            osc.stop();
            ctx.close();
          } catch (err) {}
        }
      };
    } catch (e) {
      onStop();
      return null;
    }
  };

  // Play/Pause vocal message handler
  const handleToggleVoicePlay = (msg: Message) => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (activeSynthRef.current) {
      activeSynthRef.current.stop();
      activeSynthRef.current = null;
    }

    if (playingVoiceId === msg.id) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msg.id);
      
      if (msg.mediaUrl) {
        // Play real recorded voice message
        const audio = new Audio(msg.mediaUrl);
        activeAudioRef.current = audio;
        audio.play().catch(err => {
          console.error("Failed to play real audio:", err);
          // Fallback to synthetic synth play if audio loading failed
          playVoiceSynthFallback(msg);
        });
        
        audio.onended = () => {
          setPlayingVoiceId(null);
          activeAudioRef.current = null;
        };
      } else {
        playVoiceSynthFallback(msg);
      }
    }
  };

  const playVoiceSynthFallback = (msg: Message) => {
    const parts = (msg.duration || '0:10').split(':');
    let seconds = 10;
    if (parts.length === 2) {
      seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else {
      seconds = parseInt(parts[0], 10) || 10;
    }
    
    const synth = playVoiceSynth(seconds, () => {
      setPlayingVoiceId(null);
      activeSynthRef.current = null;
    });
    if (synth) {
      activeSynthRef.current = synth;
    }
  };

  // Start real microphone recording with MediaRecorder
  const handleStartRecording = () => {
    audioChunksRef.current = [];
    
    // Play sweet startup beep indicator
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch(e) {}

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };
          
          recorder.start();
          setIsRecording(true);
          setRecordingSeconds(0);
        })
        .catch(err => {
          console.warn("Microphone access blocked/not available, falling back to simulated recording:", err);
          setIsRecording(true);
          setRecordingSeconds(0);
        });
    } else {
      // Fallback
      setIsRecording(true);
      setRecordingSeconds(0);
    }
  };

  // Cancel ongoing recording
  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null; // discard callbacks
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    setIsRecording(false);
  };

  // Send the voice recording (real or simulated)
  const handleSendVoiceRecord = () => {
    const durationSeconds = recordingSeconds;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Setup the final stop callback
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks in stream to release microphone icon/hardware
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const durationStr = formatSeconds(durationSeconds);
        
        // Convert Blob to Base64 data URL to store durably in Supabase
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64AudioUrl = reader.result as string;
          
          const voiceMsg: Message = {
            id: 'm-voice-' + Date.now(),
            senderId: currentUser.id || 'usr-1',
            senderName: currentUser.name,
            senderRole: currentUser.runClubRole || 'Membre',
            avatarUrl: currentUser.avatarUrl || null,
            text: '🎙️ Message Vocal',
            time: timestamp,
            type: 'voice',
            duration: durationStr,
            mediaUrl: base64AudioUrl, // Pass real Base64 audio URL
            read: false
          };
          
          setChannelMessages(prev => ({
            ...prev,
            [activeChannelId]: [...(prev[activeChannelId] || []), voiceMsg]
          }));
          
          syncMessageToSupabase(voiceMsg);
          
          setChannels(prev => prev.map(c => {
            if (c.id === activeChannelId) {
              return {
                ...c,
                lastMessage: `${currentUser.name.split(' ')[0]}: 🎙️ Message Vocal (${durationStr})`,
                lastMessageTime: timestamp
              };
            }
            return c;
          }));
          
          setIsRecording(false);
        };
        reader.readAsDataURL(audioBlob);
      };
      
      mediaRecorderRef.current.stop();
    } else {
      // Simulated voice fallback
      if (durationSeconds < 1) {
        setIsRecording(false);
        return;
      }
      
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const durationStr = formatSeconds(durationSeconds);
      
      const voiceMsg: Message = {
        id: 'm-voice-' + Date.now(),
        senderId: currentUser.id || 'usr-1',
        senderName: currentUser.name,
        senderRole: currentUser.runClubRole || 'Membre',
        avatarUrl: currentUser.avatarUrl || null,
        text: '🎙️ Message Vocal (Simulé)',
        time: timestamp,
        type: 'voice',
        duration: durationStr,
        read: false
      };
      
      setChannelMessages(prev => ({
        ...prev,
        [activeChannelId]: [...(prev[activeChannelId] || []), voiceMsg]
      }));
      
      syncMessageToSupabase(voiceMsg);
      
      setChannels(prev => prev.map(c => {
        if (c.id === activeChannelId) {
          return {
            ...c,
            lastMessage: `${currentUser.name.split(' ')[0]}: 🎙️ Message Vocal (${durationStr})`,
            lastMessageTime: timestamp
          };
        }
        return c;
      }));
      
      setIsRecording(false);
    }
  };

  // Touch Gestures for mobile (Double Tap -> Heart, Long Press -> Action Options)
  const handleMessageTouchStart = (e: React.TouchEvent, msg: Message) => {
    const msgId = msg.id;
    // Store touch coordinates
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;

    // Long press detection: 500ms
    if (touchTimerRefMap.current[msgId]) {
      clearTimeout(touchTimerRefMap.current[msgId]);
    }
    touchTimerRefMap.current[msgId] = setTimeout(() => {
      setSelectedMobileMsg(msg);
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 500);
  };

  const handleMessageTouchMove = (e: React.TouchEvent, msgId: string) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartXRef.current);
    const dy = Math.abs(touch.clientY - touchStartYRef.current);
    // If finger moves more than 10px, treat as scroll, cancel long press
    if (dx > 10 || dy > 10) {
      if (touchTimerRefMap.current[msgId]) {
        clearTimeout(touchTimerRefMap.current[msgId]);
        delete touchTimerRefMap.current[msgId];
      }
    }
  };

  const handleMessageTouchEnd = (e: React.TouchEvent, msg: Message) => {
    const msgId = msg.id;
    if (touchTimerRefMap.current[msgId]) {
      clearTimeout(touchTimerRefMap.current[msgId]);
      delete touchTimerRefMap.current[msgId];
    }

    // Double tap detection
    const now = Date.now();
    const lastTap = lastTapTimeRef.current[msgId] || 0;
    const delay = 300;
    if (now - lastTap < delay) {
      handleAddReaction(msgId, '❤️');
      if (navigator.vibrate) {
        navigator.vibrate([45, 45]);
      }
      delete lastTapTimeRef.current[msgId];
    } else {
      lastTapTimeRef.current[msgId] = now;
    }
  };

  // Real Photo Upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const newMsg: Message = {
        id: 'm-photo-' + Date.now(),
        senderId: currentUser.id || 'usr-1',
        senderName: currentUser.name,
        senderRole: currentUser.runClubRole || 'Membre',
        avatarUrl: currentUser.avatarUrl || null,
        text: file.name,
        time: timestamp,
        type: 'image',
        mediaUrl: dataUrl,
        read: false
      };

      setChannelMessages(prev => ({
        ...prev,
        [activeChannelId]: [...(prev[activeChannelId] || []), newMsg]
      }));

      // Sync to Supabase
      syncMessageToSupabase(newMsg);

      setChannels(prev => prev.map(c => {
        if (c.id === activeChannelId) {
          return {
            ...c,
            lastMessage: `${currentUser.name.split(' ')[0]}: 📷 Photo`,
            lastMessageTime: timestamp
          };
        }
        return c;
      }));

    };
    reader.readAsDataURL(file);
    // Reset input value to allow selecting same photo again
    e.target.value = '';
  };

  // Real File/Document Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    
    const newMsg: Message = {
      id: 'm-file-' + Date.now(),
      senderId: currentUser.id || 'usr-1',
      senderName: currentUser.name,
      senderRole: currentUser.runClubRole || 'Membre',
      avatarUrl: currentUser.avatarUrl || null,
      text: file.name,
      time: timestamp,
      type: 'file',
      fileSize: `${sizeInMb} MB`,
      read: false
    };

    setChannelMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMsg]
    }));

    // Sync to Supabase
    syncMessageToSupabase(newMsg);

    setChannels(prev => prev.map(c => {
      if (c.id === activeChannelId) {
        return {
          ...c,
          lastMessage: `${currentUser.name.split(' ')[0]}: 📁 Document`,
          lastMessageTime: timestamp
        };
      }
      return c;
    }));

    // Reset input value
    e.target.value = '';
  };

  // Calling & Ringtone Sound Synthesizers
  const startRingtone = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      let ringInterval = setInterval(() => {
        try {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          
          // Dual frequency phone ringback tones: 440Hz + 480Hz
          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc2.frequency.setValueAtTime(480, ctx.currentTime);
          
          gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
          
          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc1.start();
          osc2.start();
          
          osc1.stop(ctx.currentTime + 1.2);
          osc2.stop(ctx.currentTime + 1.2);
        } catch (e) {}
      }, 2000);

      ringtoneOscRef.current = {
        stop: () => {
          clearInterval(ringInterval);
          try {
            ctx.close();
          } catch(e) {}
        }
      };
    } catch (e) {}
  };

  const stopRingtone = () => {
    if (ringtoneOscRef.current) {
      ringtoneOscRef.current.stop();
      ringtoneOscRef.current = null;
    }
  };

  // Handle start of call (Voice or Video)
  const handleStartCall = async (type: 'voice' | 'video') => {
    if (activeCall) return;

    const partnerName = activeChannel.name;
    const partnerAvatar = activeChannel.avatarUrl || null;
    const isGroup = activeChannel.isGroup;

    setActiveCall({
      type,
      status: 'ringing',
      partnerName,
      partnerAvatar,
      isGroup
    });
    setCallDuration(0);
    setMicMuted(false);
    setCameraOff(false);

    // Initialize call participants list dynamically
    if (isGroup) {
      setCallParticipants([
        {
          id: 'usr-1',
          name: currentUser.name,
          role: currentUser.runClubRole || 'Admin',
          avatarUrl: currentUser.avatarUrl || null,
          isMuted: false,
          isSpeaking: false,
          isLocal: true
        },
        {
          id: 'usr-coach',
          name: 'Coach Redouane 🏆',
          role: 'Coach',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          isMuted: false,
          isSpeaking: true,
          isLocal: false
        },
        {
          id: 'usr-yacine',
          name: 'Yacine Runner ⚡',
          role: 'Membre',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          isMuted: false,
          isSpeaking: false,
          isLocal: false
        },
        {
          id: 'usr-sofiane',
          name: 'Sofiane K.',
          role: 'Membre',
          avatarUrl: null,
          isMuted: false,
          isSpeaking: true,
          isLocal: false
        },
        {
          id: 'usr-amine',
          name: 'Amine R.',
          role: 'Membre',
          avatarUrl: null,
          isMuted: true,
          isSpeaking: false,
          isLocal: false
        }
      ]);
    } else {
      setCallParticipants([
        {
          id: 'usr-1',
          name: currentUser.name,
          role: currentUser.runClubRole || 'Admin',
          avatarUrl: currentUser.avatarUrl || null,
          isMuted: false,
          isSpeaking: false,
          isLocal: true
        },
        {
          id: 'partner',
          name: partnerName,
          role: 'Membre',
          avatarUrl: partnerAvatar,
          isMuted: false,
          isSpeaking: true,
          isLocal: false
        }
      ]);
    }

    // Play ringing tone
    startRingtone();

    // Setup Agora call if configured
    if (isAgoraConfigured) {
      const manager = new AgoraManager();
      agoraManagerRef.current = manager;
      manager.joinCall({
        channelName: `mrc-call-${activeChannelId}`,
        type,
        onUserPublished: (user, mediaType) => {
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          } else if (mediaType === 'video') {
            setTimeout(() => {
              const container = document.getElementById(`agora-remote-${user.uid}`);
              if (container) {
                user.videoTrack?.play(container);
              }
            }, 500);
          }
          // Dynamically append remote user
          setCallParticipants(prev => {
            if (prev.some(p => p.id === String(user.uid))) return prev;
            return [
              ...prev,
              {
                id: String(user.uid),
                name: `Runner #${user.uid}`,
                role: 'Membre Live',
                avatarUrl: null,
                isMuted: false,
                isSpeaking: false,
                isLocal: false
              }
            ];
          });
        },
        onUserUnpublished: (user) => {
          setCallParticipants(prev => prev.filter(p => p.id !== String(user.uid)));
        }
      }).then(agoraRes => {
        if (agoraRes && type === 'video' && agoraRes.localVideoTrack) {
          setTimeout(() => {
            if (localVideoRef.current) {
              agoraRes.localVideoTrack?.play(localVideoRef.current);
            }
          }, 500);
        }
      }).catch(err => {
        console.error("Agora joinCall failed:", err);
      });
    }

    let stream: MediaStream | null = null;
    try {
      // Attempt real hardware stream access for visual waveform rendering
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { facingMode: 'user' } : false
      });
      setLocalStream(stream);

      // Initialize real Web Audio analyzer for actual vocal frequencies
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setAudioLevel(average / 255); // scale 0 to 1
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }
    } catch (err) {
      console.warn("Media devices not accessible, using simulation mode:", err);
    }

    // Auto connect after 3.5 seconds
    setTimeout(() => {
      setActiveCall(prev => {
        if (!prev || prev.status !== 'ringing') return prev;
        stopRingtone();

        // Start call duration counter ticking
        let sec = 0;
        callTimerRef.current = setInterval(() => {
          sec++;
          setCallDuration(sec);
        }, 1000);

        return {
          ...prev,
          status: 'connected'
        };
      });
    }, 3500);
  };

  const handleToggleParticipantMute = (participantId: string) => {
    setCallParticipants(prev => prev.map(p => {
      if (p.id === participantId && !p.isLocal) {
        return { ...p, isMuted: !p.isMuted, isSpeaking: p.isMuted ? p.isSpeaking : false };
      }
      return p;
    }));
  };

  const handleEndCall = () => {
    stopRingtone();
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    if (localStream) {
      localStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      setLocalStream(null);
    }

    // Disconnect Agora client
    if (agoraManagerRef.current) {
      agoraManagerRef.current.leaveCall();
      agoraManagerRef.current = null;
    }

    setActiveCall(prev => {
      if (prev) {
        return {
          ...prev,
          status: 'ended'
        };
      }
      return null;
    });

    setTimeout(() => {
      setActiveCall(null);
    }, 1500);
  };

  const handleToggleMute = () => {
    const nextState = !micMuted;
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !nextState;
      });
    }
    if (agoraManagerRef.current) {
      agoraManagerRef.current.setMuteMicrophone(nextState);
    }
    setMicMuted(nextState);
  };

  const handleToggleCamera = () => {
    const nextState = !cameraOff;
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !nextState;
      });
    }
    if (agoraManagerRef.current) {
      agoraManagerRef.current.setCameraEnabled(!nextState);
    }
    setCameraOff(nextState);
  };

  // Bind video element when connected
  useEffect(() => {
    if (activeCall?.status === 'connected' && activeCall.type === 'video' && localStream && localVideoRef.current) {
      try {
        localVideoRef.current.srcObject = localStream;
      } catch (e) {}
    }
  }, [activeCall?.status, localStream]);

  // Fluctuate participant voice activity and speaking indicator states during a call
  useEffect(() => {
    let speakInterval: any;
    if (activeCall?.status === 'connected') {
      speakInterval = setInterval(() => {
        setCallParticipants(prev => prev.map(p => {
          if (p.isLocal) {
            // Local user is speaking if microphone is not muted and vocal audio level is detected
            return { 
              ...p, 
              isMuted: micMuted,
              isSpeaking: !micMuted && (audioLevel > 0.05 || Math.random() > 0.7) 
            };
          }
          // Randomly fluctuate speaking state of other unmuted participants to represent group talk
          if (!p.isMuted) {
            return {
              ...p,
              isSpeaking: Math.random() > 0.4
            };
          }
          return { ...p, isSpeaking: false };
        }));
      }, 1200);
    }
    return () => {
      if (speakInterval) clearInterval(speakInterval);
    };
  }, [activeCall?.status, micMuted, audioLevel]);

  // Clean up all call streams/timers on unmount
  useEffect(() => {
    return () => {
      stopRingtone();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingChannel]);

  // Handle Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: Message = {
      id: 'm-new-' + Date.now(),
      senderId: currentUser.id || 'usr-1',
      senderName: currentUser.name,
      senderRole: currentUser.runClubRole || 'Membre',
      avatarUrl: currentUser.avatarUrl || null,
      text: inputText,
      time: timestamp,
      type: 'text',
      replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.senderName, text: replyingTo.text } : null,
      read: false
    };

    const updatedMsgs = [...messages, newMsg];
    setChannelMessages({
      ...channelMessages,
      [activeChannelId]: updatedMsgs
    });

    // Sync to Supabase
    syncMessageToSupabase(newMsg);

    // Update channel's last message
    setChannels(channels.map(c => {
      if (c.id === activeChannelId) {
        return {
          ...c,
          lastMessage: `${currentUser.name.split(' ')[0]}: ${inputText}`,
          lastMessageTime: timestamp
        };
      }
      return c;
    }));

    setInputText('');
    setReplyingTo(null);
  };

  // Delete / Retract a message
  const handleDeleteMessage = (msgId: string) => {
    // 1. Update local messages state
    setChannelMessages(prev => {
      const current = prev[activeChannelId] || [];
      const updated = current.filter(m => m.id !== msgId);
      return {
        ...prev,
        [activeChannelId]: updated
      };
    });

    // 2. Delete from Supabase if active
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('mrc_messages')
        .delete()
        .eq('id', msgId)
        .then(({ error }) => {
          if (error) console.error("Error deleting message from Supabase:", error);
        });
    }

    // 3. Update channel's last message
    setChannels(prev => prev.map(c => {
      if (c.id === activeChannelId) {
        const remaining = (channelMessages[activeChannelId] || []).filter(m => m.id !== msgId);
        if (remaining.length > 0) {
          const last = remaining[remaining.length - 1];
          return {
            ...c,
            lastMessage: `${last.senderName.split(' ')[0]}: ${last.text || (last.type === 'image' ? '📷 Photo' : '🎙️ Vocal')}`,
            lastMessageTime: last.time
          };
        } else {
          return {
            ...c,
            lastMessage: isRtl ? 'لا توجد رسائل' : 'Aucun message',
            lastMessageTime: ''
          };
        }
      }
      return c;
    }));
  };



  // React to a message
  const handleAddReaction = (msgId: string, emoji: string) => {
    setChannelMessages(prev => {
      const chanMsgs = prev[activeChannelId] || [];
      const updated = chanMsgs.map(m => {
        if (m.id === msgId) {
          const currentReactions = m.reactions || {};
          const val = currentReactions[emoji] || 0;
          const newReactions = {
            ...currentReactions,
            [emoji]: val + 1
          };

          // Update real Supabase if configured
          if (isSupabaseConfigured && supabase) {
            supabase
              .from('mrc_messages')
              .update({ reactions: newReactions })
              .eq('id', msgId)
              .then(({ error }) => {
                if (error) console.error("Error updating reactions in Supabase:", error);
              });
          }

          return {
            ...m,
            reactions: newReactions
          };
        }
        return m;
      });
      return {
        ...prev,
        [activeChannelId]: updated
      };
    });
  };

  // Simulate file / image / audio attachments
  const triggerAttachment = (type: 'voice' | 'image' | 'file') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let mockMsg: Message;

    if (type === 'voice') {
      mockMsg = {
        id: 'm-att-' + Date.now(),
        senderId: currentUser.id || 'usr-1',
        senderName: currentUser.name,
        senderRole: currentUser.runClubRole || 'Membre',
        avatarUrl: currentUser.avatarUrl || null,
        text: 'Message Vocal enregistré',
        time: timestamp,
        type: 'voice',
        duration: '0:42',
        read: false
      };
    } else if (type === 'image') {
      mockMsg = {
        id: 'm-att-' + Date.now(),
        senderId: currentUser.id || 'usr-1',
        senderName: currentUser.name,
        senderRole: currentUser.runClubRole || 'Membre',
        avatarUrl: currentUser.avatarUrl || null,
        text: 'Superbe coucher de soleil pendant le run du week-end',
        time: timestamp,
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
        read: false
      };
    } else {
      mockMsg = {
        id: 'm-att-' + Date.now(),
        senderId: currentUser.id || 'usr-1',
        senderName: currentUser.name,
        senderRole: currentUser.runClubRole || 'Membre',
        avatarUrl: currentUser.avatarUrl || null,
        text: 'Programme_Detaillé_Mosta_Trail.pdf',
        time: timestamp,
        type: 'file',
        fileSize: '2.4 MB',
        read: false
      };
    }

    setChannelMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), mockMsg]
    }));
  };

  // Filter channels based on search
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(chatSearch.toLowerCase()) || 
    c.lastMessage.toLowerCase().includes(chatSearch.toLowerCase())
  );

  return (
    <div className="bg-white rounded-none sm:rounded-[2.5rem] border-0 sm:border sm:border-slate-100 shadow-3xs overflow-hidden flex-1 h-full min-h-0 md:min-h-[500px] flex flex-col md:flex-row animate-fade-in relative">
      
      {/* Channels Sidebar List */}
      <div className={`w-full md:w-80 border-r border-slate-50 flex flex-col h-full bg-[#FAFBFD]/60 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        {/* Search header inside messaging */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative group">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition`} />
            <input
              type="text"
              placeholder={isRtl ? 'البحث عن محادثة...' : 'Rechercher un chat...'}
              value={chatSearch}
              onChange={e => setChatSearch(e.target.value)}
              className={`w-full text-xs font-semibold py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition ${
                isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
              }`}
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChannels.map(channel => {
            const isActive = channel.id === activeChannelId;
            return (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannelId(channel.id);
                  setMobileView('chat');
                  // Clear unread
                  setChannels(channels.map(c => c.id === channel.id ? { ...c, unreadCount: 0 } : c));
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition text-left cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50 border border-blue-100/50 shadow-3xs' 
                    : 'hover:bg-slate-50/50 border border-transparent'
                } ${isRtl ? 'flex-row-reverse text-right' : ''}`}
              >
                {/* Avatar Icon */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-black border shadow-3xs overflow-hidden ${
                    isActive ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {channel.isGroup ? (
                      <img 
                        src="/logo.png" 
                        alt={channel.name} 
                        className={`w-full h-full object-contain p-2 ${isActive ? 'brightness-0 invert' : ''}`} 
                        referrerPolicy="no-referrer" 
                      />
                    ) : channel.avatarUrl ? (
                      <img src={channel.avatarUrl} alt={channel.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      channel.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    )}
                  </div>
                  {/* Status indicator on avatar for private channels */}
                  {!channel.isGroup && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-emerald-500" />
                  )}
                </div>

                {/* Info and Last Msg previews */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif italic font-extrabold text-[13px] text-slate-800 truncate flex items-center gap-1.5">
                      {channel.pinned && <Pin className="w-3 h-3 text-blue-500 shrink-0 transform -rotate-45" />}
                      <span className="truncate">{channel.name}</span>
                    </h4>
                    <span className="text-[10px] font-bold font-mono text-slate-400">
                      {channel.lastMessageTime}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[11px] font-semibold text-slate-400 truncate pr-2">
                      {channel.lastMessage}
                    </p>
                    {channel.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-[9px] font-mono font-black h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center animate-pulse">
                        {channel.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Conversation Area */}
      <div className={`flex-1 flex flex-col h-full bg-white relative overflow-hidden ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {/* Parallax Background */}
        <MountainVistaBackground />
        
        {/* Active chat header toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shadow-3xs bg-white/90 backdrop-blur-md relative z-10">
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {mobileView === 'chat' && (
              <button 
                onClick={() => setMobileView('list')}
                className="md:hidden p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer text-slate-600"
              >
                {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs overflow-hidden">
              {activeChannel.isGroup ? (
                <img src="/logo.png" alt={activeChannel.name} className="w-full h-full object-contain p-2 brightness-0 invert" referrerPolicy="no-referrer" />
              ) : (
                activeChannel.avatarUrl ? (
                  <img src={activeChannel.avatarUrl} alt={activeChannel.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  activeChannel.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                )
              )}
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h3 className="font-serif italic font-black text-sm sm:text-base text-slate-800 flex items-center gap-1">
                {activeChannel.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                {activeChannel.isGroup ? `${activeChannel.membersCount} athlètes actifs` : 'En ligne'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Supabase & Agora Connection status and config wizard trigger */}
            <button
              onClick={() => setShowSetupModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-[10px] font-mono font-bold transition cursor-pointer text-slate-600"
              title="Connecteurs Supabase Realtime & Agora"
            >
              <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="opacity-80">Supabase:</span>
              <span className={isSupabaseConfigured ? 'text-emerald-600 font-extrabold' : 'text-amber-600'}>
                {isSupabaseConfigured ? 'LIVE 🟢' : 'DÉMO 🟡'}
              </span>
              <span className="text-slate-300">|</span>
              <Zap className={`w-3 h-3 ${isAgoraConfigured ? 'text-blue-500' : 'text-slate-400'}`} />
              <span className="opacity-80">Agora:</span>
              <span className={isAgoraConfigured ? 'text-blue-600 font-extrabold' : 'text-slate-500 font-normal'}>
                {isAgoraConfigured ? 'LIVE 🔵' : 'DÉMO 🟡'}
              </span>
            </button>

            {/* Mobile small status indicator */}
            <button
              onClick={() => setShowSetupModal(true)}
              className="sm:hidden p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
              title="Status Supabase & Agora"
            >
              <Database className={`w-4 h-4 ${isSupabaseConfigured ? 'text-emerald-500' : 'text-slate-400'}`} />
            </button>

            <button 
              onClick={() => handleStartCall('voice')}
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
              title={isRtl ? 'اتصال صوتي' : 'Appel vocal'}
            >
              <Phone className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleStartCall('video')}
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
              title={isRtl ? 'اتصال فيديو' : 'Appel vidéo'}
            >
              <Video className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className={`p-2.5 rounded-xl transition cursor-pointer ${showInfoPanel ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              title={isRtl ? 'معلومات المجموعة' : 'Membres & Infos'}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Bubble Scroll view */}
        <div className="flex-1 overflow-y-auto p-4 bg-transparent space-y-4 relative z-10">
          
          {/* Pinned system instructions banner info */}
          <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 text-center text-[11px] font-semibold text-slate-500 max-w-lg mx-auto flex items-center gap-2 relative z-10">
            <Pin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Masta Messagerie : Vos messages sont synchronisés en direct avec la community. Cliquez sur un message pour y réagir ou répondre !</span>
          </div>

          <div className="relative z-10 space-y-4">
            {messages.map((message) => {
              const isMe = message.senderId === (currentUser.id || 'usr-1');
              
              return (
                <div 
                  key={message.id} 
                  className={`flex flex-col max-w-[85%] sm:max-w-[70%] group relative ${
                    isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
              >
                {/* Sender Title meta */}
                {!isMe && (
                  <span className="text-[9px] font-bold text-slate-400 mb-1 px-1 font-mono uppercase">
                    {message.senderName} • {message.senderRole}
                  </span>
                )}

                {/* Bubble & Inline actions layout */}
                <div className={`flex items-center gap-2 max-w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Message Bubble wrapper with custom design */}
                  <div 
                    onTouchStart={(e) => handleMessageTouchStart(e, message)}
                    onTouchMove={(e) => handleMessageTouchMove(e, message.id)}
                    onTouchEnd={(e) => handleMessageTouchEnd(e, message)}
                    onDoubleClick={() => {
                      handleAddReaction(message.id, '❤️');
                      if (navigator.vibrate) navigator.vibrate([45, 45]);
                    }}
                    className={`rounded-2xl p-3 shadow-3xs relative overflow-hidden transition-all select-none cursor-pointer active:scale-[0.98] ${
                      isMe 
                        ? 'bg-blue-600 text-white border border-blue-600 rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {/* Reply container inside the message */}
                    {message.replyTo && (
                      <div className={`p-2 rounded-lg text-[10px] mb-2 font-semibold border-l-2 ${
                        isMe 
                          ? 'bg-white/10 text-white/95 border-white/50' 
                          : 'bg-slate-50 text-slate-500 border-blue-500'
                      }`}>
                        <p className="font-extrabold">{message.replyTo.sender}</p>
                        <p className="truncate opacity-80">{message.replyTo.text}</p>
                      </div>
                    )}

                    {/* Rendering based on message types */}
                    {message.type === 'voice' ? (
                      <div className="flex items-center gap-3 py-1">
                        <button 
                          onClick={() => handleToggleVoicePlay(message)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-3xs cursor-pointer ${
                            isMe ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                          }`}
                        >
                          {playingVoiceId === message.id ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>
                        
                        <div className="flex-1 min-w-[120px]">
                          {/* Interactive fake wave analyzer bars */}
                          <div className="flex items-end gap-0.5 h-6">
                            {[2, 5, 8, 3, 6, 9, 4, 7, 5, 2, 8, 4, 6, 3, 7, 5].map((h, i) => (
                              <span 
                                key={i} 
                                className={`w-0.75 rounded-full transition-all duration-300 ${
                                  playingVoiceId === message.id ? 'animate-pulse' : ''
                                } ${
                                  isMe ? 'bg-white/60' : 'bg-slate-300'
                                }`} 
                                style={{ height: `${h * 10}%` }} 
                              />
                            ))}
                          </div>
                          <div className="flex justify-between text-[8px] opacity-75 mt-1 font-mono">
                            <span>{playingVoiceId === message.id ? 'Lecture...' : 'Message vocal'}</span>
                            <span>{message.duration}</span>
                          </div>
                        </div>
                      </div>
                    ) : message.type === 'image' ? (
                      <div className="space-y-2">
                        <div className="rounded-xl overflow-hidden shadow-sm max-h-48 border border-slate-100">
                          <img src={message.mediaUrl} alt="shared pic" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <p className="text-xs font-semibold">{message.text}</p>
                      </div>
                    ) : message.type === 'file' ? (
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-black/5 hover:bg-black/10 transition">
                        <Paperclip className="w-5 h-5 shrink-0" />
                        <div className="flex-1 min-w-0 text-[11px] font-bold">
                          <p className="truncate text-slate-800">{message.text}</p>
                          <span className="text-[9px] opacity-75 font-mono block">{message.fileSize}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-[13px] font-semibold leading-relaxed break-words select-text">
                        {message.text}
                      </p>
                    )}
                  </div>

                  {/* Inline action buttons: reactions, reply, and delete positioned elegantly next to the bubble */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-200 shrink-0 z-20">
                    <button 
                      onClick={() => handleAddReaction(message.id, '❤️')}
                      className="p-1 bg-white hover:bg-slate-50 rounded-full shadow-3xs border border-slate-100 text-[11px] transition duration-300 cursor-pointer"
                      title="Aimer"
                    >
                      ❤️
                    </button>
                    <button 
                      onClick={() => handleAddReaction(message.id, '🔥')}
                      className="p-1 bg-white hover:bg-slate-50 rounded-full shadow-3xs border border-slate-100 text-[11px] transition duration-300 cursor-pointer"
                      title="Incendier"
                    >
                      🔥
                    </button>
                    <button 
                      onClick={() => handleAddReaction(message.id, '👍')}
                      className="p-1 bg-white hover:bg-slate-50 rounded-full shadow-3xs border border-slate-100 text-[11px] transition duration-300 cursor-pointer"
                      title="Valider"
                    >
                      👍
                    </button>
                    <button 
                      onClick={() => setReplyingTo(message)}
                      className="p-1 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-full shadow-3xs border border-slate-100 transition duration-300 cursor-pointer"
                      title={isRtl ? "رد" : "Répondre"}
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    {isMe && (
                      <button 
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-1 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full shadow-3xs border border-slate-100 transition duration-300 cursor-pointer"
                        title={isRtl ? "سحب الرسالة" : "Retirer le message"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Reactions list under bubble */}
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {Object.entries(message.reactions).map(([emoji, count]) => (
                      <span key={emoji} className="bg-slate-50 border border-slate-100/80 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-slate-600 flex items-center gap-0.5 shadow-3xs">
                        <span>{emoji}</span>
                        <span className="text-[8px] font-mono">{count}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Read receipt tick & time stamps */}
                <div className={`flex items-center gap-1 text-[8px] font-mono text-slate-400 font-bold mt-1 ${
                  isMe ? 'justify-end' : 'justify-start'
                }`}>
                  <span>{message.time}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-blue-500" />}
                </div>

              </div>
            );
          })}

          {/* Typing feedback loader indicator */}
          {typingChannel === activeChannelId && (
            <div className="flex items-center gap-2 mr-auto max-w-sm">
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black border">
                ✍️
              </div>
              <div className="bg-white border border-slate-100/80 rounded-2xl p-3 rounded-tl-none shadow-3xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Replying Banner wrapper above input toolbar */}
        {replyingTo && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 animate-fade-in relative z-10">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-blue-500" />
              <div>
                <p className="font-extrabold text-[#1034A6]">{replyingTo.senderName}</p>
                <p className="truncate max-w-md text-[11px] font-medium text-slate-400">{replyingTo.text}</p>
              </div>
            </div>
            <button 
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}

        {/* Message editor toolbar footer bar */}
        {isRecording ? (
          <div className="p-3 border-t border-slate-100 bg-red-50/50 flex items-center justify-between gap-3 relative z-10 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <span className="text-xs font-bold text-red-600 font-mono">
                {isRtl ? 'جاري التسجيل...' : 'Enregistrement...'} {formatSeconds(recordingSeconds)}
              </span>
              
              {/* Animated wave bars */}
              <div className="hidden sm:flex items-center gap-1">
                {[4, 8, 3, 7, 5, 9, 2, 6, 4, 8, 5].map((h, i) => (
                  <span 
                    key={i} 
                    className="w-1 bg-red-400 rounded-full animate-bounce" 
                    style={{ 
                      height: `${h * 2}px`, 
                      animationDuration: `${0.6 + i * 0.15}s` 
                    }} 
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleCancelRecording}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Annuler'}
              </button>
              <button 
                type="button"
                onClick={handleSendVoiceRecord}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
              >
                {isRtl ? 'إرسال' : 'Envoyer'}
              </button>
            </div>
          </div>
        ) : (
          <form 
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 relative z-10"
          >
            {/* Hidden native input pickers */}
            <input 
              type="file" 
              ref={photoInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoUpload} 
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />

            {/* Quick attachment pills */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <button 
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                title={isRtl ? 'مشاركة صورة' : 'Partager Image'}
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                title={isRtl ? 'إرفاق ملف' : 'Joindre un fichier'}
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={handleStartRecording}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                title={isRtl ? 'تسجيل صوتي' : 'Enregistrer un vocal'}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Main Text Area Field */}
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={isRtl ? 'اكتب رسالة...' : 'Écrire un message...'}
              className="flex-1 text-xs font-semibold py-2.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition px-3 text-slate-800"
            />

            {/* Send Action Trigger */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xs rounded-xl transition cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>

      {/* Right Sidebar: Members & Group Info Panel */}
      {showInfoPanel && (
        <div className={`w-full md:w-80 border-l border-slate-100 flex flex-col h-full bg-white relative z-20 animate-fade-in shrink-0 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <h4 className="font-serif italic font-black text-sm text-slate-800">
              {isRtl ? 'أعضاء المجموعة' : 'Membres & Infos'}
            </h4>
            <button 
              onClick={() => setShowInfoPanel(false)}
              className="p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Group Meta Info */}
          <div className="p-4 border-b border-slate-100 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-black shadow-md mx-auto mb-3 overflow-hidden">
              <img src="/logo.png" alt="community" className="w-full h-full object-contain p-3 brightness-0 invert" referrerPolicy="no-referrer" />
            </div>
            <h5 className="font-serif italic font-black text-base text-slate-800">
              community
            </h5>
            <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider mt-1">
              {groupMembers.length} {isRtl ? 'عضو نشط' : 'membres actifs'}
            </p>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-3 px-1 text-center">
              {isRtl 
                ? 'القناة الرسمية للتواصل، تنظيم التدريبات، ومشاركة تفاصيل رحلات النادي اللوجستية.' 
                : 'Canal de communication officiel pour la community. Coordination des sorties, hébergements et entraînements.'}
            </p>
          </div>

          {/* Members List Section */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="px-1 text-[10px] font-extrabold text-slate-400 font-mono uppercase tracking-wider">
              {isRtl ? 'قائمة الأعضاء' : 'Membres du Club'} ({groupMembers.length})
            </div>

            <div className="space-y-2">
              {groupMembers.map((member) => {
                const isMe = member.id === currentUser.id;
                return (
                  <div 
                    key={member.id}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-600">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-emerald-500" />
                    </div>

                    {/* Member info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 justify-between">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {member.name} {isMe && <span className="text-[9px] text-blue-600 font-mono font-bold">({isRtl ? 'أنت' : 'Moi'})</span>}
                        </p>
                      </div>
                      <p className="text-[9px] font-mono font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                        {member.runClubRole || 'Membre'}
                      </p>
                    </div>

                    {/* Meta Action */}
                    {member.bloodType && (
                      <span className="bg-red-50 text-red-600 border border-red-100 text-[9px] font-black font-mono px-1.5 py-0.5 rounded-lg shadow-3xs shrink-0">
                        {member.bloodType}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Audio/Video Calling Screen Overlay */}
      {activeCall && (
        <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-between p-6 text-white animate-fade-in overflow-hidden">
          
          {/* Background ambient lighting */}
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-950/20 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-indigo-950/20 blur-[120px]" />

          {/* Video Call Background Stream */}
          {activeCall.type === 'video' && !cameraOff && localStream && (
            <video 
              ref={localVideoRef}
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          )}

          {/* Glass header with call metadata */}
          <div className="relative z-10 w-full flex items-center justify-between bg-white/5 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono text-emerald-400">
                {activeCall.status === 'ringing' ? (isRtl ? 'اتصال...' : 'Appel en cours...') : (isRtl ? 'متصل' : 'Sécurisé par MRC WebRTC')}
              </span>
            </div>
            <div className="text-[11px] font-black font-mono bg-white/10 px-3 py-1 rounded-full border border-white/5">
              {activeCall.type === 'video' ? (isRtl ? 'اتصال فيديو' : 'Vidéoconférence') : (isRtl ? 'اتصال صوتي' : 'Appel Audio')}
            </div>
          </div>

          {/* Center Content Section */}
          <div className="relative z-10 flex-1 w-full max-w-4xl flex flex-col items-center justify-center gap-6 px-4">
            
            {activeCall.status === 'ringing' ? (
              <div className="flex flex-col items-center gap-4">
                {/* Partner Avatar Wrapper */}
                <div className="relative">
                  {/* Ringing waves */}
                  <span className="absolute inset-0 rounded-full border-2 border-blue-500/30 scale-110 animate-ping" />
                  <span className="absolute inset-0 rounded-full border-2 border-indigo-500/20 scale-125 animate-ping [animation-delay:0.3s]" />

                  <div className="w-28 h-28 rounded-full border-4 border-white/10 bg-slate-900 shadow-2xl flex items-center justify-center overflow-hidden relative">
                    {activeCall.partnerAvatar ? (
                      <img 
                        src={activeCall.partnerAvatar} 
                        alt={activeCall.partnerName} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-3xl font-serif italic font-black">
                        {activeCall.partnerName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Identity & Status */}
                <div className="text-center">
                  <h2 className="font-serif italic font-black text-xl sm:text-2xl tracking-tight text-white">
                    {activeCall.partnerName}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest font-mono">
                    {activeCall.isGroup ? (isRtl ? 'قناة جماعية' : 'Community Groupe') : (isRtl ? 'مكالمة خاصة' : 'Membres du Club')}
                  </p>
                </div>
              </div>
            ) : activeCall.isGroup ? (
              // Multi-User Connected Group Call Grid
              <div className="w-full flex-1 flex flex-col justify-center py-2">
                <div className="text-center mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-black font-mono text-emerald-400 uppercase tracking-wider animate-pulse">
                    <Users className="w-3.5 h-3.5" />
                    {isRtl ? 'مكالمة جماعية مباشرة' : 'Conférence Groupe Live'} ({callParticipants.filter(p => !p.isMuted && p.isSpeaking).length} {isRtl ? 'يتحدثون' : 'actifs'})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-h-[50vh] overflow-y-auto pr-1">
                  {callParticipants.map((p) => (
                    <div 
                      key={p.id}
                      className={`relative bg-white/5 backdrop-blur-md border rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-300 ${
                        p.isSpeaking && !p.isMuted
                          ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-950/10 scale-[1.02]' 
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Avatar with speaking wave */}
                      <div className="relative mb-2">
                        {p.isSpeaking && !p.isMuted && (
                          <span className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping scale-110" />
                        )}
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-2 bg-slate-900 ${
                          p.isSpeaking && !p.isMuted ? 'border-emerald-500' : 'border-white/10'
                        }`}>
                          {p.avatarUrl ? (
                            <img 
                              src={p.avatarUrl} 
                              alt={p.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-lg font-serif italic font-extrabold text-slate-300">
                              {p.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Local/Admin tag */}
                        {p.isLocal && (
                          <span className="absolute -bottom-1 -right-1 bg-blue-600 text-[8px] font-extrabold px-1 py-0.5 rounded text-white font-mono uppercase tracking-widest">
                            {isRtl ? 'أنت' : 'Moi'}
                          </span>
                        )}
                      </div>

                      {/* Participant Meta */}
                      <div className="text-center w-full min-w-0">
                        <p className="text-xs font-bold truncate text-white">{p.name}</p>
                        <p className="text-[9px] font-mono font-extrabold text-slate-400 mt-0.5 uppercase tracking-wider">{p.role}</p>
                      </div>

                      {/* Interactive Individual Mute / Controls */}
                      {!p.isLocal && (
                        <button 
                          onClick={() => handleToggleParticipantMute(p.id)}
                          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition cursor-pointer ${
                            p.isMuted 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                          }`}
                          title={p.isMuted ? (isRtl ? 'إلغاء كتم الصوت' : 'Activer audio') : (isRtl ? 'كتم الصوت' : 'Couper le son')}
                        >
                          {p.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {/* Participant audio status badge */}
                      {p.isMuted && (
                        <span className="absolute top-2 left-2 bg-red-600/10 border border-red-600/20 rounded px-1 text-[7px] font-extrabold font-mono text-red-400 tracking-wider">
                          MUTED
                        </span>
                      )}

                      {/* Live speaking equalizer waveform for active group talker */}
                      {p.isSpeaking && !p.isMuted && (
                        <div className="flex gap-0.5 items-center justify-center mt-2 h-3">
                          {[...Array(4)].map((_, idx) => (
                            <span 
                              key={idx} 
                              className="w-0.5 bg-emerald-400 rounded-full animate-pulse"
                              style={{ 
                                height: `${4 + Math.random() * 8}px`,
                                animationDelay: `${idx * 150}ms`
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // 1-to-1 Connected Call (Minimal Clean Display)
              <div className="flex flex-col items-center gap-4">
                {/* Partner Avatar Wrapper */}
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-4 border-white/10 bg-slate-900 shadow-2xl flex items-center justify-center overflow-hidden relative">
                    {activeCall.partnerAvatar ? (
                      <img 
                        src={activeCall.partnerAvatar} 
                        alt={activeCall.partnerName} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-3xl font-serif italic font-black">
                        {activeCall.partnerName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    )}
                    
                    {/* Miniature local stream PiP inside video call corner */}
                    {activeCall.type === 'video' && !cameraOff && localStream && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-mono text-white/80">
                        LIVE
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity & Status */}
                <div className="text-center">
                  <h2 className="font-serif italic font-black text-xl sm:text-2xl tracking-tight text-white">
                    {activeCall.partnerName}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest font-mono">
                    {isRtl ? 'مكالمة خاصة متصلة' : 'Membres du Club'}
                  </p>
                </div>
              </div>
            )}

            {/* Call State & Duration */}
            <div className="text-center bg-black/35 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5">
              {activeCall.status === 'ringing' ? (
                <span className="text-xs font-black text-blue-400 animate-pulse">
                  {isRtl ? 'يرن...' : 'Sonnerie...'}
                </span>
              ) : activeCall.status === 'ended' ? (
                <span className="text-xs font-black text-red-500">
                  {isRtl ? 'تم إنهاء المكالمة' : 'Appel terminé'}
                </span>
              ) : (
                <span className="text-sm font-extrabold font-mono text-emerald-400">
                  {Math.floor(callDuration / 60)}:{(callDuration % 60 < 10 ? '0' : '')}{callDuration % 60}
                </span>
              )}
            </div>

            {/* Live Web Audio Amplitude Waveform (only for connected private calls or when camera is off) */}
            {activeCall.status === 'connected' && (!activeCall.isGroup) && (activeCall.type === 'voice' || cameraOff) && (
              <div className="flex items-center gap-1.5 h-12 mt-2">
                {[...Array(12)].map((_, i) => {
                  // Generate responsive amplitude scales
                  const randomMultiplier = 0.3 + Math.sin(i * 0.5) * 0.4;
                  // Compute height with live audio level fallback
                  const heightValue = Math.max(4, (audioLevel || 0.1) * 60 * randomMultiplier + (micMuted ? 0 : Math.random() * 15));
                  return (
                    <span 
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-75 ${
                        micMuted ? 'bg-red-500/50' : 'bg-gradient-to-t from-emerald-500 to-blue-400'
                      }`}
                      style={{ height: `${heightValue}px` }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Action Controls Row */}
          <div className="relative z-10 w-full max-w-sm flex items-center justify-around bg-white/5 backdrop-blur-lg p-4 rounded-[2rem] border border-white/10 mb-4 shadow-xl">
            {/* Mic Control toggle */}
            <button 
              onClick={handleToggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
                micMuted 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={micMuted ? 'Activer Micro' : 'Couper Micro'}
            >
              {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button 
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition shadow-lg hover:scale-105 cursor-pointer"
              title="Raccrocher"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Camera Control toggle (only available in Video calls) */}
            {activeCall.type === 'video' ? (
              <button 
                onClick={handleToggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
                  cameraOff 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={cameraOff ? 'Activer Caméra' : 'Couper Caméra'}
              >
                {cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            ) : (
              <div className="w-12 h-12 flex items-center justify-center text-slate-500/40">
                <VideoOff className="w-5 h-5" />
              </div>
            )}
          </div>

        </div>
      )}

      {/* Supabase & Agora Setup and Instructions Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="font-serif italic font-black text-lg text-slate-800">
                  {isRtl ? 'إعدادات الاتصال وقاعدة البيانات' : 'Configuration Supabase & Agora'}
                </h3>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="p-2 hover:bg-slate-200/60 rounded-xl transition cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              {/* Status checklist cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supabase Status Card */}
                <div className={`p-4 rounded-2xl border ${isSupabaseConfigured ? 'bg-emerald-50/40 border-emerald-100' : 'bg-amber-50/40 border-amber-100'} transition`}>
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">SUPABASE REALTIME</span>
                    <span className={`px-2 py-0.5 text-[9px] font-black font-mono uppercase rounded-md shadow-3xs ${isSupabaseConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isSupabaseConfigured ? 'Connecté' : 'Simulation'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-2">
                    {isSupabaseConfigured 
                      ? '✓ La synchronisation en temps réel des messages est active avec votre base de données Supabase.'
                      : 'ℹ️ Fonctionne actuellement avec localStorage. Configurez vos clés secrets pour activer la base en direct !'}
                  </p>
                </div>

                {/* Agora Status Card */}
                <div className={`p-4 rounded-2xl border ${isAgoraConfigured ? 'bg-emerald-50/40 border-emerald-100' : 'bg-amber-50/40 border-amber-100'} transition`}>
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">AGORA RTC CALLS</span>
                    <span className={`px-2 py-0.5 text-[9px] font-black font-mono uppercase rounded-md shadow-3xs ${isAgoraConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isAgoraConfigured ? 'Connecté' : 'Simulation'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-2">
                    {isAgoraConfigured 
                      ? '✓ Les appels vocaux et caméra utilisent de vraies connexions Agora WebRTC.'
                      : 'ℹ️ Mode démo actif avec flux caméra locaux. Ajoutez un ID Agora pour des connexions de groupe réelles !'}
                  </p>
                </div>
              </div>

              {/* SQL script for Supabase Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif italic font-black text-sm text-slate-800">
                    {isRtl ? 'كود SQL الخاص بـ Supabase SQL Editor' : 'Script SQL pour l\'Éditeur Supabase'}
                  </h4>
                  <button
                    onClick={() => {
                      const sqlCode = `-- 1. Créer la table des messages de la Postagang\ncreate table if not exists public.mrc_messages (\n  id text primary key,\n  sender_id text not null,\n  sender_name text not null,\n  sender_role text not null,\n  avatar_url text,\n  text text,\n  time text not null,\n  type text not null default 'text',\n  media_url text,\n  file_size text,\n  duration text,\n  reply_to jsonb,\n  reactions jsonb default '{}'::jsonb,\n  read boolean default false,\n  created_at timestamp with time zone default timezone('utc'::text, now()) not null\n);\n\n-- 2. Activer la sécurité au niveau des lignes (RLS)\nalter table public.mrc_messages enable row level security;\n\n-- 3. Créer une règle d'accès publique pour tester (lecture/écriture pour tous)\ncreate policy "Accès public complet" on public.mrc_messages\n  for all using (true) with check (true);\n\n-- 4. Activer la réplication Realtime pour cette table afin de recevoir les messages en direct !\nalter publication supabase_realtime add table public.mrc_messages;`;
                      navigator.clipboard.writeText(sqlCode);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-mono font-extrabold transition cursor-pointer shadow-3xs border border-blue-100"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedSql ? (isRtl ? 'تم النسخ!' : 'Copié !') : (isRtl ? 'نسخ كود SQL' : 'Copier le Code SQL')}
                  </button>
                </div>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  {isRtl 
                    ? 'انسخ هذا الرمز البرمجي وألصقه في محرر SQL (SQL Editor) الخاص بمشروع Supabase لإنشاء الجدول وتفعيل التحديثات المباشرة Realtime.' 
                    : 'Copiez et collez ce script dans l\'éditeur SQL de votre tableau de bord Supabase pour créer la table et activer la réplication temps réel.'}
                </p>

                <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-950 p-4">
                  <pre className="text-[10px] sm:text-xs font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
{`-- 1. Créer la table des messages de la Postagang
create table if not exists public.mrc_messages (
  id text primary key,
  sender_id text not null,
  sender_name text not null,
  sender_role text not null,
  avatar_url text,
  text text,
  time text not null,
  type text not null default 'text',
  media_url text,
  file_size text,
  duration text,
  reply_to jsonb,
  reactions jsonb default '{}'::jsonb,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Activer la sécurité RLS
alter table public.mrc_messages enable row level security;

-- 3. Créer une règle d'accès publique pour tester
create policy "Accès public complet" on public.mrc_messages
  for all using (true) with check (true);

-- 4. Activer le Realtime de Supabase sur cette table
alter publication supabase_realtime add table public.mrc_messages;`}
                  </pre>
                </div>
              </div>

              {/* Secret keys setup documentation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  {isRtl ? 'كيفية تفعيل الاتصال الحقيقي' : 'COMMENT ACTIVER LES CONNEXIONS RÉELLES'}
                </h5>
                <ol className="text-xs font-semibold text-slate-600 space-y-2 list-decimal pl-4 leading-relaxed">
                  <li>
                    {isRtl 
                      ? 'افتح قائمة الإعدادات (Settings / Secrets) في شريط AI Studio الجانبي.' 
                      : 'Accédez à l\'onglet des Secrets / Paramètres dans votre interface AI Studio.'}
                  </li>
                  <li>
                    Ajoutez les variables suivantes avec les identifiants de vos projets :
                    <div className="bg-white/80 p-2 rounded-xl font-mono text-[10px] border border-slate-200/50 mt-1 space-y-0.5 text-slate-700">
                      <div>VITE_SUPABASE_URL = <span className="text-slate-400">"votre_url_supabase"</span></div>
                      <div>VITE_SUPABASE_ANON_KEY = <span className="text-slate-400">"votre_cle_anon_key"</span></div>
                      <div>VITE_AGORA_APP_ID = <span className="text-slate-400">"votre_id_agora_rtc"</span></div>
                    </div>
                  </li>
                  <li>
                    {isRtl 
                      ? 'أعد تحميل الصفحة أو خادم التطوير لتطبيق التعديلات والتمتع باتصال حي بالكامل!' 
                      : 'Rechargez l\'application pour appliquer les secrets et communiquer en direct !'}
                  </li>
                </ol>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                {isRtl ? 'موافق' : 'Compris !'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile/Touch Long Press Action Options Drawer */}
      {selectedMobileMsg && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity duration-300 animate-fade-in flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedMobileMsg(null)}
        >
          {/* Menu Card */}
          <div 
            className="bg-white rounded-t-[2.5rem] sm:rounded-[2rem] max-w-sm w-full p-6 pb-8 sm:pb-6 space-y-5 shadow-2xl relative border border-slate-100 animate-slide-up select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle for mobile */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto sm:hidden" />

            {/* Title / Info */}
            <div className={`text-center space-y-1 ${isRtl ? 'text-right' : ''}`}>
              <h4 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
                {isRtl ? 'خيارات الرسالة' : 'Options du message'}
              </h4>
              <p className="text-xs font-serif italic font-extrabold text-slate-800 truncate">
                {selectedMobileMsg.senderName} : {
                  selectedMobileMsg.type === 'voice' 
                    ? '🎙️ Message Vocal' 
                    : selectedMobileMsg.type === 'image' 
                      ? '📷 Photo' 
                      : selectedMobileMsg.type === 'file' 
                        ? '📁 Fichier' 
                        : selectedMobileMsg.text
                }
              </p>
            </div>

            {/* Quick Reactions Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
                {isRtl ? 'تفاعل سريع' : 'Réaction rapide'}
              </span>
              <div className="grid grid-cols-8 gap-1 p-1 bg-slate-50 rounded-2xl border border-slate-100/85">
                {['❤️', '🔥', '👍', '😂', '😮', '😢', '👏', '🎉'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleAddReaction(selectedMobileMsg.id, emoji);
                      if (navigator.vibrate) navigator.vibrate(40);
                      setSelectedMobileMsg(null);
                    }}
                    className="h-9 text-lg hover:scale-125 hover:-rotate-12 active:scale-95 transition cursor-pointer flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons list */}
            <div className="space-y-2">
              {/* Reply */}
              <button
                onClick={() => {
                  setReplyingTo(selectedMobileMsg);
                  setSelectedMobileMsg(null);
                }}
                className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 border border-slate-100 rounded-2xl transition cursor-pointer text-xs font-bold text-slate-700 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
              >
                <Reply className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="flex-1">{isRtl ? 'رد على الرسالة' : 'Répondre au message'}</span>
              </button>

              {/* Copy (only for text type) */}
              {selectedMobileMsg.type !== 'voice' && selectedMobileMsg.type !== 'image' && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedMobileMsg.text || '');
                    if (navigator.vibrate) navigator.vibrate(40);
                    setSelectedMobileMsg(null);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 border border-slate-100 rounded-2xl transition cursor-pointer text-xs font-bold text-slate-700 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                >
                  <Copy className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="flex-1">{isRtl ? 'نسخ النص' : 'Copier le texte'}</span>
                </button>
              )}

              {/* Delete / Retirer (if is Me) */}
              {(selectedMobileMsg.senderId === currentUser.id || selectedMobileMsg.senderId === 'usr-1') && (
                <button
                  onClick={() => {
                    handleDeleteMessage(selectedMobileMsg.id);
                    if (navigator.vibrate) navigator.vibrate(50);
                    setSelectedMobileMsg(null);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-rose-50 border border-rose-100 rounded-2xl transition cursor-pointer text-xs font-bold text-rose-600 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                >
                  <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="flex-1">{isRtl ? 'سحب الرسالة (حذف)' : 'Retirer le message (Supprimer)'}</span>
                </button>
              )}

              {/* Close/Cancel */}
              <button
                onClick={() => setSelectedMobileMsg(null)}
                className="w-full text-center p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition cursor-pointer text-xs font-bold text-slate-500"
              >
                {isRtl ? 'إلغاء' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
