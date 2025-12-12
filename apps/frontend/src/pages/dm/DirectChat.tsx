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
    email: string;
    username?: string;
    avatar?: string;
    isOnline?: boolean;
  };
  content: string;
  createdAt: string;
};

type Participant = {
  user: {
    _id: string;
    email: string;
    username?: string;
    avatar?: string;
    isOnline?: boolean;
  };
  role: string;
};

export default function DirectChat() {
  const { uid = '' } = useParams<{ uid: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [membersWithProfiles, setMembersWithProfiles] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        const response = await api.get(`/chats/${uid}`);
        const chatData = response.data.chat || response.data;
        console.log('📥 Chat data received:', chatData);
        setChatInfo(chatData);
        setMessages(chatData.messages || []);

        // Fetch profiles for participants
        try {
          const participantIds = chatData.participants
            .map((p: Participant) => p.user._id)
            .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

          const profileReqs = participantIds.map((id: string) => api.get(`/profiles/${id}`).catch(() => null));
          const profiles = await Promise.all(profileReqs);

          const profilesById: Record<string, any> = {};
          profiles.forEach((res: any, idx: number) => {
            if (!res || !res.data) return;
            const p = res.data;
            const key = p.userId || p._id || participantIds[idx];
            profilesById[key] = p;
          });

          const members = chatData.participants
            .filter((p: Participant) => p.user) // Add null check
            .filter((p: Participant, index: number, self: Participant[]) => 
              index === self.findIndex((t) => t.user && t.user._id === p.user._id)
            )
            .map((p: Participant) => {
              const pid = p.user._id;
              const prof = profilesById[pid] || {};
              return {
                id: pid,
                name: p.user.email,
                role: p.role,
                avatar: prof.avatar || '',
                username: p.user.username || prof.name || p.user.email.split('@')[0],
                isOnline: p.user.isOnline || false,
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
      } finally {
        setIsLoading(false);
      }
    };

    if (uid && user) {
      fetchChat();
    }
  }, [uid, user]);

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
        .map((p) => ({
          id: String(p.id),
          name: p.email || p.username || p.id,
          role: p.role || 'member',
          avatar: p.avatar || '',
          username: p.username || p.email?.split('@')[0] || p.id,
          isOnline: !!p.isOnline,
          bio: p.bio || '',
          createdAt: p.createdAt || new Date().toISOString()
        }));

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
    const ids = chatInfo.participants
      .filter((p: Participant) => p.user)
      .map((p: Participant) => p.user._id);
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
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: {
        _id: user._id,
        email: user.email,
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

  if (isLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="bg-slate-800/80 backdrop-blur-sm p-8 border border-slate-700/50 rounded-2xl text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-600/20 border border-teal-500/30 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-teal-400 animate-pulse" />
          </div>
          <div className="text-lg text-slate-200">Loading conversation...</div>
        </div>
      </section>
    );
  }

  if (!chatInfo) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="bg-slate-800/80 backdrop-blur-sm p-8 space-y-4 border border-slate-700/50 rounded-2xl text-center max-w-md shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-slate-600/50 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-slate-500" />
          </div>
          <div className="text-lg font-medium text-white">Chat room not found</div>
          <Link to="/explore" className="inline-flex px-6 py-3 font-medium text-white rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 transition-all shadow-lg shadow-teal-500/20">
            Back to Explore
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container-app py-6">
        <div className="flex gap-0 max-w-7xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-slate-700/50">
          {/* Chat Section */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-800/80 to-slate-900/90 backdrop-blur-sm">
            {/* Chat Header */}
            <header className="px-6 py-4 flex items-center gap-4 border-b border-slate-700/50 bg-slate-800/50">
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 transition-all duration-200 group"
              >
                <ArrowLeft className="w-5 h-5 text-slate-300 group-hover:text-teal-400 transition-colors" />
                <span className="font-medium text-slate-200 group-hover:text-white">Back</span>
              </button>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {chatInfo.type === 'group' 
                    ? (chatInfo.groupInfo?.relatedActivityDetails?.title || chatInfo.groupInfo?.name || 'Group Chat') 
                    : 'Direct Message'}
                </h3>
                {chatInfo.type === 'group' && (
                  <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                    <Users className="w-4 h-4 text-teal-400" />
                    <span>{participantCount} members</span>
                  </div>
                )}
              </div>
            </header>

            {/* Messages Card */}
            <div className="flex-1 p-6 flex flex-col min-h-[calc(100vh-200px)]">
              <div className="flex-1 overflow-y-auto space-y-4 pr-3 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                {(() => { console.log('🎨 Rendering messages, count:', messages.length); return null; })()}
                {messages.map((msg, idx) => {
                  const isMine = user && msg.sender._id === user._id;
                  const sender = msg.sender as any;
                  const displayName = sender.username || sender.email?.split('@')[0] || sender.email;
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
                            <div className={`text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-2 ${isMine ? 'justify-end mr-2' : 'ml-2'}`}>
                              <span className="text-slate-300">{displayName}</span>
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
                                ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/20'
                                : 'bg-slate-700/80 text-slate-100 border border-slate-600/50'
                            }`}
                          >
                            <div className="break-words text-sm leading-relaxed">{msg.content}</div>
                            <div className={`text-[11px] mt-2 flex items-center gap-1.5 ${isMine ? 'text-teal-200/80 justify-end' : 'text-slate-500'}`}>
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
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-600/20 border border-teal-500/30 flex items-center justify-center">
                        <MessageSquare className="w-10 h-10 text-teal-400" />
                      </div>
                      <div>
                        <div className="text-xl font-medium text-slate-200 mb-2">No messages yet</div>
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
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <textarea
                      className="w-full resize-none rounded-xl bg-slate-700/50 border border-slate-600/50 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-white placeholder-slate-500 min-h-[48px] max-h-36 py-3 px-4 text-sm leading-relaxed focus:outline-none"
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
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-105"
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
            <div className="w-80 hidden lg:block bg-transparent">
              <div className="h-full flex flex-col">
                {/* Members Card - Scrollable */}
                <div className="flex-1 p-5 overflow-hidden flex flex-col">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-3 text-white pb-3 border-b border-slate-700/50 flex-shrink-0" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    <div className="p-2 bg-gradient-to-br from-teal-500/20 to-emerald-600/20 rounded-xl border border-teal-500/30">
                      <Users className="w-5 h-5 text-teal-400" />
                    </div>
                    <span>Group Members</span>
                  </h4>
                  <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    <MemberListDM 
                      members={membersWithProfiles || chatInfo.participants
                        .filter((p: Participant) => p.user) // Add null check
                        .filter((p: Participant, index: number, self: Participant[]) => 
                          index === self.findIndex((t) => t.user && t.user._id === p.user._id)
                        )
                        .map((p: Participant) => ({
                          id: p.user._id,
                          name: p.user.email,
                          role: p.role,
                          avatar: '',
                          username: p.user.username || p.user.email.split('@')[0],
                          isOnline: p.user.isOnline || false
                        }))} 
                    />
                  </div>
                  
                  {/* Report Button - Sticky Footer inside sidebar */}
                  <div className="flex-shrink-0 pt-4 border-t border-slate-700/50">
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full p-3 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all flex items-center justify-center gap-2 text-red-400 hover:text-red-300 group"
                    >
                      <Flag className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">Report</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Report Button - Fixed at bottom-right on small screens */}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="lg:hidden fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-full shadow-lg shadow-red-500/30 transition-all flex items-center justify-center text-white hover:scale-110"
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Group Reviews Section - Always show for all group chats */}
        {chatInfo?.type === 'group' && (
          <div className="mt-6 max-w-3xl mx-auto px-4">
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
              {/* Compact Header */}
              <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-lg border border-amber-500/30">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-white">
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
