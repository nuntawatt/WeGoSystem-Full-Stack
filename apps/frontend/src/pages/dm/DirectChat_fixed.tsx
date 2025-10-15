import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { socket } from '../../lib/socket';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/apiClient';
import MemberListDM from '../../components/MemberListDM';

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
  const endRef = useRef<HTMLDivElement | null>(null);

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
            .filter((p: Participant, index: number, self: Participant[]) => 
              index === self.findIndex((t) => t.user._id === p.user._id)
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
                isOnline: p.user.isOnline || false
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

    if (!socket.connected) socket.connect();

    socket.emit('user:join', user._id);
    socket.emit('chat:join', uid);

    const handleNewMessage = (message: Message) => {
      console.log('📥 Received new message:', message);
      setMessages((prev) => [...prev, message]);
    };

    const handleUserStatus = (payload: { userId: string; isOnline: boolean }) => {
      console.log('👤 User status changed:', payload);
      setMembersWithProfiles((prev) => {
        if (!prev) return prev;
        return prev.map((m) => (m.id === payload.userId ? { ...m, isOnline: payload.isOnline } : m));
      });
    };

    const handleError = (error: any) => {
      console.error('❌ Socket error:', error);
    };

    socket.on('message:receive', handleNewMessage);
    socket.on('error', handleError);
    socket.on('userStatusChanged', handleUserStatus);

    return () => {
      socket.off('message:receive', handleNewMessage);
      socket.off('error', handleError);
      socket.off('userStatusChanged', handleUserStatus);
      socket.emit('chat:leave', uid);
    };
  }, [uid, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const content = text.trim();
    if (!content || !user) {
      console.log('⚠️ Cannot send: empty content or no user', { content, user: !!user });
      return;
    }

    console.log('📤 Sending message:', { chatId: uid, userId: user._id, content });
    setText('');

    socket.emit('message:send', {
      chatId: uid,
      userId: user._id,
      content: content
    });
  };

  if (isLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center py-4">
        <div className="card p-8 border border-white/10 text-center">
          <div className="text-6xl mb-4 animate-pulse-subtle">💬</div>
          <div className="text-lg">Loading conversation...</div>
        </div>
      </section>
    );
  }

  if (!chatInfo) {
    return (
      <section className="min-h-screen flex items-center justify-center py-4">
        <div className="card p-8 space-y-4 border border-white/10 text-center max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-lg font-semibold">Chat room not found</div>
          <Link to="/explore" className="inline-flex px-6 py-3 font-semibold text-white rounded-lg bg-amber-500 hover:bg-amber-400 transition-all duration-300">
            🔍 Back to Explore
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen py-8">
      <div className="container-app">
        <div className="flex gap-6 max-w-7xl mx-auto">
          {/* Chat Section */}
          <div className="flex-1 space-y-4">
            {/* Chat Header */}
            <header className="card p-5 flex items-center gap-4 border border-amber-500/20 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm shadow-xl">
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold">Back</span>
              </button>
              <div className="flex-1">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
                  {chatInfo.type === 'group' ? `${chatInfo.groupInfo?.name || 'Group Chat'}` : '💬 Direct Message'}
                </h3>
                {chatInfo.type === 'group' && (
                  <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span>{chatInfo.participants?.length || 0} members</span>
                  </div>
                )}
              </div>
            </header>

            {/* Messages Card */}
            <div className="card p-8 h-[calc(100vh-280px)] flex flex-col border border-amber-500/20 bg-gradient-to-b from-slate-800/60 via-slate-850/60 to-slate-900/60 backdrop-blur-lg shadow-2xl">
              <div className="flex-1 overflow-y-auto space-y-5 thin-scrollbar pr-3">
                {messages.map((msg, idx) => {
                  const isMine = user && msg.sender._id === user._id;
                  const sender = msg.sender as any;
                  const displayName = sender.username || sender.email?.split('@')[0] || sender.email;
                  const avatarUrl = sender.avatar || '';
                  const isOnline = !!sender.isOnline;
                  
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showAvatar = !prevMsg || prevMsg.sender._id !== msg.sender._id;

                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
                      <div className={`max-w-[70%] flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-shrink-0 relative" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                          {avatarUrl ? (
                            <img 
                              src={avatarUrl} 
                              alt={displayName} 
                              className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400/40 shadow-xl hover:ring-amber-400/60 transition-all duration-300" 
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-xl ring-2 ring-amber-400/40">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          {showAvatar && (
                            <div className={`text-xs font-bold text-amber-400 mb-2 flex items-center gap-2 ${isMine ? 'justify-end mr-2' : 'ml-2'}`}>
                              <span>{displayName}</span>
                              {isOnline && (
                                <span className="flex items-center gap-1 text-green-400">
                                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                  <span className="text-[10px]">Online</span>
                                </span>
                              )}
                            </div>
                          )}
                          <div
                            className={`px-5 py-3.5 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                              isMine
                                ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-br-sm ml-auto'
                                : 'bg-gradient-to-br from-slate-700/90 to-slate-600/90 text-white rounded-bl-sm backdrop-blur-md border border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="break-words text-[15px] leading-relaxed">{msg.content}</div>
                            <div className={`text-[11px] mt-2 flex items-center gap-1.5 ${isMine ? 'text-white/90 justify-end' : 'text-slate-300/80'}`}>
                              <svg className="w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">
                                {new Date(msg.createdAt).toLocaleTimeString('th-TH', {
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
                    <div className="text-center space-y-6 p-8">
                      <div className="relative inline-block">
                        <div className="text-8xl animate-pulse-subtle">💬</div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center animate-bounce">
                          <span className="text-white text-lg">✨</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-100 mb-2">No messages yet</div>
                        <div className="text-base text-slate-400 max-w-md leading-relaxed">
                          Start the conversation! Send a message to begin chatting with {chatInfo.type === 'group' ? 'the group' : 'your friend'}.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input Area */}
              <div className="mt-6 pt-6 border-t border-amber-500/20">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 relative">
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <textarea
                        className="w-full resize-none rounded-2xl bg-slate-700/40 border-2 border-slate-600/50 focus:border-amber-400/60 focus:ring-4 focus:ring-amber-400/20 hover:bg-slate-700/50 transition-all duration-300 text-white placeholder-slate-400 min-h-[56px] max-h-36 py-4 pl-14 pr-5 text-[15px] leading-relaxed shadow-inner"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="พิมพ์ข้อความ..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        rows={1}
                        style={{
                          height: 'auto',
                          minHeight: '56px'
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = Math.min(target.scrollHeight, 144) + 'px';
                        }}
                      />
                    </div>
                  </div>
                  <button 
                    className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-110 active:scale-95 transition-all duration-300 disabled:transform-none relative group"
                    onClick={handleSend}
                    disabled={!text.trim()}
                    aria-label="ส่งข้อความ"
                    title="ส่งข้อความ"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 text-white group-hover:translate-x-0.5 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Member List */}
          {chatInfo.type === 'group' && chatInfo.participants && (
            <div className="w-80 hidden lg:block">
              <div className="card p-6 sticky top-6 border border-amber-500/20 bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-lg shadow-2xl">
                <h4 className="font-bold text-xl mb-5 flex items-center gap-3 text-amber-400 pb-4 border-b border-amber-500/20">
                  <div className="p-2 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <span>Group Members</span>
                </h4>
                <MemberListDM 
                  members={membersWithProfiles || chatInfo.participants
                    .filter((p: Participant, index: number, self: Participant[]) => 
                      index === self.findIndex((t) => t.user._id === p.user._id)
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
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
