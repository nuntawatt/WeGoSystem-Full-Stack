import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let pushFn: ((msg: string, type?: 'success' | 'error' | 'info') => void) | null = null;

export function toast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
  pushFn?.(msg, type);
}

export default function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  
  useEffect(() => {
    let idCounter = 0;
    pushFn = (m: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = idCounter++;
      setItems((s) => [...s, { id, message: m, type }]);
      setTimeout(() => setItems((s) => s.filter(item => item.id !== id)), 3500);
    };
    return () => {
      pushFn = null;
    };
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-[#147D70] flex-shrink-0" />;
    }
  };

  const getStyles = (type: string) => {
    switch(type) {
      case 'success':
        return 'border-l-4 border-l-emerald-500';
      case 'error':
        return 'border-l-4 border-l-red-500';
      default:
        return 'border-l-4 border-l-[#147D70]';
    }
  };

  return (
    <div className="fixed top-20 right-5 z-[100] space-y-3 max-w-sm w-full pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[#E8EBE9]
            bg-white shadow-xl backdrop-blur-md animate-slide-in-right
            ${getStyles(item.type)}
          `}
        >
          <div className="mt-0.5">
            {getIcon(item.type)}
          </div>
          <div className="flex-1 font-medium text-xs sm:text-sm text-[#202124] leading-relaxed">
            {item.message}
          </div>
          <button
            onClick={() => setItems((s) => s.filter(i => i.id !== item.id))}
            className="text-[#858B89] hover:text-[#202124] p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
