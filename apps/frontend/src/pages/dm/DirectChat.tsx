import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DEMO_USERS } from '../../lib/demoData';
import { useDM } from '../../hooks/useDM';

export default function DirectChat() {
  const { uid = '' } = useParams<{ uid: string }>();
  const { meUid, getMsgs, sendTo } = useDM();

  const me = useMemo(() => DEMO_USERS.find((u) => u.uid === 'me')!, []);
  const peer = useMemo(() => DEMO_USERS.find((u) => u.uid === uid) || null, [uid]);

  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  const msgs = useMemo(() => getMsgs(uid), [getMsgs, uid]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  if (!peer) {
    return (
      <section className="container-app py-8">
        <div className="card p-6 space-y-3">
          <div className="text-lg font-semibold">ไม่พบผู้ใช้สำหรับแชท</div>
          <Link to="/explore" className="btn-primary w-fit">กลับไป Explore</Link>
        </div>
      </section>
    );
  }

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    sendTo(peer.uid, t);
    setText('');
  };

  return (
    <section className="container-app py-8 space-y-4">
      {/* Header */}
      <header className="flex items-center gap-3">
        <img src={peer.avatar} alt={peer.name} className="h-10 w-10 rounded-full object-cover" />
        <h3 className="text-xl font-semibold">{peer.name}</h3>
      </header>

      {/* Chat area */}
      <div className="card p-3 h-[65vh] md:h-[70vh] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-2">
          {msgs.map((m, i) => {
            const mine = m.from === meUid;
            return (
              <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={[
                    'px-3 py-2 rounded-lg max-w-[75%] break-words text-sm',
                    mine ? 'bg-amber-300 text-black' : 'bg-white/10 text-white',
                  ].join(' ')}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          {!msgs.length && (
            <div className="opacity-60 text-center text-sm">ยังไม่มีข้อความ — เริ่มพิมพ์ได้เลย</div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <input
            className="input flex-1"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`พิมพ์ถึง ${peer.name}...`}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn-primary px-5" onClick={handleSend}>ส่ง</button>
        </div>
      </div>
    </section>
  );
}
