// apps/frontend/src/components/DMFloating.tsx
import { useState } from 'react';
import { useDM } from '../hooks/useDM';

export default function DMFloating() {
  const { isOpen, openPeer, closeDM, getMsgs, sendTo, meUid } = useDM();
  const [text, setText] = useState('');

  if (!isOpen || !openPeer) return null; // ไม่ต้องแสดงอะไรถ้ายังไม่เปิดแชท

  const msgs = getMsgs(openPeer.uid);

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    sendTo(openPeer.uid, t);
    setText('');
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 text-sm z-40">
      <div className="card h-96 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img
              src={openPeer.avatar}
              alt={openPeer.name}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="font-semibold">{openPeer.name}</span>
          </div>
          <button
            onClick={closeDM}
            className="rounded px-2 py-1 hover:bg-white/10"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {msgs.map((m, i) => {
            const mine = m.from === meUid;
            return (
              <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={[
                    'px-2 py-1 rounded-lg max-w-[75%] break-words',
                    mine ? 'bg-brand-amber/80 text-black' : 'bg-white/10 text-white',
                  ].join(' ')}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          {!msgs.length && (
            <div className="opacity-60 text-center text-xs">เริ่มแชทได้เลย</div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 p-2 border-t border-white/10">
          <input
            className="flex-1 input text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="พิมพ์ข้อความ…"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn-primary px-3 py-1 text-sm" onClick={handleSend}>
            ส่ง
          </button>
        </div>
      </div>
    </div>
  );
}
