import { useEffect, useMemo, useState } from 'react';
import { showSuccess } from '../lib/swal';
import { Calendar, Save } from 'lucide-react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const blocks = Array.from({ length: 12 }, (_, i) => i * 2);

export type AvailabilityMap = Record<string, number[]>;

export default function AvailabilityPicker() {
  const [avail, setAvail] = useState<AvailabilityMap>({});

  useEffect(() => {
    const raw = localStorage.getItem('wego_availability');
    if (raw) setAvail(JSON.parse(raw));
  }, []);

  const toggle = (day: string, hour: number) => {
    setAvail((s) => {
      const cur = new Set(s[day] || []);
      if (cur.has(hour)) cur.delete(hour);
      else cur.add(hour);
      return { ...s, [day]: Array.from(cur).sort((a, b) => a - b) };
    });
  };

  const count = useMemo(
    () => Object.values(avail).reduce((acc, arr) => acc + (arr?.length || 0), 0),
    [avail]
  );

  const save = () => {
    localStorage.setItem('wego_availability', JSON.stringify(avail));
    showSuccess('บันทึกสำเร็จ!', 'เวลาว่างของคุณถูกบันทึกแล้ว');
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-indigo-700 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Your Availability</h3>
        </div>
        <button 
          onClick={save}
          className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-600 rounded-sm transition-colors flex items-center gap-2"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
      <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-2">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hour</div>
        {days.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
            {d}
          </div>
        ))}

        {blocks.map((h) => (
          <>
            <div key={`label-${h}`} className="text-xs text-slate-500 dark:text-slate-400">
              {String(h).padStart(2, '0')}:00
            </div>
            {days.map((d) => {
              const on = avail[d]?.includes(h);
              return (
                <button
                  key={`${d}-${h}`}
                  className={`h-8 rounded-sm transition-colors ${
                    on 
                      ? 'bg-teal-600 hover:bg-teal-500' 
                      : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                  }`}
                  onClick={() => toggle(d, h)}
                  title={`${d} ${h}:00`}
                />
              );
            })}
          </>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
        Selected blocks: <span className="font-medium text-slate-700 dark:text-slate-200">{count}</span>
      </div>
    </div>
  );
}