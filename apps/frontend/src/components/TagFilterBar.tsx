// Filter bar with search + tag pills
import { useMemo } from 'react';

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
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Search events..."
        className="input max-w-lg"
      />
      <div className="flex flex-wrap gap-2">
        {ordered.map((t) => {
          const isOn = active.includes(t);
          return (
            <button
              key={t}
              onClick={() => onToggle(t)}
              className={
                'px-3 py-1 rounded-full text-sm transition ' +
                (isOn ? 'bg-white/20 ring-1 ring-white/30' : 'bg-white/10 hover:bg-white/15')
              }
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}