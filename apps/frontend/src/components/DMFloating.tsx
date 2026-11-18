// apps/frontend/src/components/DMFloating.tsx
import { useEffect, useRef, useState } from 'react';
import { useDM } from '../hooks/useDM';
import { X, Send, MessageCircle } from 'lucide-react';

export default function DMFloating() {
  const { isOpen, openPeer, closeDM, getMsgs, sendTo, meUid } = useDM();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgs = isOpen && openPeer ? getMsgs(openPeer.uid) : [];

  useEffect(() => {
    if (isOpen && openPeer) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [msgs, isOpen, openPeer]);

  if (!isOpen || !openPeer) return null;

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    sendTo(openPeer.uid, t);
    setText('');
  };

  return (
    <div className="fixed bottom-6 right-6 w-88 sm:w-96 z-50 animate-slide-up">
      <div className="flex flex-col h-[520px] rounded-2xl shadow-2xl overflow-hidden border border-[#E8EBE9] bg-white">
        {/* Header with Dark Charcoal styling */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#202124] text-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              {openPeer.avatar ? (
                <img
                  src={openPeer.avatar}
                  alt={openPeer.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#147D70] flex items-center justify-center text-white font-bold text-base border-2 border-white/20">
                  {openPeer.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Online status indicator */}
              {openPeer.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#D9F36A] rounded-full border-2 border-[#202124]"></span>
              )}
            </div>
            <div>
              <div className="font-bold text-white text-sm">{openPeer.name}</div>
              {openPeer.isOnline ? (
                <div className="text-[11px] text-[#D9F36A] flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-[#D9F36A] rounded-full"></span>
                  <span>Active Now</span>
                </div>
              ) : (
                <div className="text-[11px] text-[#858B89] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#858B89] rounded-full"></span>
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={closeDM}
            className="w-8 h-8 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center justify-center"
            aria-label="Close"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F3F5F4]">
          {msgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF5D5] text-[#147D70] flex items-center justify-center">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#202124]">Direct Message</h4>
                <p className="text-xs text-[#858B89] mt-1">Start chatting with {openPeer.name}</p>
              </div>
            </div>
          ) : (
            <>
              {msgs.map((m, i) => {
                const mine = (typeof m.from === 'object' ? m.from._id : m.from) === meUid;
                const fromUser = typeof m.from === 'object' ? m.from : null;
                const displayAvatar = !mine && fromUser ? fromUser.avatar : openPeer.avatar;
                const displayName = !mine && fromUser ? fromUser.username : openPeer.name;

                return (
                  <div key={m._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${mine ? '' : 'flex gap-2'}`}>
                      {!mine && (
                        <div className="flex-shrink-0 mt-0.5">
                          {displayAvatar ? (
                            <img src={displayAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-[#E8EBE9]" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#147D70] flex items-center justify-center text-white font-bold text-xs">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            mine
                              ? 'bg-[#147D70] text-white rounded-tr-xs shadow-xs'
                              : 'bg-white text-[#202124] border border-[#E8EBE9] rounded-tl-xs shadow-xs'
                          }`}
                        >
                          <div className="break-words">{m.text}</div>
                        </div>
                        <div className={`text-[10px] text-[#858B89] mt-1 px-1 ${mine ? 'text-right' : 'text-left'}`}>
                          {new Date(m.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white border-t border-[#E8EBE9]">
          <div className="flex gap-2 items-center">
            <textarea
              className="flex-1 px-3.5 py-2.5 text-sm bg-[#F3F5F4] border border-[#E8EBE9] focus:border-[#147D70] focus:ring-2 focus:ring-[#147D70]/20 rounded-xl text-[#202124] placeholder-[#858B89] transition-all resize-none focus:outline-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              style={{
                minHeight: '40px',
                maxHeight: '100px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              className="p-2.5 rounded-xl bg-[#147D70] hover:bg-[#11665C] text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-xs flex-shrink-0"
              onClick={handleSend}
              disabled={!text.trim()}
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
