// Schedule selection for group members (demo data)
//import { useMemo } from 'react';
import { useState, useEffect } from 'react';
import { Calendar, Clock, Check } from 'lucide-react';

type Slot = { day: string; hour: number };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Schedule() {
  const [picked, setPicked] = useState<Slot[]>([]);

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggle = (d: number, h: number) => {
    const i = picked.findIndex((s) => s.day === DAYS[d] && s.hour === h);
    if (i >= 0) setPicked((s) => s.filter((_, k) => k !== i));
    else setPicked((s) => [...s, { day: DAYS[d], hour: h }]);
  };

  const scoreByKey = picked.reduce<Record<string, number>>((acc, s) => {
    const k = `${s.day}-${s.hour}`;
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const best = Object.entries(scoreByKey).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <section className="min-h-screen py-8 bg-slate-50 dark:bg-slate-900">
      <div className="container-app space-y-6">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-block p-3 bg-teal-100 dark:bg-teal-900/30 rounded-sm mb-4">
            <Calendar className="w-8 h-8 text-teal-700 dark:text-teal-400" />
          </div>
          <h3 className="text-3xl font-light text-slate-800 dark:text-white mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Match <span className="italic">Schedule</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400">Select your available times to find the best meeting slot</p>
        </header>

      <div className="bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm">
        <div className="flex items-center gap-6 mb-6 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-5 h-5 rounded-sm bg-teal-100 dark:bg-teal-900/30" /> 
            <span className="text-slate-600 dark:text-slate-300">Selected</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-5 h-5 rounded-sm ring-2 ring-amber-500" /> 
            <span className="text-slate-600 dark:text-slate-300">Best Match</span>
          </span>
        </div>

        <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full border-separate border-spacing-2">
          <thead>
            <tr>
              <th className="text-left text-slate-700 dark:text-slate-300 font-medium text-sm py-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Hour</span>
                </div>
              </th>
              {DAYS.map((d) => (
                <th key={d} className="text-center text-slate-700 dark:text-slate-300 font-medium text-sm py-2">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 14 }).map((_, row) => {
              const hour = 8 + row;
              return (
                <tr key={row}>
                  <td className="text-slate-500 dark:text-slate-400 text-sm font-medium">{hour}:00</td>
                  {DAYS.map((d, col) => {
                    const on = picked.some((s) => s.day === d && s.hour === hour);
                    const k = `${d}-${hour}`;
                    const isBest = best === k;
                    return (
                      <td key={col}>
                        <button
                          onClick={() => toggle(col, hour)}
                          className={`w-20 h-10 rounded-sm text-sm font-medium transition-colors ${
                            on 
                              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' 
                              : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
                          } ${isBest ? 'ring-2 ring-amber-500' : ''}`}
                          title={k}
                          aria-pressed={on}
                        >
                          {on && <Check className="w-4 h-4 mx-auto" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm">
        <div className="font-medium text-lg mb-2 text-slate-800 dark:text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          <Calendar className="w-5 h-5 text-teal-700 dark:text-teal-400" />
          Best Time Match
        </div>
        <div className="text-slate-600 dark:text-slate-300">{best ? `${best.replace('-', ' at ')}:00` : 'Select times from the table to see the best match'}</div>
        </div>
      </div>
    </section>
  );
}
