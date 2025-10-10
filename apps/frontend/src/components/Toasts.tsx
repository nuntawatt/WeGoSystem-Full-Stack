import { useEffect, useState } from 'react';

let pushFn: ((msg: string) => void) | null = null;
export function toast(msg: string) {
  pushFn?.(msg);
}

export default function Toasts() {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    pushFn = (m: string) => {
      setItems((s) => [...s, m]);
      setTimeout(() => setItems((s) => s.slice(1)), 2500);
    };
    return () => {
      pushFn = null;
    };
  }, []);
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] space-y-2">
      {items.map((m, i) => (
        <div
          key={i}
          className="px-4 py-2 rounded-xl bg-black/70 ring-1 ring-white/10 text-white shadow-card"
        >
          {m}
        </div>
      ))}
    </div>
  );
}