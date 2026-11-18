import { useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';

type Props = {
  allTags: string[];
  active: string[];
  onToggle: (tag: string) => void;
  query: string;
  onQuery: (q: string) => void;
};

export default function TagFilterBar({ allTags, active, onToggle, query, onQuery }: Props) {
  const ordered = useMemo(
    () => [...allTags].sort((a, b) => Number(active.includes(b)) - Number(active.includes(a))),
    [allTags, active]
  );

  return (
    <div className="card p-5 space-y-4">
      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#858B89]" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search activity rooms by keyword, title, or topic..."
            className="input pl-10 text-xs py-3"
          />
          {query && (
            <button
              onClick={() => onQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#858B89] hover:text-[#202124]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {active.length > 0 && (
          <button
            onClick={() => active.forEach((t) => onToggle(t))}
            className="text-xs font-semibold text-[#858B89] hover:text-red-600 transition-colors self-end sm:self-center"
          >
            Clear {active.length} tag filters
          </button>
        )}
      </div>

      {/* Tag Pills */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#858B89] mb-2">
          Filter by Interest Tags
        </div>
        <div className="flex flex-wrap gap-2">
          {ordered.map((t) => {
            const isOn = active.includes(t);
            return (
              <button
                key={t}
                onClick={() => onToggle(t)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isOn
                    ? 'bg-[#147D70] text-white shadow-xs'
                    : 'bg-[#F3F5F4] text-[#5F6664] border border-[#E8EBE9] hover:bg-[#E8EBE9] hover:text-[#202124]'
                }`}
              >
                {isOn && <Check className="w-3 h-3 text-[#D9F36A]" />}
                <span>{t}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
