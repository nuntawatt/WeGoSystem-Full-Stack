import { useMemo } from 'react';
import { Search } from 'lucide-react';

type Props = {
  allTags: string[];
  active: string[];
  onToggle: (tag: string) => void;
  query: string;
  onQuery: (q: string) => void;
};

// Map tags to professional muted colors
const TAG_COLORS: Record<string, { bg: string; border: string; text: string; activeBg: string }> = {
  'Exam Prep': { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-300', activeBg: 'bg-teal-600 dark:bg-teal-600' },
  'Music Jam': { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', activeBg: 'bg-amber-600 dark:bg-amber-600' },
  'Late Night Study': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300', activeBg: 'bg-indigo-600 dark:bg-indigo-600' },
  'Coding': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', activeBg: 'bg-emerald-600 dark:bg-emerald-600' },
  'Art': { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', activeBg: 'bg-rose-600 dark:bg-rose-600' },
  'Sports': { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300', activeBg: 'bg-orange-600 dark:bg-orange-600' },
  'Languages': { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300', activeBg: 'bg-cyan-600 dark:bg-cyan-600' },
  'Science': { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-300', activeBg: 'bg-violet-600 dark:bg-violet-600' },
  'Math': { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', activeBg: 'bg-blue-600 dark:bg-blue-600' },
  'Gaming': { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', activeBg: 'bg-purple-600 dark:bg-purple-600' },
};

const DEFAULT_COLORS = [
  { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-300', activeBg: 'bg-slate-600 dark:bg-slate-600' }
];

function getTagColor(tag: string, index: number) {
  return TAG_COLORS[tag] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export default function TagFilterBar({ allTags, active, onToggle, query, onQuery }: Props) {
  const ordered = useMemo(
    () => [...allTags].sort((a, b) => Number(active.includes(b)) - Number(active.includes(a))),
    [allTags, active]
  );

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 space-y-4">
      {/* Search Input - Professional Style */}
      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search activity rooms..."
          className="w-full pl-12 pr-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
        />
      </div>

      {/* Tag Pills - Professional muted colors */}
      <div className="flex flex-wrap gap-2">
        {ordered.map((t, index) => {
          const isOn = active.includes(t);
          const colors = getTagColor(t, index);
          return (
            <button
              key={t}
              onClick={() => onToggle(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                isOn 
                  ? `${colors.activeBg} text-white border-transparent` 
                  : `${colors.bg} ${colors.border} ${colors.text} hover:border-slate-300 dark:hover:border-slate-600`
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}