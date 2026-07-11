import React, { useState, useEffect, useRef } from 'react';
import { Runner } from '../types';
import { Language } from '../translations';
import { 
  Send, HelpCircle, User, Shield, MessageSquare, Clock, Check, CheckCheck, Sparkles, AlertCircle
} from 'lucide-react';

interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  receiverId: string;
  text: string;
  timestamp: string; // ISO String
  read?: boolean;
}

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

  // Load support messages from localStorage
  const [messages, setMessages] = useState<SupportMessage[]>(() => {
    const saved = localStorage.getItem('mrc_support_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading support messages:", e);
      }
    }
    // Default messages
    return [
      {
        id: 'welcome-1',
        senderId: 'usr-1',
        senderName: 'Abdou Zaiti',
        receiverId: 'default',
        text: "Salam! Bienvenue sur le support de Mosta Run Club. N'hésite pas à me poser tes questions ou à me signaler tout problème technique ou organisationnel ici. L-khardt, tkair w l-javasa t3-shat! 🏃‍♂️🔥",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        read: true
      }
    ];
  });

  // Selected thread (user ID) for Admin
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Filter messages related to the current thread
  const activeThreadUserId = isAdmin ? selectedUserId : currentUser.id;

  // Filter runners who have initiated a chat (for admin view)
  const chatThreads = React.useMemo(() => {
    if (!isAdmin) return [];

    // Map all runners (except current Admin user) to threads
    return runners
      .filter(r => r.id !== currentUser.id)
      .map(runner => {
        const userMessages = messages.filter(
          msg => (msg.senderId === runner.id && msg.receiverId === currentUser.id) || 
                 (msg.senderId === currentUser.id && msg.receiverId === runner.id)
        );
        const lastMsg = userMessages[userMessages.length - 1];
        const unreadCount = userMessages.filter(msg => msg.senderId === runner.id && !msg.read).length;

        return {
          runner,
          lastMessage: lastMsg ? lastMsg.text : (isRtl ? 'لا توجد رسائل بعد' : 'Aucun message'),
          lastMessageTime: lastMsg ? formatTime(lastMsg.timestamp) : '',
          unreadCount,
          timestamp: lastMsg ? new Date(lastMsg.timestamp).getTime() : 0
        };
      })
      .sort((a, b) => {
        // Active threads with messages go first
        if (a.timestamp > 0 && b.timestamp > 0) {
          return b.timestamp - a.timestamp;
        }
        if (a.timestamp > 0) return -1;
        if (b.timestamp > 0) return 1;
        return a.runner.name.localeCompare(b.runner.name);
      });
  }, [messages, runners, isAdmin, isRtl, currentUser.id]);

  // Set default selected thread for Admin on load
  useEffect(() => {
    if (isAdmin && chatThreads.length > 0 && !selectedUserId) {
      setSelectedUserId(chatThreads[0].runner.id);
    }
  }, [isAdmin, chatThreads, selectedUserId]);

  // Save messages to localStorage on change
  useEffect(() => {
    localStorage.setItem('mrc_support_messages', JSON.stringify(messages));
    // Scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark active messages as read
  useEffect(() => {
    if (!activeThreadUserId) return;
    
    const hasUnread = messages.some(
      msg => msg.senderId === activeThreadUserId && msg.receiverId === currentUser.id && !msg.read
    );

    if (hasUnread) {
      setMessages(prev => 
        prev.map(msg => 
          msg.senderId === activeThreadUserId && msg.receiverId === currentUser.id
            ? { ...msg, read: true }
            : msg
        )
      );
    }
  }, [messages, activeThreadUserId, currentUser.id]);

  function formatTime(isoString: string) {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const newMessage: SupportMessage = {
      id: `support-msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      receiverId: isAdmin ? selectedUserId : adminId,
      text: textToSend,
      timestamp: new Date().toISOString(),
      read: false
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
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
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-mono block">Tel: {activeRunner?.phone || 'N/A'}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Messages feed */}
                <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto max-h-[250px] bg-slate-50/30">
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
                          <div className={`p-2.5 rounded-2xl text-[11px] font-medium leading-relaxed max-w-[85%] border shadow-3xs ${
                            isMe 
                              ? 'bg-[#1034A6] text-white border-transparent rounded-tr-none' 
                              : 'bg-white text-slate-800 border-slate-200/80 rounded-tl-none'
                          }`}>
                            {msg.text}
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
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isRtl ? 'اكتب ردك هنا...' : 'Écrire votre réponse...'}
                    className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-300 font-semibold text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
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
          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[220px] bg-slate-50/30">
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
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRtl ? 'اكتب رسالة إلى الكابتن...' : 'Écrivez votre message d\'aide...'}
              className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-300 font-semibold text-slate-800"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
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
