// apps/frontend/src/components/DMFloating.tsx
import { useEffect, useRef, useState } from 'react';
import { useDM } from '../hooks/useDM';

export default function DMFloating() {
  const { isOpen, openPeer, closeDM, getMsgs, sendTo, meUid } = useDM();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages before early return
  const msgs = isOpen && openPeer ? getMsgs(openPeer.uid) : [];
  
  console.log(`🎨 DMFloating render: isOpen=${isOpen}, openPeer=${openPeer?.uid}, msgs.length=${msgs.length}`);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && openPeer) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [msgs, isOpen, openPeer]);

  // Early return after all hooks
  if (!isOpen || !openPeer) return null;

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    sendTo(openPeer.uid, t);
    setText('');
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 z-50 animate-slide-in-right">
      <div className="flex flex-col h-[600px] rounded-2xl shadow-2xl overflow-hidden border-2 border-amber-500/30 bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-md border-b-2 border-amber-500/20 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              {openPeer.avatar ? (
                <img
                  src={openPeer.avatar}
                  alt={openPeer.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/50 shadow-lg"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-amber-400/50 shadow-lg">
                  {openPeer.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Status indicator - show only if online */}
              {openPeer.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full ring-2 ring-slate-800 shadow-lg"></span>
              )}
            </div>
            <div>
              <div className="font-bold text-white text-base">{openPeer.name}</div>
              {openPeer.isOnline ? (
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <span>Active now</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={closeDM}
            className="w-8 h-8 rounded-lg hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-all duration-300 flex items-center justify-center group"
            aria-label="Close"
            title="Close"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-900/40 to-slate-900/60 thin-scrollbar">
          {msgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="relative">
                <div className="text-6xl animate-bounce-subtle">💬</div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✨</span>
                </div>
              </div>
              <div>
                <div className="text-slate-300 font-semibold mb-1">Start a conversation</div>
                <div className="text-slate-500 text-sm">Send a message to {openPeer.name}</div>
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
                  <div key={m._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[75%] ${mine ? '' : 'flex gap-2'}`}>
                      {!mine && (
                        <div className="flex-shrink-0">
                          {displayAvatar ? (
                            <img src={displayAvatar} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/30" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <div
                          className={`px-4 py-2.5 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                            mine
                              ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-br-md'
                              : 'bg-gradient-to-br from-slate-700 to-slate-600 text-white rounded-bl-md border border-slate-500/30'
                          }`}
                        >
                          <div className="break-words text-sm leading-relaxed">{m.text}</div>
                        </div>
                        <div className={`text-[10px] text-slate-500 mt-1 px-1 ${mine ? 'text-right' : 'text-left'}`}>
                          {new Date(m.createdAt).toLocaleTimeString('th-TH', {
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

        {/* Input Area */}
        <div className="p-4 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-md border-t-2 border-amber-500/20">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
                </svg>
              </div>
              <textarea
                className="w-full pl-12 pr-4 py-3 text-sm bg-slate-700/60 border-2 border-slate-600/50 focus:border-amber-400/70 focus:ring-4 focus:ring-amber-400/20 rounded-xl text-white placeholder-slate-400 transition-all duration-300 resize-none hover:bg-slate-700/70 shadow-inner"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="พิมพ์ข้อความ…"
                rows={1}
                style={{
                  minHeight: '44px',
                  maxHeight: '120px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>
            <button 
              className="px-5 py-3 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 text-white font-semibold shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              onClick={handleSend}
              disabled={!text.trim()}
              title="Send message (Enter)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
