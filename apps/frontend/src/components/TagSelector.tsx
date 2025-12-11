import { useState } from 'react';
import { X, Plus } from 'lucide-react';

export default function TagSelector({
  value,
  onChange,
  suggestions = ['กีฬา', 'กาแฟ', 'บอร์ดเกม', 'เดินป่า', 'ดนตรี', 'โยคะ', 'อาหาร', 'ท่องเที่ยว', 'ศิลปะ'],
  disabled = false,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
  disabled?: boolean;
}) {
  const [input, setInput] = useState('');

  const add = (t: string) => {
    const tag = t.trim().toLowerCase();
    if (!tag) return;
    if (value.includes(tag)) return;
    onChange([...value, tag]);
    setInput('');
  };
  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
            {t}
            <button 
              type="button" 
              className="text-teal-500 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-200 transition-colors" 
              onClick={() => !disabled && remove(t)}
              disabled={disabled}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
          placeholder="พิมพ์แท็กแล้วกด Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled) {
              e.preventDefault();
              add(input);
            }
          }}
        />
        <button 
          type="button" 
          className="px-5 py-2.5 rounded-sm font-medium text-white bg-teal-700 hover:bg-teal-600 transition-colors disabled:opacity-60" 
          onClick={() => add(input)}
          disabled={disabled}
        >
          เพิ่ม
        </button>
      </div>

      {!!suggestions.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60"
              onClick={() => add(s)}
              disabled={disabled}
            >
              <Plus className="w-3.5 h-3.5" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}