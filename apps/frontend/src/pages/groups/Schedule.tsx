// Schedule selection for group members (demo data)
//import { useMemo } from 'react';
import { useState } from 'react';

type Slot = { day: string; hour: number };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Schedule() {
  const [picked, setPicked] = useState<Slot[]>([]);

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
    <section className="container-app py-8 text-white space-y-6">
      <h3 className="text-2xl font-extrabold">Match Schedule</h3>

      <div className="overflow-x-auto card p-4">
        <div className="flex items-center gap-3 mb-3 text-sm opacity-80">
          <span className="inline-block w-4 h-4 rounded bg-white/30" /> เลือกแล้ว
          <span className="inline-block w-4 h-4 rounded ring-2 ring-brand-gold ml-4" /> เวลาที่แนะนำ
        </div>

        <table className="min-w-[720px] w-full border-separate border-spacing-2">
          <thead>
            <tr>
              <th className="text-left opacity-80">Hour</th>
              {DAYS.map((d) => (
                <th key={d} className="text-left opacity-80">
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
                  <td className="opacity-70 text-sm">{hour}:00</td>
                  {DAYS.map((d, col) => {
                    const on = picked.some((s) => s.day === d && s.hour === hour);
                    const k = `${d}-${hour}`;
                    const isBest = best === k;
                    return (
                      <td key={col}>
                        <button
                          onClick={() => toggle(col, hour)}
                          className={`w-20 h-9 rounded-md text-sm transition ${
                            on ? 'bg-white/30' : 'bg-white/10 hover:bg-white/15'
                          } ${isBest ? 'ring-2 ring-brand-gold' : ''}`}
                          title={k}
                          aria-pressed={on}
                        >
                          {on ? '✔' : ''}
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

      <div className="card p-4">
        <div className="font-semibold mb-1">ข้อเสนอเวลาที่ดีที่สุด (demo)</div>
        <div className="opacity-90">{best ? best.replace('-', ' @ ') : 'เลือกเวลาจากตารางเพื่อดูผลลัพธ์'}</div>
      </div>
    </section>
  );
}
