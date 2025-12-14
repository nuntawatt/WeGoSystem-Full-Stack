import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { socket } from '../../lib/socket';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/apiClient';
import MemberListDM from '../../components/MemberListDM';
import GroupReviews from '../../components/GroupReviews';
import ReportModal from '../../components/ReportModal';
import { ArrowLeft, Users, Send, MessageSquare, Flag, Clock } from 'lucide-react';

type Message = {
  _id: string;
  sender: {
    _id: string;
    email?: string;
    username?: string;
    avatar?: string;
    isOnline?: boolean;
  };
  content: string;
  createdAt: string;
};

type Participant = {
  user?: {
    _id?: string;
    email?: string;
    username?: string;
    avatar?: string;
    isOnline?: boolean;
  } | null;
  role: string;
};

export default function DirectChat() {
  const { uid = '' } = useParams<{ uid: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [membersWithProfiles, setMembersWithProfiles] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch chat info and messages
  useEffect(() => {
    const fetchChat = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await api.get(`/chats/${uid}`);
        const chatData = response.data.chat || response.data;
        console.log('📥 Chat data received:', chatData);
        setChatInfo(chatData);
        setMessages(chatData.messages || []);

        // Fetch profiles for participants
        try {
          const participantIds = (chatData.participants || [])
            .map((p: Participant) => p?.user?._id)
            .filter(Boolean)
            .filter((v: any, i: number, a: any[]) => a.indexOf(v) === i) as string[];

          const profileReqs = participantIds.map((id: string) => api.get(`/profiles/${id}`).catch(() => null));
          const profiles = await Promise.all(profileReqs);

          const profilesById: Record<string, any> = {};
          profiles.forEach((res: any, idx: number) => {
            if (!res || !res.data) return;
            const p = res.data;
            const key = p.userId || p._id || participantIds[idx];
            profilesById[key] = p;
          });

          const members = (chatData.participants || [])
            .filter((p: Participant) => p && p.user && p.user._id) // Add null check
            .filter((p: Participant, index: number, self: Participant[]) => 
              index === self.findIndex((t) => t.user && t.user._id && t.user._id === p.user!._id)
            )
            .map((p: Participant) => {
              const pid = p.user!._id as string;
              const prof = profilesById[pid] || {};
              const email = (p.user?.email || '').toString();
              const usernameFromEmail = email ? email.split('@')[0] : '';
              const safeName = email || p.user?.username || prof.name || String(pid);
              return {
                id: pid,
                name: safeName,
                role: p.role,
                avatar: prof.avatar || '',
                username: p.user?.username || prof.name || usernameFromEmail || safeName,
                isOnline: !!(p.user?.isOnline),
                bio: prof.bio || ''
              };
            });

          setMembersWithProfiles(members);
        } catch (pfErr) {
          console.error('Failed to fetch participant profiles', pfErr);
          setMembersWithProfiles(null);
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch chat:', error);
        setLoadError(error?.message || 'Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    };

    // If route is missing chat id, stop loading and show error.
    if (!uid) {
      setIsLoading(false);
      setLoadError('Missing chat id');
      return;
    }

    // Wait for auth bootstrap; otherwise we can get stuck on loading.
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    // If user is not logged in after auth finishes, stop loading.
    if (!user) {
      setIsLoading(false);
      setLoadError('Please sign in to view this conversation');
      return;
    }

    fetchChat();
  }, [uid, user, authLoading, refreshNonce]);

  // Socket.io connection
  useEffect(() => {
    if (!uid || !user) return;

    console.log('🔌 Socket status before connect:', socket.connected);
    if (!socket.connected) socket.connect();
    console.log('🔌 Socket status after connect:', socket.connected);

    console.log('👤 Joining as user:', user._id);
    socket.emit('user:join', user._id);
    
    console.log('💬 Joining chat room:', uid);
    socket.emit('chat:join', uid);

    const handleNewMessage = (message: Message) => {
      console.log('📥 Received new message:', message);
      setMessages((prev) => {
        console.log('📊 Previous messages:', prev.length);
        console.log('📊 New message count:', prev.length + 1);
        return [...prev, message];
      });
    };

    const handleMessageSent = (message: Message) => {
      console.log('✅ Message sent confirmation:', message);
      // Replace temp message with real message from backend
      setMessages((prev) => {
        const withoutTemp = prev.filter(m => !m._id.startsWith('temp-'));
        return [...withoutTemp, message];
      });
    };

    const handleUserStatus = (payload: { userId: string; isOnline: boolean }) => {
      console.log('👤 User status changed:', payload);
      
      // Update members list
      setMembersWithProfiles((prev) => {
        if (!prev) return prev;
        return prev.map((m) => {
          // Check if this member's user ID matches
          const memberId = m.user?._id || m._id || m.id;
          if (memberId === payload.userId) {
            return {
              ...m,
              isOnline: payload.isOnline,
              user: m.user ? { ...m.user, isOnline: payload.isOnline } : undefined
            };
          }
          return m;
        });
      });
      
      // Update messages sender status
      setMessages((prev) => 
        prev.map((msg) => {
          if (msg.sender._id === payload.userId) {
            return {
              ...msg,
              sender: { ...msg.sender, isOnline: payload.isOnline }
            };
          }
          return msg;
        })
      );
    };

    const handleParticipantsUpdate = (payload: { participants: any[] }) => {
      console.log('🔁 Received participants update for chat:', payload.participants.length);
      // Normalize participants for MemberListDM
      const members = payload.participants
        .filter((p) => p && p.id)
        .map((p) => {
          const id = String(p.id);
          const email = (p.email ?? '').toString();
          const username = (p.username ?? (email ? email.split('@')[0] : '') ?? '').toString();
          return {
            id,
            name: email || username || id,
            role: p.role || 'member',
            avatar: p.avatar || '',
            username: username || 'User',
            isOnline: !!p.isOnline,
            bio: p.bio || '',
            createdAt: p.createdAt || new Date().toISOString()
          };
        });

      setMembersWithProfiles(members);

      // Also update chatInfo participants if present so header count and other parts stay consistent
      setChatInfo((prev: any) => {
        if (!prev) return prev;
        return { ...prev, participants: payload.participants };
      });
    };

    const handleError = (error: any) => {
      console.error('❌ Socket error:', error);
    };

    socket.on('message:receive', handleNewMessage);
    socket.on('message:sent', handleMessageSent);
    socket.on('error', handleError);
    socket.on('userStatusChanged', handleUserStatus);
  socket.on('chat:participants', handleParticipantsUpdate);

    console.log('✅ Socket listeners registered');

    return () => {
      console.log('🔌 Disconnecting from chat:', uid);
      socket.off('message:receive', handleNewMessage);
      socket.off('message:sent', handleMessageSent);
      socket.off('error', handleError);
      socket.off('userStatusChanged', handleUserStatus);
      socket.off('chat:participants', handleParticipantsUpdate);
      socket.emit('chat:leave', uid);
    };
  }, [uid, user]);

  // Polling fallback: refresh participants every 8 seconds in case socket events are missed
  useEffect(() => {
    let mounted = true;
    let timer: any = null;

    const refreshParticipants = async () => {
      try {
        const res = await api.get(`/chats/${uid}`);
        const chatData = res.data.chat || res.data;
        if (!mounted || !chatData || !chatData.participants) return;

        // collect participant ids
        const participantIds = (chatData.participants || [])
          .map((p: any) => {
            const raw = p.user ? p.user : p;
            return raw._id || raw.id || raw.userId || raw.uid || null;
          })
          .filter(Boolean);

        // fetch profiles in parallel (reuse same approach as initial fetchChat)
        const profileReqs = participantIds.map((id: string) => api.get(`/profiles/${id}`).catch(() => null));
        const profiles = await Promise.all(profileReqs);
        const profilesById: Record<string, any> = {};
        profiles.forEach((r: any, idx: number) => {
          if (!r || !r.data) return;
          const p = r.data;
          const key = p.userId || p._id || participantIds[idx];
          profilesById[key] = p;
        });

        const parts = (chatData.participants || [])
          .filter((p: any) => p && (p.user || p._id || p.userId || p.id))
          .map((p: any) => {
            const raw = p.user ? p.user : p;
            const pid = raw._id || raw.id || raw.userId || raw.uid;
            const prof = profilesById[pid] || (p.user && p.user.profile) || raw.profile || {};
            return {
              id: pid,
              name: raw.email || raw.username || raw.name || String(pid),
              role: p.role || raw.role || 'member',
              avatar: prof?.avatar || p.avatar || '',
              username: raw.username || (raw.email ? String(raw.email).split('@')[0] : ''),
              isOnline: !!(raw.isOnline),
              bio: prof?.bio || p.bio || ''
            };
          });

        setMembersWithProfiles(parts);
      } catch (err) {
        // ignore polling errors silently
        // console.debug('participant polling failed', err);
      }
    };

    // start immediately then interval
    refreshParticipants();
    timer = setInterval(refreshParticipants, 8000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [uid]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Compute deduplicated participant count (exclude null users)
  const participantCount = (() => {
    if (membersWithProfiles) return membersWithProfiles.length;
    if (!chatInfo?.participants) return 0;
    const ids = (chatInfo.participants as Participant[])
      .map((p) => p?.user?._id)
      .filter(Boolean) as string[];
    return Array.from(new Set(ids)).length;
  })();

  const handleSend = () => {
    const content = text.trim();
    if (!content || !user) {
      console.log('⚠️ Cannot send: empty content or no user', { content, user: !!user });
      return;
    }

    console.log('Sending message: ', { chatId: uid, userId: user._id, content });
    
    // Optimistic update - แสดงข้อความทันทีก่อนส่งไป backend
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      sender: {
        _id: user._id,
        email: (user as any).email,
        username: (user as any).username,
        avatar: (user as any).avatar
      },
      content: content,
      createdAt: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    setText('');

    socket.emit('message:send', {
      chatId: uid,
      userId: user._id,
      content: content
    });
  };

  if (authLoading || isLoading) {
    return (
      <section className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container-app py-10 md:py-14">
          <div className="mx-auto w-full max-w-4xl">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
              <div className="px-5 py-4 md:px-6 border-b border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 border border-teal-600/20">
                    <MessageSquare className="h-5 w-5 text-teal-600 dark:text-teal-400 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-slate-900 dark:text-white">Loading conversation…</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Preparing chat room</div>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6 animate-pulse">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr),20rem]">
                  {/* Messages skeleton */}
                  <div className="space-y-4">
                    <div className="h-9 w-1/3 rounded-xl bg-slate-100 dark:bg-slate-700/40" />
                    <div className="space-y-3">
                      <div className="h-12 w-2/3 rounded-2xl bg-slate-100 dark:bg-slate-700/40" />
                      <div className="h-12 w-1/2 rounded-2xl bg-slate-100 dark:bg-slate-700/40" />
                      <div className="h-12 w-3/5 rounded-2xl bg-slate-100 dark:bg-slate-700/40" />
                      <div className="h-12 w-1/2 ml-auto rounded-2xl bg-teal-600/10 dark:bg-teal-500/10" />
                    </div>
                    <div className="h-12 w-full rounded-2xl bg-slate-100 dark:bg-slate-700/40" />
                  </div>

                  {/* Sidebar skeleton */}
                  <div className="space-y-4">
                    <div className="h-9 w-2/3 rounded-xl bg-slate-100 dark:bg-slate-700/40" />
                    <div className="space-y-3">
                      <div className="h-20 w-full rounded-2xl bg-slate-100 dark:bg-slate-700/40" />
                      <div className="h-20 w-full rounded-2xl bg-slate-100 dark:bg-slate-700/40" />
                      <div className="h-20 w-full rounded-2xl bg-slate-100 dark:bg-slate-700/40" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="min-h-[60vh]">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-700/40 dark:border-slate-600/50">
                <MessageSquare className="h-5 w-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-slate-900 dark:text-white">Can’t load this conversation</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{loadError}</div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => setRefreshNonce((v) => v + 1)}
                    className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
                  >
                    Retry
                  </button>
                  {!user ? (
                    <Link
                      to="/auth/signin"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600/50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/40"
                    >
                      Sign in
                    </Link>
                  ) : (
                    <Link
                      to="/explore"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600/50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/40"
                    >
                      Back to Explore
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!chatInfo) {
    return (
      <section className="min-h-[60vh]">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-700/40 dark:border-slate-600/50">
                <MessageSquare className="h-5 w-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-slate-900 dark:text-white">Chat room not found</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">This conversation might be deleted or you don’t have access.</div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to="/explore"
                    className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
                  >
                    Back to Explore
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container-app py-6 md:py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:grid-cols-[minmax(0,1fr),20rem]">
          {/* Chat Section */}
          <div className="flex min-h-[70vh] flex-col bg-white dark:bg-slate-800 lg:min-h-[calc(100vh-240px)]">
            {/* Chat Header */}
            <header className="sticky top-0 z-10 px-4 py-4 md:px-6 flex items-center gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors duration-200 group dark:bg-slate-700/50 dark:hover:bg-slate-600/50 dark:border-slate-600/50"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-teal-600 transition-colors dark:text-slate-300 dark:group-hover:text-teal-400" />
                <span className="font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white">Back</span>
              </button>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {chatInfo.type === 'group' 
                    ? (chatInfo.groupInfo?.relatedActivityDetails?.title || chatInfo.groupInfo?.name || 'Group Chat') 
                    : 'Direct Message'}
                </h3>
                {chatInfo.type === 'group' && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                    <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{participantCount} members</span>
                  </div>
                )}
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 p-4 md:p-6 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 md:pr-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent dark:scrollbar-thumb-slate-600">
                {messages.map((msg, idx) => {
                  const isMine = user && msg.sender._id === user._id;
                  const sender = msg.sender as any;
                  const displayName = sender?.username || sender?.email?.split('@')[0] || sender?.email || 'User';
                  const avatarUrl = sender.avatar || '';
                  const isOnline = !!sender.isOnline;
                  
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showAvatar = !prevMsg || prevMsg.sender._id !== msg.sender._id;

                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-shrink-0 relative" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                          {avatarUrl ? (
                            <img 
                              src={avatarUrl} 
                              alt={displayName} 
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-500/30" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/20">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          {showAvatar && (
                            <div className={`text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-2 ${isMine ? 'justify-end mr-2' : 'ml-2'}`}>
                              <span className="text-slate-700 dark:text-slate-300">{displayName}</span>
                              {isOnline && (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                  <span className="text-[10px]">Online</span>
                                </span>
                              )}
                            </div>
                          )}
                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              isMine
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 text-slate-900 border border-slate-200 dark:bg-slate-700/70 dark:text-slate-100 dark:border-slate-600/50'
                            }`}
                          >
                            <div className="break-words text-sm leading-relaxed">{msg.content}</div>
                            <div className={`text-[11px] mt-2 flex items-center gap-1.5 ${isMine ? 'text-teal-100 justify-end' : 'text-slate-500 dark:text-slate-400'}`}>
                              <Clock className="w-3 h-3" />
                              <span className="font-medium">
                                {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!messages.length && (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <div className="w-20 h-20 mx-auto rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center dark:bg-teal-500/20 dark:border-teal-500/30">
                        <MessageSquare className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <div className="text-xl font-medium text-slate-900 dark:text-slate-200 mb-2">No messages yet</div>
                        <div className="text-sm text-slate-500 max-w-md leading-relaxed">
                          Start the conversation! Send a message to begin chatting with {chatInfo.type === 'group' ? 'the group' : 'your contact'}.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input Area */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <textarea
                      className="w-full resize-none rounded-xl bg-white border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-slate-900 placeholder-slate-400 min-h-[48px] max-h-36 py-3 px-4 text-sm leading-relaxed focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={1}
                      style={{
                        height: 'auto',
                        minHeight: '48px'
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 144) + 'px';
                      }}
                    />
                  </div>
                  <button 
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={handleSend}
                    disabled={!text.trim()}
                    aria-label="Send message"
                    title="Send message"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Member List */}
          {chatInfo.type === 'group' && chatInfo.participants && (
            <aside className="hidden lg:flex flex-col border-l border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/20">
              <div className="h-full flex flex-col">
                <div className="flex-1 p-5 overflow-hidden flex flex-col">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-3 text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20 dark:bg-teal-500/20 dark:border-teal-500/30">
                      <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span>Group Members</span>
                  </h4>
                  <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent dark:scrollbar-thumb-slate-600">
                    <MemberListDM 
                      members={membersWithProfiles || chatInfo.participants
                        .filter((p: Participant) => !!p?.user?._id)
                        .filter((p: Participant, index: number, self: Participant[]) => {
                          const id = p.user!._id as string;
                          return index === self.findIndex((t) => (t.user?._id as string | undefined) === id);
                        })
                        .map((p: Participant) => {
                          const id = p.user!._id as string;
                          const email = (p.user?.email || '').toString();
                          const username = (p.user?.username || (email ? email.split('@')[0] : '') || '').toString();
                          return {
                            id,
                            name: email || username || id,
                            role: p.role,
                            avatar: p.user?.avatar || '',
                            username: username || 'User',
                            isOnline: !!(p.user?.isOnline)
                          };
                        })} 
                    />
                  </div>
                  
                  {/* Report Button - Sticky Footer inside sidebar */}
                  <div className="flex-shrink-0 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full p-3 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 text-red-600 hover:text-red-700 group dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Flag className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Mobile Report Button - fixed for group chats */}
        {chatInfo.type === 'group' && (
          <button
            onClick={() => setShowReportModal(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-colors flex items-center justify-center text-white bg-red-600 hover:bg-red-500"
            aria-label="Report"
            title="Report"
          >
            <Flag className="w-5 h-5" />
          </button>
        )}

        {/* Group Reviews Section - Always show for all group chats */}
        {chatInfo?.type === 'group' && (
          <div className="mt-6 max-w-4xl mx-auto px-0">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm dark:bg-slate-800 dark:border-slate-700">
              {/* Compact Header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 dark:bg-amber-500/20 dark:border-amber-500/30">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-slate-900 dark:text-white">
                    {chatInfo?.groupInfo?.relatedActivity ? 'Activity Reviews' : 'Group Chat Reviews'}
                  </h3>
                  {chatInfo?.groupInfo?.relatedActivity && (
                    <span className="text-xs text-slate-500 ml-auto">ID: {chatInfo.groupInfo.relatedActivity.slice(-8)}</span>
                  )}
                </div>
              </div>
              
              {/* Reviews Content */}
              <div className="p-4">
                <GroupReviews 
                  groupId={chatInfo.groupInfo?.relatedActivity || uid} 
                  currentUserId={user?._id}
                  type={chatInfo?.groupInfo?.relatedActivity ? "activity" : "group"}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="activity"
        targetId={chatInfo?.groupInfo?.relatedActivity || uid}
      />
    </section>
  );
}
