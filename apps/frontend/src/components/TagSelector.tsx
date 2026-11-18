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
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((t) => (
            <span 
              key={t} 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#E0F3F1] text-[#11665C] border border-[#BFE7E2]"
            >
              <span>{t}</span>
              <button 
                type="button" 
                className="text-[#147D70] hover:text-[#082E29] transition-colors p-0.5" 
                onClick={() => !disabled && remove(t)}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="input flex-1 text-xs py-2.5"
          placeholder="Type a tag name and press Enter..."
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
          className="btn-primary text-xs px-4 py-2.5" 
          onClick={() => add(input)}
          disabled={disabled || !input.trim()}
        >
          Add Tag
        </button>
      </div>

      {!!suggestions.length && (
        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] font-medium text-[#858B89] mr-1">Suggestions:</span>
          {suggestions.map((s) => (
            <button
              type="button"
              key={s}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#5F6664] bg-[#F3F5F4] border border-[#E8EBE9] hover:border-[#147D70] hover:text-[#147D70] transition-colors disabled:opacity-50"
              onClick={() => add(s)}
              disabled={disabled || value.includes(s.toLowerCase())}
            >
              <Plus className="w-3 h-3 text-[#147D70]" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
