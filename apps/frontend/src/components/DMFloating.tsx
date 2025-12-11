// apps/frontend/src/components/DMFloating.tsx
import { useEffect, useRef, useState } from 'react';
import { useDM } from '../hooks/useDM';
import { X, Send, MessageCircle } from 'lucide-react';

export default function DMFloating() {
  const { isOpen, openPeer, closeDM, getMsgs, sendTo, meUid } = useDM();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgs = isOpen && openPeer ? getMsgs(openPeer.uid) : [];
  
  console.log(`DMFloating render: isOpen=${isOpen}, openPeer=${openPeer?.uid}, msgs.length=${msgs.length}`);

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
    <div className="fixed bottom-6 right-6 w-96 z-50">
      <div className="flex flex-col h-[600px] rounded-sm shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="relative">
              {openPeer.avatar ? (
                <img
                  src={openPeer.avatar}
                  alt={openPeer.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-white font-medium text-lg">
                  {openPeer.name.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Status indicator - show only if online */}
              {openPeer.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 rounded-full border-2 border-white dark:border-slate-800"></span>
              )}
            </div>
            <div>
              <div className="font-medium text-slate-800 dark:text-white text-base">{openPeer.name}</div>
              {openPeer.isOnline ? (
                <div className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                  <span>Active now</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={closeDM}
            className="w-8 h-8 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors flex items-center justify-center"
            aria-label="Close"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900">
          {msgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <div className="text-slate-700 dark:text-slate-200 font-medium mb-1">Start a conversation</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm">Send a message to {openPeer.name}</div>
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
                    <div className={`max-w-[75%] ${mine ? '' : 'flex gap-2'}`}>
                      {!mine && (
                        <div className="flex-shrink-0">
                          {displayAvatar ? (
                            <img src={displayAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center text-white font-medium text-xs">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <div
                          className={`px-4 py-2.5 rounded-sm ${
                            mine
                              ? 'bg-teal-700 text-white'
                              : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          <div className="break-words text-sm leading-relaxed">{m.text}</div>
                        </div>
                        <div className={`text-[10px] text-slate-500 dark:text-slate-400 mt-1 px-1 ${mine ? 'text-right' : 'text-left'}`}>
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

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors resize-none focus:outline-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
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
              className="px-4 py-3 rounded-sm bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              onClick={handleSend}
              disabled={!text.trim()}
              title="Send message (Enter)"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
