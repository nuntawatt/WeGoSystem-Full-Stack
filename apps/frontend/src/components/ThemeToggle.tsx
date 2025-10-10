import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return (
    <button
      className="px-2 py-1 rounded-lg ring-1 ring-white/10 hover:bg-white/10"
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? '🌙' : '☀️'}
    </button>
  );
}