import React, { useState, useEffect, useRef } from 'react';
import { Runner } from '../types';
import { Language, translations } from '../translations';
import { 
  MessageSquare, Search, Send, Pin, Phone, Video, Info, 
  Smile, Image as ImageIcon, Paperclip, Mic, CheckCheck, Play, Pause,
  Reply, ChevronRight, X, Heart, ThumbsUp, Flame, Star, Volume2, Film, Check
} from 'lucide-react';

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

  // Input States
  const [inputText, setInputText] = useState('');
  const [typingChannel, setTypingChannel] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Playback of voice states
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Mock channels
  const [channels, setChannels] = useState<ChatChannel[]>([
    {
      id: 'chan-group-1',
      name: 'Postagang N°27 🏃‍♂️⚡',
      isGroup: true,
      pinned: true,
      unreadCount: 0,
      lastMessage: 'Amine R.: La sortie de vendredi sera inoubliable !',
      lastMessageTime: '14:32',
      membersCount: 28
    },
    {
      id: 'chan-group-2',
      name: 'Comité de Coordination 📋',
      isGroup: true,
      pinned: true,
      unreadCount: 0,
      lastMessage: 'Abdou Zaiti: Budget bus validé pour Mosta !',
      lastMessageTime: '10:15',
      membersCount: 5
    },
    {
      id: 'chan-private-1',
      name: 'Coach Redouane 🏆',
      isGroup: false,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      pinned: false,
      unreadCount: 0,
      lastMessage: 'Avez-vous complété votre plan de fractionnés ?',
      lastMessageTime: 'Hier',
    },
    {
      id: 'chan-private-2',
      name: 'Yacine Runner ⚡',
      isGroup: false,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      pinned: false,
      unreadCount: 1,
      lastMessage: 'Tu as pris le maillot de taille M ?',
      lastMessageTime: 'Mardi',
    }
  ]);

  // Initial messages state index by channelId
  const [channelMessages, setChannelMessages] = useState<{ [chanId: string]: Message[] }>({
    'chan-group-1': [
      {
        id: 'm-1',
        senderId: 'usr-coach',
        senderName: 'Coach Redouane',
        senderRole: 'Coach',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        text: '🔥 Bonjour à toute la Postagang ! Pour le trail de vendredi, l\'ascension finale de 300m D+ nécessite de garder des réserves. Gérez votre cardio !',
        time: '09:12',
        type: 'text',
        reactions: { '🔥': 8, '💪': 5 },
        read: true
      },
      {
        id: 'm-2',
        senderId: 'usr-yacine',
        senderName: 'Yacine Runner',
        senderRole: 'Membre',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        text: 'Message Vocal d\'organisation générale',
        time: '09:45',
        type: 'voice',
        duration: '0:34',
        reactions: { '👍': 4 },
        read: true
      },
      {
        id: 'm-3',
        senderId: 'usr-1',
        senderName: currentUser.name,
        senderRole: 'Admin',
        avatarUrl: currentUser.avatarUrl || null,
        text: 'J\'ai mis en ligne les fiches d\'urgence de tout le monde. Les coureurs sans certificat médical doivent le charger dans l\'application ! 📋',
        time: '11:20',
        type: 'text',
        read: true
      },
      {
        id: 'm-4',
        senderId: 'usr-sofiane',
        senderName: 'Sofiane K.',
        senderRole: 'Membre',
        text: 'Notre tracé officiel pour Mosta Trail !',
        time: '13:02',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80',
        read: true
      },
      {
        id: 'm-5',
        senderId: 'usr-amine',
        senderName: 'Amine R.',
        senderRole: 'Membre',
        text: 'La sortie de vendredi sera inoubliable !',
        time: '14:32',
        type: 'text',
        reactions: { '❤️': 3 },
        read: true
      }
    ],
    'chan-group-2': [
      {
        id: 'mg2-1',
        senderId: 'usr-coach',
        senderName: 'Coach Redouane',
        senderRole: 'Coach',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        text: 'On a combien de personnes inscrites pour l\'hébergement ? Il nous faut louer un dortoir de plus.',
        time: '08:30',
        type: 'text',
        read: true
      },
      {
        id: 'mg2-2',
        senderId: 'usr-1',
        senderName: currentUser.name,
        senderRole: 'Admin',
        avatarUrl: currentUser.avatarUrl || null,
        text: 'Budget bus validé pour Mosta ! Nous avons 18 personnes avec nuitée mémorisée.',
        time: '10:15',
        type: 'text',
        read: true
      }
    ],
    'chan-private-1': [
      {
        id: 'mp1-1',
        senderId: 'usr-coach',
        senderName: 'Coach Redouane',
        senderRole: 'Coach',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        text: 'Yacine m\'a dit que tu as ressenti une petite gêne au genou droit sur le dernier fractionné. Fais attention à ne pas forcer cette semaine.',
        time: 'Hier 16:40',
        type: 'text',
        read: true
      },
      {
        id: 'mp1-2',
        senderId: 'usr-1',
        senderName: currentUser.name,
        senderRole: 'Admin',
        avatarUrl: currentUser.avatarUrl || null,
        text: 'Oui Coach, juste une petite fatigue de rotule, j\'ai glacé et mis de l\'argile. Tout est au top ! 💪',
        time: 'Hier 17:05',
        type: 'text',
        read: true
      },
      {
        id: 'mp1-3',
        senderId: 'usr-coach',
        senderName: 'Coach Redouane',
        senderRole: 'Coach',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        text: 'Avez-vous complété votre plan de fractionnés ?',
        time: 'Hier 18:20',
        type: 'text',
        read: true
      }
    ],
    'chan-private-2': [
      {
        id: 'mp2-1',
        senderId: 'usr-yacine',
        senderName: 'Yacine Runner',
        senderRole: 'Membre',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        text: 'Tu as pris le maillot de taille M ?',
        time: 'Mardi 15:45',
        type: 'text',
        read: false
      }
    ]
  });

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const messages = channelMessages[activeChannelId] || [];

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
      senderId: 'usr-1',
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

    // Simulate smart reply from running partners
    simulateBotReply();
  };

  // Bot Simulator Response
  const simulateBotReply = () => {
    setTypingChannel(activeChannelId);

    setTimeout(() => {
      const answersGroup = [
        "Force à nous l'équipe ! On va cartonner vendredi. 🔥🏃‍♂️",
        "Abdou, n'oublie pas de vérifier si la glacière de fruits est prête pour l'arrivée !",
        "Magnifique ! Mosta Run Club va encore dominer les sentiers.",
        "Est-ce qu'on s'arrête boire un thé à l'arrivée ? 🍵",
        "Parfait, merci pour les précisions !"
      ];

      const answersPrivate = [
        "Super Abdou ! Tiens-moi au courant si tu as besoin d'aide pour le fichier d'hébergement.",
        "Reçu ! On reste connectés pour organiser le départ.",
        "Parfait, je prépare mes affaires ce soir.",
        "Est-ce qu'il reste de la place dans le bus principal ?"
      ];

      const chosenAnswer = activeChannel.isGroup 
        ? answersGroup[Math.floor(Math.random() * answersGroup.length)]
        : answersPrivate[Math.floor(Math.random() * answersPrivate.length)];

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Determine sender
      let senderName = 'Yacine Runner';
      let senderAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
      let senderRole = 'Membre';

      if (activeChannelId === 'chan-private-1') {
        senderName = 'Coach Redouane';
        senderAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
        senderRole = 'Coach';
      } else if (activeChannelId === 'chan-group-1' && Math.random() > 0.5) {
        senderName = 'Coach Redouane';
        senderAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
        senderRole = 'Coach';
      }

      const botMsg: Message = {
        id: 'm-bot-' + Date.now(),
        senderId: 'bot-sender',
        senderName,
        senderRole,
        avatarUrl: senderAvatar,
        text: chosenAnswer,
        time: timestamp,
        type: 'text',
        read: true
      };

      setChannelMessages(prev => ({
        ...prev,
        [activeChannelId]: [...(prev[activeChannelId] || []), botMsg]
      }));

      // Update channel info
      setChannels(prev => prev.map(c => {
        if (c.id === activeChannelId) {
          return {
            ...c,
            lastMessage: `${senderName.split(' ')[0]}: ${chosenAnswer}`,
            lastMessageTime: timestamp
          };
        }
        return c;
      }));

      setTypingChannel(null);
    }, 2000);
  };

  // React to a message
  const handleAddReaction = (msgId: string, emoji: string) => {
    setChannelMessages(prev => {
      const chanMsgs = prev[activeChannelId] || [];
      const updated = chanMsgs.map(m => {
        if (m.id === msgId) {
          const currentReactions = m.reactions || {};
          const val = currentReactions[emoji] || 0;
          return {
            ...m,
            reactions: {
              ...currentReactions,
              [emoji]: val + 1
            }
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
        senderId: 'usr-1',
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
        senderId: 'usr-1',
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
        senderId: 'usr-1',
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
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-3xs overflow-hidden h-[calc(100vh-180px)] min-h-[500px] flex flex-col md:flex-row animate-fade-in relative">
      
      {/* Channels Sidebar List */}
      <div className="w-full md:w-80 border-r border-slate-50 flex flex-col h-full bg-[#FAFBFD]/60">
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
                      <span className="text-sm font-black font-serif italic">PG</span>
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
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Active chat header toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shadow-3xs bg-white/90 backdrop-blur-md relative z-10">
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs overflow-hidden">
              {activeChannel.isGroup ? 'PG' : (
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
            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer">
              <Video className="w-4 h-4" />
            </button>
            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Bubble Scroll view */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#FAFBFD]/30 space-y-4">
          
          {/* Pinned system instructions banner info */}
          <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 text-center text-[11px] font-semibold text-slate-500 max-w-lg mx-auto flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Masta Messagerie : Vos messages sont synchronisés en direct avec la Postagang. Cliquez sur un message pour y réagir ou répondre !</span>
          </div>

          {messages.map((message) => {
            const isMe = message.senderId === 'usr-1';
            
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

                {/* Message Bubble wrapper with custom design */}
                <div 
                  className={`rounded-2xl p-3 shadow-3xs relative overflow-hidden transition-all ${
                    isMe 
                      ? 'bg-gradient-to-r from-[#1034A6] to-[#1E56A0] text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
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
                        onClick={() => setPlayingVoiceId(playingVoiceId === message.id ? null : message.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-3xs cursor-pointer ${
                          isMe ? 'bg-white text-[#1034A6]' : 'bg-[#1034A6] text-white'
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

                {/* Hover overlay actions: reactions and replies */}
                <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 z-20 ${
                  isMe ? 'left-0 -translate-x-full pr-3' : 'right-0 translate-x-full pl-3'
                }`}>
                  <button 
                    onClick={() => handleAddReaction(message.id, '❤️')}
                    className="p-1 bg-white hover:bg-slate-50 rounded-full shadow-3xs border border-slate-100 text-[11px] transition duration-300"
                    title="Aimer"
                  >
                    ❤️
                  </button>
                  <button 
                    onClick={() => handleAddReaction(message.id, '🔥')}
                    className="p-1 bg-white hover:bg-slate-50 rounded-full shadow-3xs border border-slate-100 text-[11px] transition duration-300"
                    title="Incendier"
                  >
                    🔥
                  </button>
                  <button 
                    onClick={() => handleAddReaction(message.id, '👍')}
                    className="p-1 bg-white hover:bg-slate-50 rounded-full shadow-3xs border border-slate-100 text-[11px] transition duration-300"
                    title="Valider"
                  >
                    👍
                  </button>
                  <button 
                    onClick={() => setReplyingTo(message)}
                    className="p-1 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-full shadow-3xs border border-slate-100 transition duration-300"
                    title="Répondre"
                  >
                    <Reply className="w-3 h-3" />
                  </button>
                </div>

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
        <form 
          onSubmit={handleSendMessage}
          className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 relative z-10"
        >
          {/* Quick attachment pills */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button 
              type="button"
              onClick={() => triggerAttachment('image')}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
              title="Partager Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => triggerAttachment('file')}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
              title="Joindre un fichier"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => triggerAttachment('voice')}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
              title="Envoyer Vocal"
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

      </div>

    </div>
  );
}
