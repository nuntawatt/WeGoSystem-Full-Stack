import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

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
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type: string) => {
    switch(type) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
      default:
        return 'bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-[60] space-y-3 max-w-md">
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            flex items-start gap-3 px-5 py-4 rounded-sm border 
            shadow-lg backdrop-blur-sm
            animate-slide-in-right
            ${getStyles(item.type)}
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(item.type)}
          </div>
          <div className="flex-1 font-medium text-sm leading-relaxed">
            {item.message}
          </div>
        </div>
      ))}
    </div>
  );
}