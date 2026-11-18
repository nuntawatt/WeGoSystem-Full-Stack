import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { socket } from '../../lib/socket';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/apiClient';
import MemberListDM from '../../components/MemberListDM';
import GroupReviews from '../../components/GroupReviews';
import ReportModal from '../../components/ReportModal';
import { ArrowLeft, Users, Send, MessageSquare, Flag, Clock, Star } from 'lucide-react';

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
      <section className="min-h-screen bg-[#F3F5F4]">
        <div className="container-app py-10 md:py-14">
          <div className="mx-auto w-full max-w-4xl">
            <div className="card p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-[#147D70] border-t-transparent animate-spin mx-auto" />
              <div className="text-sm font-bold text-[#202124]">Loading conversation…</div>
              <div className="text-xs text-[#858B89]">Connecting to secure chat channel</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="min-h-[60vh] py-12 bg-[#F3F5F4]">
        <div className="container-app max-w-md mx-auto">
          <div className="card p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-bold text-[#202124]">Cannot Load Conversation</div>
              <div className="mt-1 text-xs text-[#858B89]">{loadError}</div>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setRefreshNonce((v) => v + 1)}
                className="btn-primary text-xs"
              >
                Retry
              </button>
              <Link to="/explore" className="btn-secondary text-xs">
                Back to Explore
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!chatInfo) {
    return (
      <section className="min-h-[60vh] py-12 bg-[#F3F5F4]">
        <div className="container-app max-w-md mx-auto">
          <div className="card p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E0F3F1] text-[#147D70] flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-bold text-[#202124]">Chat Room Not Found</div>
              <div className="mt-1 text-xs text-[#858B89]">This conversation might be archived or you may lack access.</div>
            </div>
            <div className="pt-2">
              <Link to="/explore" className="btn-primary text-xs">
                Back to Explorer
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#F3F5F4]">
      <div className="container-app py-6 md:py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 overflow-hidden card lg:grid-cols-[minmax(0,1fr),20rem]">
          {/* Chat Section */}
          <div className="flex min-h-[70vh] flex-col bg-white lg:min-h-[calc(100vh-220px)]">
            {/* Chat Header */}
            <header className="sticky top-0 z-10 px-5 py-4 flex items-center gap-4 border-b border-[#E8EBE9] bg-white/95 backdrop-blur-sm">
              <button 
                onClick={() => navigate(-1)} 
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-[#147D70]" />
                <span>Back</span>
              </button>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#202124]">
                  {chatInfo.type === 'group' 
                    ? (chatInfo.groupInfo?.relatedActivityDetails?.title || chatInfo.groupInfo?.name || 'Group Workspace Chat') 
                    : 'Direct Conversation'}
                </h3>
                {chatInfo.type === 'group' && (
                  <div className="text-xs text-[#858B89] flex items-center gap-1.5 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-[#147D70]" />
                    <span>{participantCount} active members</span>
                  </div>
                )}
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 p-4 md:p-6 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 thin-scrollbar">
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
                              className="w-8 h-8 rounded-xl object-cover ring-2 ring-[#E0F3F1]" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-[#147D70] flex items-center justify-center text-white font-bold text-xs">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          {showAvatar && (
                            <div className={`text-[11px] font-semibold text-[#858B89] mb-1 flex items-center gap-1.5 ${isMine ? 'justify-end mr-1' : 'ml-1'}`}>
                              <span className="text-[#202124]">{displayName}</span>
                              {isOnline && (
                                <span className="flex items-center gap-1 text-[#147D70]">
                                  <span className="w-1.5 h-1.5 bg-[#147D70] rounded-full animate-pulse" />
                                  <span className="text-[10px]">Online</span>
                                </span>
                              )}
                            </div>
                          )}
                          <div
                            className={`px-4 py-2.5 rounded-2xl ${
                              isMine
                                ? 'bg-[#147D70] text-white rounded-br-xs shadow-xs'
                                : 'bg-[#F3F5F4] text-[#202124] border border-[#E8EBE9] rounded-bl-xs'
                            }`}
                          >
                            <div className="break-words text-xs leading-relaxed">{msg.content}</div>
                            <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${isMine ? 'text-teal-100 justify-end' : 'text-[#858B89]'}`}>
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
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
                    <div className="text-center space-y-3 p-8">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E0F3F1] text-[#147D70] flex items-center justify-center">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-[#202124] mb-1">No messages recorded</div>
                        <div className="text-xs text-[#858B89] max-w-sm mx-auto leading-relaxed">
                          Start the session conversation! Send a message to coordinate with {chatInfo.type === 'group' ? 'group members' : 'your partner'}.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input Area */}
              <div className="mt-4 pt-3.5 border-t border-[#E8EBE9]">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <textarea
                      className="input min-h-[44px] max-h-32 text-xs py-2.5 resize-none"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type a message to the room..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={1}
                    />
                  </div>
                  <button 
                    onClick={handleSend}
                    disabled={!text.trim()}
                    className="btn-primary w-11 h-11 p-0 flex items-center justify-center rounded-xl"
                  >
                    <Send className="w-4 h-4 text-[#D9F36A]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Member List */}
          {chatInfo.type === 'group' && chatInfo.participants && (
            <aside className="hidden lg:flex flex-col border-l border-[#E8EBE9] bg-[#F3F5F4]/60 w-80">
              <div className="h-full flex flex-col">
                <div className="flex-1 p-5 overflow-hidden flex flex-col">
                  <h4 className="font-bold text-base mb-4 flex items-center gap-2 text-[#202124] pb-3 border-b border-[#E8EBE9] flex-shrink-0">
                    <div className="p-2 bg-[#EAF5D5] rounded-xl text-[#147D70]">
                      <Users className="w-4 h-4" />
                    </div>
                    <span>Group Members</span>
                  </h4>
                  <div className="flex-1 overflow-y-auto pb-4">
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
                  
                  {/* Report Button */}
                  <div className="flex-shrink-0 pt-4 border-t border-[#E8EBE9]">
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full py-2.5 px-3 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-2 text-red-600 font-semibold text-xs group"
                    >
                      <Flag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span>Report Activity</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Mobile Report Button */}
        {chatInfo.type === 'group' && (
          <button
            onClick={() => setShowReportModal(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 p-3.5 rounded-full shadow-lg transition-colors flex items-center justify-center text-white bg-red-600 hover:bg-red-700"
            aria-label="Report"
            title="Report"
          >
            <Flag className="w-5 h-5" />
          </button>
        )}

        {/* Group Reviews Section */}
        {chatInfo?.type === 'group' && (
          <div className="mt-8 max-w-5xl mx-auto px-0">
            <div className="bg-white border border-[#E8EBE9] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-[#F3F5F4] border-b border-[#E8EBE9] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#EAF5D5] rounded-lg text-[#147D70]">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  </div>
                  <h3 className="text-base font-bold text-[#202124]">
                    {chatInfo?.groupInfo?.relatedActivity ? 'Activity Reviews' : 'Group Reviews'}
                  </h3>
                </div>
                {chatInfo?.groupInfo?.relatedActivity && (
                  <span className="text-xs text-[#858B89] font-mono">
                    ID: {chatInfo.groupInfo.relatedActivity.slice(-8)}
                  </span>
                )}
              </div>
              
              <div className="p-6">
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
