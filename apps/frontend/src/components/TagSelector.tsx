import { useState } from 'react';

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
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((t) => (
          <span key={t} className="tag inline-flex items-center gap-2">
            {t}
            <button 
              type="button" 
              className="opacity-70 hover:opacity-100" 
              onClick={() => !disabled && remove(t)}
              disabled={disabled}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
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
          className="btn-primary" 
          onClick={() => add(input)}
          disabled={disabled}
        >
          เพิ่ม
        </button>
      </div>

      {!!suggestions.length && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s}
              className="px-2 py-1 rounded-lg ring-1 ring-white/10 hover:bg-white/10 transition text-sm"
              onClick={() => add(s)}
              disabled={disabled}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}