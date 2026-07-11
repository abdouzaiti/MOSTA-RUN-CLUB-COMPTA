import React, { useState, useEffect, useRef } from 'react';
import { Runner, SupportMessage } from '../types';
import { Language } from '../translations';
import { supabase, dbService } from '../supabaseClient';
import { 
  Send, HelpCircle, User, Shield, MessageSquare, Clock, Check, CheckCheck, Sparkles, AlertCircle,
  Smile, Heart, ThumbsUp, Flame, Star, Phone, Video, Mic, X, Play, Pause
} from 'lucide-react';

interface AdminSupportChatProps {
  currentUser: Runner;
  runners: Runner[];
  language: Language;
}

export default function AdminSupportChat({ currentUser, runners, language }: AdminSupportChatProps) {
  const isRtl = language === 'ar';
  
  // Find the admin's ID dynamically
  const adminRunner = runners.find(r => r.runClubRole === 'Admin') || runners.find(r => r.id === 'usr-1');
  const adminId = adminRunner ? adminRunner.id : 'usr-1';

  const isAdmin = currentUser.runClubRole === 'Admin' || currentUser.id === adminId;
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isGirlMode = typeof window !== 'undefined' && localStorage.getItem('mrc_girl_mode') === 'true';

  // State for messages
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial messages from Supabase
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const msgs = await dbService.getSupportMessages();
        setMessages(msgs);
      } catch (err) {
        console.error("Error loading support messages:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Subscribe to real-time changes
    if (supabase) {
      const channel = supabase
        .channel('support_messages_admin_chat')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'support_messages' 
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg: SupportMessage = {
              id: payload.new.id,
              senderId: payload.new.sender_id,
              senderName: payload.new.sender_name,
              senderAvatar: payload.new.sender_avatar,
              receiverId: payload.new.receiver_id,
              text: payload.new.text,
              timestamp: payload.new.timestamp,
              read: payload.new.read,
              reactions: payload.new.reactions || {}
            };
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? { 
              ...m, 
              read: payload.new.read,
              reactions: payload.new.reactions || m.reactions 
            } : m));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Selected thread (user ID) for Admin
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingSecondsRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // Call States
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video'; status: 'ringing' | 'connected' | 'ended' } | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const callIntervalRef = useRef<any>(null);

  // Filter messages related to the current thread
  const activeThreadUserId = isAdmin ? selectedUserId : adminId;

  // Filter runners who have initiated a chat (for admin view)
  const chatThreads = React.useMemo(() => {
    if (!isAdmin) return [];

    // Map all people (runners or guests) who have exchanged messages
    const participantsMap = new Map<string, { runner: Runner; lastMsg?: SupportMessage; unreadCount: number }>();

    // First add all runners as potential threads
    runners.forEach(r => {
      if (r.id !== currentUser.id) {
        participantsMap.set(r.id, { runner: r, unreadCount: 0 });
      }
    });

    // Then process messages to find active threads including guests
    messages.forEach(msg => {
      const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
      
      // Ignore broadcast messages for thread listing
      if (otherId === 'default' || otherId === 'all') return;
      if (otherId === currentUser.id) return;

      if (!participantsMap.has(otherId)) {
        // This is likely a guest
        participantsMap.set(otherId, {
          runner: {
            id: otherId,
            name: msg.senderId === otherId ? msg.senderName : (isRtl ? 'زائر' : 'Visiteur'),
            runClubRole: (isRtl ? 'زائر' : 'Visiteur') as any,
            phone: 'N/A',
            email: 'N/A',
            bloodType: 'N/A'
          },
          unreadCount: 0
        });
      }

      const thread = participantsMap.get(otherId)!;
      
      // Update last message
      if (!thread.lastMsg || new Date(msg.timestamp) > new Date(thread.lastMsg.timestamp)) {
        thread.lastMsg = msg;
      }

      // Update unread count (if sent to admin)
      if (msg.senderId === otherId && msg.receiverId === currentUser.id && !msg.read) {
        thread.unreadCount++;
      }
    });

    return Array.from(participantsMap.values())
      .map(thread => ({
        runner: thread.runner,
        lastMessage: thread.lastMsg ? thread.lastMsg.text : (isRtl ? 'لا توجد رسائل بعد' : 'Aucun message'),
        lastMessageTime: thread.lastMsg ? formatTime(thread.lastMsg.timestamp) : '',
        unreadCount: thread.unreadCount,
        timestamp: thread.lastMsg ? new Date(thread.lastMsg.timestamp).getTime() : 0
      }))
      .sort((a, b) => {
        if (a.timestamp !== b.timestamp) return b.timestamp - a.timestamp;
        return a.runner.name.localeCompare(b.runner.name);
      });
  }, [messages, runners, isAdmin, isRtl, currentUser.id]);

  // Set default selected thread for Admin on load
  useEffect(() => {
    if (isAdmin && chatThreads.length > 0 && !selectedUserId) {
      setSelectedUserId(chatThreads[0].runner.id);
    }
  }, [isAdmin, chatThreads, selectedUserId]);

  // Handle marking messages as read
  useEffect(() => {
    if (!activeThreadUserId || !isAdmin) return;
    
    const unreadMessages = messages.filter(
      msg => msg.senderId === activeThreadUserId && msg.receiverId === currentUser.id && !msg.read
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        dbService.markSupportMessageAsRead(msg.id);
      });
    }
  }, [messages, activeThreadUserId, currentUser.id, isAdmin]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUserId]);

  function formatTime(isoString: string) {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const receiverId = isAdmin ? selectedUserId : adminId;

    const newMessage: SupportMessage = {
      id: `support-msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl || null,
      receiverId: receiverId,
      text: textToSend,
      timestamp: new Date().toISOString(),
      read: false
    };

    try {
      await dbService.sendSupportMessage(newMessage);
      setInputText('');
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleAddReaction = async (msgId: string, emoji: string) => {
    const message = messages.find(m => m.id === msgId);
    if (!message) return;

    const currentReactions = { ...(message.reactions || {}) };
    
    // Get or initialize reactedBy
    const rawReactedBy = (currentReactions as any).reactedBy || {};
    const reactedBy = typeof rawReactedBy === 'object' && rawReactedBy !== null && !Array.isArray(rawReactedBy) 
      ? { ...rawReactedBy } 
      : {};
    
    const prevEmoji = reactedBy[currentUser.id];
    
    // Decrement previous emoji count if exists
    if (prevEmoji) {
      const currentVal = (currentReactions[prevEmoji] as any) || 1;
      currentReactions[prevEmoji] = (Math.max(0, currentVal - 1) as any);
      if (currentReactions[prevEmoji] === 0) {
        delete currentReactions[prevEmoji];
      }
    }
    
    if (prevEmoji === emoji) {
      // Un-react
      delete reactedBy[currentUser.id];
    } else {
      // New reaction or changing reaction
      reactedBy[currentUser.id] = emoji;
      const currentVal = (currentReactions[emoji] as any) || 0;
      currentReactions[emoji] = (currentVal + 1) as any;
    }
    
    (currentReactions as any).reactedBy = reactedBy;

    try {
      await dbService.updateSupportMessageReactions(msgId, currentReactions);
      // Local state will be updated by Supabase subscription
    } catch (err) {
      console.error("Error updating reaction:", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const durationSeconds = recordingSecondsRef.current;
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const receiverId = isAdmin ? selectedUserId : adminId;
          const newMessage: SupportMessage = {
            id: `support-msg-${Date.now()}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatarUrl || null,
            receiverId: receiverId,
            text: '🎙️ Vocal Message',
            timestamp: new Date().toISOString(),
            read: false,
          };
          
          (newMessage as any).type = 'voice';
          (newMessage as any).mediaUrl = base64Audio;
          (newMessage as any).duration = formatSeconds(durationSeconds);

          try {
            await dbService.sendSupportMessage(newMessage);
          } catch (err) {
            console.error("Error sending voice message:", err);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          const next = prev + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatSeconds = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const quickReactions = ['❤️', '👍', '🔥', '👏', '😮', '😢'];

  const startCall = (type: 'voice' | 'video') => {
    setActiveCall({ type, status: 'ringing' });
    setCallDuration(0);
    
    // Simulate connection after 2 seconds
    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
      callIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }, 2000);
  };

  const endCall = () => {
    setActiveCall(null);
    if (callIntervalRef.current) clearInterval(callIntervalRef.current);
  };

  // Filter messages for current thread
  const threadMessages = messages.filter(msg => {
    if (isAdmin) {
      return (msg.senderId === selectedUserId && msg.receiverId === currentUser.id) ||
             (msg.senderId === currentUser.id && msg.receiverId === selectedUserId) ||
             (selectedUserId && (msg.senderId === adminId || msg.senderId === 'usr-1') && msg.receiverId === 'default'); // Show initial welcome too
    } else {
      // User view: messages between user and admin, or welcome message
      return (msg.senderId === currentUser.id && msg.receiverId === adminId) ||
             (msg.senderId === adminId && msg.receiverId === currentUser.id) ||
             (msg.receiverId === 'default' || msg.receiverId === 'all');
    }
  });

  const suggestions = isRtl ? [
    { text: "كيف يمكنني تغيير كلمة المرور؟", label: "🔑 كلمة المرور" },
    { text: "تعرضت لإصابة خفيفة أثناء الجري، ماذا أفعل؟", label: "🤕 إصابة" },
    { text: "هل قميص النادي متوفر بمقاس L؟", label: "👕 قميص النادي" },
  ] : language === 'en' ? [
    { text: "How can I change my password?", label: "🔑 Change Password" },
    { text: "I have a minor injury from today's run.", label: "🤕 Injury Support" },
    { text: "Is the club jersey available in size L?", label: "👕 Jersey Stock" },
  ] : [
    { text: "Comment puis-je changer mon mot de passe ?", label: "🔑 Mot de passe" },
    { text: "Je me suis blessé légèrement aujourd'hui.", label: "🤕 Blessure" },
    { text: "Est-ce que le maillot du club est dispo en taille L ?", label: "👕 Stock Maillot" },
  ];

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-3xs space-y-4 animate-fade-in">
      <div className={`flex items-center justify-between border-b border-slate-200/60 pb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="p-2.5 bg-blue-100 text-[#1034A6] rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className={isRtl ? 'text-right' : ''}>
            <h4 className="font-serif italic font-extrabold text-slate-800 text-xs sm:text-sm">
              {isAdmin 
                ? (isRtl ? 'مركز دعم المشرفين • MRC Admin Support' : 'Support Center • Messagerie Admin')
                : (isRtl ? 'محادثة الدعم مع المسؤول' : "Support de Communication Direct de l'Admin")
              }
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">
              {isAdmin 
                ? (isRtl ? 'تواصل مباشرة مع الأعضاء لحل مشاكلهم' : 'Répondez directement aux requêtes d\'aide des membres')
                : (isRtl ? 'تواصل مباشرة مع الكابتن عبدو الزايتي' : 'Chat direct de secours & questions avec Abdou Zaiti')
              }
            </p>
          </div>
        </div>

        {/* Online Badge */}
        <div className={`flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-bold border border-emerald-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{isRtl ? 'متصل الآن' : 'En ligne'}</span>
        </div>
      </div>

      {isAdmin ? (
        /* ================= ADMIN VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[380px]">
          {/* User Threads List Sidebar */}
          <div className="md:col-span-4 bg-white rounded-xl border border-slate-200/80 p-2 overflow-y-auto max-h-[380px] space-y-1">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider p-2 block border-b border-slate-100 mb-1">
              {isRtl ? 'طلبات الدعم النشطة' : 'THREADS ACTIFS'}
            </span>
            {chatThreads.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-8">
                {isRtl ? 'لا توجد محادثات دعم بعد.' : 'Aucun fil de support.'}
              </p>
            ) : (
              chatThreads.map(({ runner, lastMessage, lastMessageTime, unreadCount }) => (
                <button
                  key={runner.id}
                  onClick={() => setSelectedUserId(runner.id)}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition text-left relative cursor-pointer ${
                    selectedUserId === runner.id 
                      ? 'bg-blue-50/70 border border-blue-100 text-slate-800' 
                      : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                  } ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#1034A6] text-white flex items-center justify-center text-xs font-black shrink-0 overflow-hidden border border-slate-200">
                    {runner.avatarUrl ? (
                      <img src={runner.avatarUrl} alt={runner.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      runner.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <h5 className="font-bold text-[11px] truncate text-slate-800">{runner.name}</h5>
                      <span className="text-[8px] text-slate-400 font-mono font-medium shrink-0">{lastMessageTime}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">{lastMessage}</p>
                  </div>

                  {/* Unread badge */}
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-extrabold animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Active Conversation Chat Window */}
          <div className="md:col-span-8 flex flex-col bg-white rounded-xl border border-slate-200/80 overflow-hidden min-h-[350px]">
            {selectedUserId ? (
              <>
                {/* Active Call Overlay */}
                {activeCall && (
                  <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-6 animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-blue-600 mb-4 flex items-center justify-center text-2xl font-bold overflow-hidden border-4 border-slate-800">
                      {runners.find(r => r.id === selectedUserId)?.avatarUrl ? (
                        <img src={runners.find(r => r.id === selectedUserId)?.avatarUrl} alt="Partner" className="w-full h-full object-cover" />
                      ) : (
                        runners.find(r => r.id === selectedUserId)?.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <h3 className="text-lg font-black mb-1">{runners.find(r => r.id === selectedUserId)?.name}</h3>
                    <p className="text-blue-400 text-xs font-bold mb-8 animate-pulse">
                      {activeCall.status === 'ringing' ? 'Appel en cours...' : formatSeconds(callDuration)}
                    </p>
                    
                    <div className="flex gap-4">
                      <button 
                        onClick={endCall}
                        className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center hover:bg-rose-700 transition shadow-lg"
                      >
                        <Phone className="w-6 h-6 rotate-[135deg]" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Active user header */}
                {(() => {
                  const activeRunner = runners.find(r => r.id === selectedUserId);
                  return (
                    <div className={`p-3 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden border border-slate-200">
                          {activeRunner?.avatarUrl ? (
                            <img src={activeRunner.avatarUrl} alt={activeRunner.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            activeRunner?.name.substring(0, 2).toUpperCase() || 'US'
                          )}
                        </div>
                        <div className={isRtl ? 'text-right' : ''}>
                          <h5 className="font-bold text-[11.5px] text-slate-800">{activeRunner?.name}</h5>
                          <span className="text-[9px] text-[#2F89FC] font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                            👤 {activeRunner?.runClubRole || 'Membre'} • 🩸 {activeRunner?.bloodType || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => startCall('voice')}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => startCall('video')}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-right ml-2">
                          <span className="text-[9px] text-slate-400 font-mono block">Tel: {activeRunner?.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Messages feed */}
                <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto min-h-0 bg-slate-50/30">
                  {threadMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-2">
                      <HelpCircle className="w-7 h-7 text-slate-300" />
                      <p className="text-[11px] text-slate-400 font-medium">Aucun message échangé avec cet athlète.</p>
                    </div>
                  ) : (
                    threadMessages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="font-extrabold text-[9px] text-slate-600">{msg.senderName}</span>
                            <span className="text-[8px] text-slate-400 font-mono">{formatTime(msg.timestamp)}</span>
                          </div>
                          <div className={`p-2.5 rounded-2xl text-[11px] font-medium leading-relaxed max-w-[85%] border shadow-3xs relative group ${
                            isMe 
                              ? 'bg-[#1034A6] text-white border-transparent rounded-tr-none' 
                              : 'bg-white text-slate-800 border-slate-200/80 rounded-tl-none'
                          }`}>
                            {(msg as any).type === 'voice' ? (
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <button className={`p-1.5 rounded-full ${isMe ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#1034A6]'}`}>
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                </button>
                                <div className="flex-1 h-1 bg-slate-200/30 rounded-full relative overflow-hidden">
                                  <div className={`absolute inset-0 bg-current opacity-40`} style={{ width: '30%' }}></div>
                                </div>
                                <span className="text-[9px] font-mono opacity-80">{(msg as any).duration || '0:00'}</span>
                              </div>
                            ) : msg.text}

                            {/* Hover reactions menu */}
                            <div className={`absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 shadow-lg rounded-full px-1 py-0.5 flex gap-1 z-10 ${
                              isMe ? 'right-0' : 'left-0'
                            }`}>
                              {quickReactions.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleAddReaction(msg.id, emoji)}
                                  className="hover:scale-125 transition-transform p-0.5"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            
                            {/* Displayed reactions */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className={`flex flex-wrap gap-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {Object.entries(msg.reactions).map(([emoji, count]) => {
                                  if (emoji === 'reactedBy') return null;
                                  if (typeof (count as any) !== 'number' || (count as any) <= 0) return null;
                                  const reactedBy = (msg.reactions as any).reactedBy || {};
                                  const hasReacted = reactedBy[currentUser.id] === emoji;
                                  
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => handleAddReaction(msg.id, emoji)}
                                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border transition flex items-center gap-0.5 ${
                                        hasReacted 
                                          ? 'bg-blue-50 border-blue-200 text-[#1034A6]' 
                                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span>{count}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Admin send input */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputText);
                  }}
                  className={`p-2.5 border-t border-slate-100 bg-white flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  {isRecording ? (
                    <div className="flex-1 flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-3 py-1.5 animate-pulse">
                      <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span>{formatSeconds(recordingSeconds)}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={stopRecording}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold"
                      >
                        STOP
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={startRecording}
                        className="p-2 text-slate-400 hover:text-blue-600 transition"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isRtl ? 'اكتب ردك هنا...' : 'Écrire votre réponse...'}
                        className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-300 font-semibold text-slate-800"
                      />
                    </>
                  )}
                  <button
                    type="submit"
                    disabled={!inputText.trim() && !isRecording}
                    className="p-2.5 bg-[#1034A6] text-white hover:bg-[#1E56A0] disabled:opacity-40 rounded-xl cursor-pointer transition shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Shield className="w-8 h-8 text-blue-300 animate-pulse" />
                <h5 className="font-serif italic font-extrabold text-xs text-slate-700">Sélectionnez un ticket de support</h5>
                <p className="text-[10px] text-slate-500 max-w-xs leading-normal font-medium">
                  Cliquez sur un membre à gauche pour consulter l'historique de discussion et lui envoyer une réponse immédiate.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= USER/MEMBER VIEW ================= */
        <div className="flex flex-col bg-white rounded-xl border border-slate-200/80 overflow-hidden min-h-[350px]">
          {/* Header of Active chat with Admin */}
          <div className={`p-3 bg-slate-50 border-b border-slate-200/60 flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#1034A6] text-white flex items-center justify-center text-xs font-black overflow-hidden border border-slate-200">
                <img src={isGirlMode ? "/pinklogo.png" : "/logo.png"} alt="Abdou Zaiti Avatar" className="w-full h-full object-contain p-1 bg-white" referrerPolicy="no-referrer" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
            </div>
            <div className={isRtl ? 'text-right' : ''}>
              <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h5 className="font-serif italic font-black text-[12px] text-slate-800">Abdou Zaiti</h5>
                <span className="text-[8px] bg-blue-100 text-[#1034A6] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider font-mono">
                  ADMIN
                </span>
              </div>
              <p className="text-[9px] text-slate-500 font-medium">
                {isRtl ? 'مستعد لمساعدتك في أي وقت' : 'Fondateur de Mosta Run Club • Disponible pour vous aider'}
              </p>
            </div>
            <div className={`flex items-center gap-1 ${isRtl ? 'mr-auto' : 'ml-auto'}`}>
              <button 
                onClick={() => startCall('voice')}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button 
                onClick={() => startCall('video')}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick suggestions row */}
          <div className="px-3 py-2 bg-slate-50/50 border-b border-slate-100">
            <span className={`text-[8.5px] font-bold text-slate-400 block mb-1 uppercase tracking-wider ${isRtl ? 'text-right' : ''}`}>
              {isRtl ? 'أسئلة شائعة لمساعدتك بسرعة:' : 'SUGGESTIONS DE QUESTIONS :'}
            </span>
            <div className={`flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none ${isRtl ? 'flex-row-reverse' : ''}`}>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(s.text)}
                  className="shrink-0 bg-white hover:bg-blue-50/65 text-[#1034A6] hover:text-blue-700 font-bold border border-slate-200 hover:border-blue-200 rounded-lg px-2.5 py-1 text-[9.5px] transition cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Feed Area */}
          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto min-h-0 bg-slate-50/30 relative">
            {/* Active Call Overlay for User */}
            {activeCall && (
              <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-6 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-[#1034A6] mb-4 flex items-center justify-center text-2xl font-bold overflow-hidden border-4 border-slate-800">
                  <img src={isGirlMode ? "/pinklogo.png" : "/logo.png"} alt="Admin" className="w-full h-full object-contain p-2 bg-white" />
                </div>
                <h3 className="text-lg font-black mb-1">Abdou Zaiti</h3>
                <p className="text-blue-400 text-xs font-bold mb-8 animate-pulse">
                  {activeCall.status === 'ringing' ? 'Appel en cours...' : formatSeconds(callDuration)}
                </p>
                
                <div className="flex gap-4">
                  <button 
                    onClick={endCall}
                    className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center hover:bg-rose-700 transition shadow-lg"
                  >
                    <Phone className="w-6 h-6 rotate-[135deg]" />
                  </button>
                </div>
              </div>
            )}

            {threadMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="font-extrabold text-[9px] text-slate-600">
                      {isMe ? (isRtl ? 'أنا' : 'Moi') : msg.senderName}
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className={`p-2.5 rounded-2xl text-[11px] font-medium leading-relaxed max-w-[85%] border shadow-3xs ${
                    isMe 
                      ? 'bg-[#1034A6] text-white border-transparent rounded-tr-none' 
                      : 'bg-white text-slate-800 border-slate-200/80 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex flex-col items-start animate-pulse">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-extrabold text-[9px] text-slate-600">Abdou Zaiti</span>
                  <span className="text-[8px] text-slate-400 font-mono">En train d'écrire...</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-500 text-[10px] rounded-tl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Sender Input Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className={`p-2.5 border-t border-slate-150 bg-white flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-3 py-2 animate-pulse">
                <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>{formatSeconds(recordingSeconds)}</span>
                </div>
                <button 
                  type="button" 
                  onClick={stopRecording}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold"
                >
                  STOP
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-2 text-slate-400 hover:text-blue-600 transition"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isRtl ? 'اكتب رسالة إلى الكابتن...' : 'Écrivez votre message d\'aide...'}
                  className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-300 font-semibold text-slate-800"
                />
              </>
            )}
            <button
              type="submit"
              disabled={!inputText.trim() && !isRecording}
              className="p-2.5 bg-[#1034A6] text-white hover:bg-[#1E56A0] disabled:opacity-40 rounded-xl cursor-pointer transition shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
