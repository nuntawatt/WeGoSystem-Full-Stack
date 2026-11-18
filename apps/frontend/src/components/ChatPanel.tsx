import { useEffect, useRef, useState } from 'react';
import { socket } from '../lib/socket';
import { showInfo } from '../lib/swal';
import { MessageSquare, Send, Eye, CheckCheck } from 'lucide-react';

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
  };

  return (
    <div className="card p-5 h-[62vh] min-h-[440px] max-h-[700px] flex flex-col justify-between">
      {/* Chatroom Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#E8EBE9]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E0F3F1] text-[#147D70] flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#202124]">Activity Room Chat</h3>
            <p className="text-[11px] text-[#858B89]">Real-time encrypted session channel</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF5D5] text-[#11665C] border border-[#D9F36A] text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#147D70] animate-pulse" />
          <span>Live Sync</span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 thin-scrollbar">
        {msgs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#858B89] space-y-1">
            <MessageSquare className="w-8 h-8 opacity-40 text-[#147D70]" />
            <p className="text-xs font-semibold text-[#202124]">No messages yet</p>
            <p className="text-[11px]">Send a greeting to start the conversation!</p>
          </div>
        ) : (
          msgs.map((m) => {
            const isMe = m.user === 'me';
            return (
              <div key={m.id} className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-xs ${
                  isMe
                    ? 'bg-[#147D70] text-white rounded-br-xs shadow-xs'
                    : 'bg-[#F3F5F4] text-[#202124] border border-[#E8EBE9] rounded-bl-xs'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#858B89] mt-1 px-1">
                  <span>{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-[#147D70]" />}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Typing Indicator */}
      {typing && (
        <div className="text-[11px] text-[#858B89] py-1 flex items-center gap-1.5">
          <span className="flex gap-0.5">
            <span className="w-1 h-1 bg-[#147D70] rounded-full animate-bounce" />
            <span className="w-1 h-1 bg-[#147D70] rounded-full animate-bounce delay-100" />
            <span className="w-1 h-1 bg-[#147D70] rounded-full animate-bounce delay-200" />
          </span>
          <span>{typing} is typing...</span>
        </div>
      )}

      {/* Input Form */}
      <div className="mt-3 pt-3 border-t border-[#E8EBE9] flex gap-2">
        <input
          className="input flex-1 text-xs py-2.5"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            socket.emit('typing', groupId);
          }}
          placeholder="Write a message to the group..."
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="btn-primary px-4 py-2.5 text-xs flex items-center justify-center"
        >
          <Send className="w-4 h-4 text-[#D9F36A]" />
        </button>
      </div>
    </div>
  );
}
