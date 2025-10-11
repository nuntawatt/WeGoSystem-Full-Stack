import { useEffect, useMemo, useRef, useState } from 'react';
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
        const chatData = response.data.chat || response.data; // Support both formats
        console.log('📥 Chat data received:', chatData);
        console.log('👥 Participants:', chatData.participants);
        console.log('💬 Messages count:', chatData.messages?.length || 0);
        setChatInfo(chatData);
        setMessages(chatData.messages || []);

        // Fetch profiles for participants to get avatars/usernames
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
            // Remove duplicates
            .filter((p: Participant, index: number, self: Participant[]) => index === self.findIndex((t) => t.user._id === p.user._id))
            .map((p: Participant) => {
              const pid = p.user._id;
              const prof = profilesById[pid] || {};
              return {
                id: pid,
                name: p.user.email,
                role: p.role,
                avatar: prof.avatar || '',
                username: p.user.username || prof.name || p.user.email.split('@')[0]
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

  // Socket.io connection for real-time messages
  useEffect(() => {
    if (!uid || !user) return;

    if (!socket.connected) socket.connect();

    console.log('🔌 Connecting to chat:', uid);
    
    // Join chat room
    socket.emit('user:join', user._id);
    socket.emit('chat:join', uid);

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      console.log('📨 New message received:', message);
      setMessages((prev) => [...prev, message]);
    };

    // Listen for errors
    const handleError = (error: any) => {
      console.error('❌ Socket error:', error);
    };

    socket.on('message:receive', handleNewMessage);
    socket.on('error', handleError);

    return () => {
      console.log('🔌 Disconnecting from chat:', uid);
      socket.off('message:receive', handleNewMessage);
      socket.off('error', handleError);
      socket.emit('chat:leave', uid);
    };
  }, [uid, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const content = text.trim();
    if (!content || !user) return;

    console.log('📤 Sending message:', {
      chatId: uid,
      userId: user._id,
      content: content
    });

    // Clear input first
    setText('');

    // Send via socket (will receive back via message:receive)
    socket.emit('message:send', {
      chatId: uid,
      userId: user._id,
      content: content
    });
  };

  if (isLoading) {
    return (
      <section className="container-app py-8">
        <div className="card p-6">
          <div className="text-lg">กำลังโหลด...</div>
        </div>
      </section>
    );
  }

  if (!chatInfo) {
    return (
      <section className="container-app py-8">
        <div className="card p-6 space-y-3">
          <div className="text-lg font-semibold">ไม่พบห้องแชท</div>
          <Link to="/explore" className="btn-primary w-fit">กลับไป Explore</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-app py-6">
      <div className="flex gap-4">
        {/* Chat Section */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <header className="card p-4 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn-ghost px-3 py-2">
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {chatInfo.type === 'group' ? chatInfo.name : 'แชท'}
              </h3>
              {chatInfo.type === 'group' && (
                <div className="text-sm opacity-70 flex items-center gap-2 mt-1">
                  <i className="fas fa-users text-xs"></i>
                  <span>{chatInfo.participants?.length || 0} สมาชิก</span>
                </div>
              )}
            </div>
          </header>

          {/* Chat Messages */}
          <div className="card p-4 h-[calc(100vh-240px)] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-3 thin-scrollbar pr-2">
              {messages.map((msg) => {
                const isMine = user && msg.sender._id === user._id;
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isMine ? '' : 'flex gap-2'}`}>
                      {!isMine && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center text-black font-semibold text-sm">
                            {msg.sender.email.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}
                      <div>
                        {!isMine && (
                          <div className="text-xs opacity-70 mb-1 ml-1">{msg.sender.email}</div>
                        )}
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-md ${
                            isMine
                              ? 'bg-gradient-to-br from-brand-gold to-amber-600 text-black rounded-br-sm'
                              : 'bg-white/10 text-white rounded-bl-sm'
                          }`}
                        >
                          <div className="break-words">{msg.content}</div>
                          <div className={`text-[10px] mt-1 ${isMine ? 'text-black/60' : 'text-white/50'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!messages.length && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center space-y-2 opacity-60">
                    <i className="fas fa-comments text-4xl"></i>
                    <div className="text-sm">ยังไม่มีข้อความในกลุ่ม</div>
                    <div className="text-xs">เริ่มต้นการสนทนากันเลย!</div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="mt-4 flex gap-2">
              <input
                className="input flex-1"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <button 
                className="btn-primary px-6" 
                onClick={handleSend}
                disabled={!text.trim()}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Member List - only for group chats */}
        {chatInfo.type === 'group' && chatInfo.participants && (
          <div className="w-72 hidden lg:block">
            <div className="card p-4 sticky top-6">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <i className="fas fa-users"></i>
                สมาชิกกลุ่ม
              </h4>
              <MemberListDM 
                members={membersWithProfiles || chatInfo.participants
                  // Remove duplicates based on user._id
                  .filter((p: Participant, index: number, self: Participant[]) => 
                    index === self.findIndex((t) => t.user._id === p.user._id)
                  )
                  .map((p: Participant) => ({
                    id: p.user._id,
                    name: p.user.email,
                    role: p.role
                  }))} 
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
