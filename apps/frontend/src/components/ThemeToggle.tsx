import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      className="p-2 rounded-xl border border-[#E8EBE9] bg-white hover:bg-[#F3F5F4] text-[#858B89] hover:text-[#202124] transition-colors shadow-xs"
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle theme"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Moon className="w-4 h-4 text-[#147D70]" /> : <Sun className="w-4 h-4 text-amber-500" />}
    </button>
  );
}
