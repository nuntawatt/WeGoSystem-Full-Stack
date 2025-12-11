// Socket.io chat (client-only demo)
import { useEffect, useRef, useState } from 'react';
import { socket } from '../lib/socket';
import { showInfo } from '../lib/swal';
import { MessageSquare, Send, Eye } from 'lucide-react';

type ChatMsg = { id: string; text: string; user: string; at: number; readBy: string[] };

export default function ChatPanel({ groupId }: { groupId: string }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit('joinGroup', groupId);
    socket.on('chatMessage', (m: ChatMsg) => setMsgs((s) => [...s, m]));
    socket.on('typing', (u: string) => {
      setTyping(u);
      setTimeout(() => setTyping(null), 1200);
    });
    socket.on('messageRead', (payload: { messageId: string; userId: string }) => {
      setMsgs((s) =>
        s.map((m) =>
          m.id === payload.messageId && !m.readBy.includes(payload.userId)
            ? { ...m, readBy: [...m.readBy, payload.userId] }
            : m
        )
      );
    });

    return () => {
      socket.off('chatMessage');
      socket.off('typing');
      socket.off('messageRead');
      socket.emit('leaveGroup', groupId);
    };
  }, [groupId]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [msgs.length]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const payload: ChatMsg = {
      id: crypto.randomUUID(),
      text,
      user: 'me',
      at: Date.now(),
      readBy: ['me']
    };

    socket.emit('chatMessage', { groupId, message: payload });
    setMsgs((s) => [...s, payload]);
    setInput('');
    showInfo('ส่งข้อความสำเร็จ!', 'Message sent');
  };

  return (
    <div className="p-5 h-[480px] flex flex-col rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
        <div className="w-9 h-9 rounded-sm bg-teal-700 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-slate-800 dark:text-slate-100" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Group Chat</span>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
          Live
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {msgs.map((m) => (
          <div key={m.id} className={`max-w-[80%] ${m.user === 'me' ? 'ml-auto' : ''}`}>
            <div className={`rounded-sm px-4 py-3 ${
              m.user === 'me' 
                ? 'bg-teal-700 text-white text-right' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
            }`}>
              <div>{m.text}</div>
              <div className={`text-[10px] mt-1 flex items-center gap-2 justify-end ${
                m.user === 'me' ? 'text-teal-200' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {new Date(m.at).toLocaleTimeString()} 
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {m.readBy.length}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Typing indicator */}
      {typing && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </span>
          {typing} is typing…
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex gap-3">
        <input
          className="flex-1 px-4 py-3 rounded-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none transition-all"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            socket.emit('typing', groupId);
          }}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button 
          onClick={send} 
          className="px-5 py-3 rounded-sm bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}