import { useState, useEffect } from 'react';
import { Calendar, Clock, Check, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Slot = { day: string; hour: number };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Schedule() {
  const [picked, setPicked] = useState<Slot[]>([]);
  const navigate = useNavigate();

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
    <section className="min-h-screen py-8 bg-[#F3F5F4]">
      <div className="container-app space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#858B89] hover:text-[#202124] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Activity Room</span>
          </button>
        </div>

        {/* Header Banner */}
        <div className="card p-6 sm:p-8 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF5D5] text-[#11665C] border border-[#D9F36A]">
                Synchronized Calendar
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight mt-1">
              Match Free Hours & Meeting Schedule
            </h1>
            <p className="text-xs sm:text-sm text-[#858B89] mt-0.5">
              Click on slots to toggle your availability. The system automatically computes overlapping free slots across all members.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-[#147D70]" />
              <span className="text-[#202124]">Your Free Slot</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-[#D9F36A] border border-[#C5E349]" />
              <span className="text-[#202124]">Optimal Time Match</span>
            </span>
          </div>
        </div>

        {/* Timetable Matrix Card */}
        <div className="card p-6 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto thin-scrollbar">
            <table className="min-w-[700px] w-full border-separate border-spacing-1.5 text-xs">
              <thead>
                <tr>
                  <th className="text-left text-[#858B89] font-bold uppercase text-[11px] py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#147D70]" />
                      <span>Hour</span>
                    </div>
                  </th>
                  {DAYS.map((d) => (
                    <th key={d} className="text-center font-bold text-xs text-[#202124] py-2">
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
                      <td className="text-[#858B89] font-semibold text-[11px] px-3 py-1">
                        {hour.toString().padStart(2, '0')}:00
                      </td>
                      {DAYS.map((d, col) => {
                        const on = picked.some((s) => s.day === d && s.hour === hour);
                        const k = `${d}-${hour}`;
                        const isBest = best === k;
                        return (
                          <td key={col} className="p-0.5">
                            <button
                              onClick={() => toggle(col, hour)}
                              className={`w-full h-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center cursor-pointer ${
                                on
                                  ? isBest
                                    ? 'bg-[#D9F36A] text-[#202124] shadow-xs ring-2 ring-[#C5E349]'
                                    : 'bg-[#147D70] text-white shadow-xs'
                                  : 'bg-[#F3F5F4] hover:bg-[#E8EBE9] text-[#5F6664]'
                              }`}
                              title={`${d} at ${hour}:00`}
                              aria-pressed={on}
                            >
                              {on && <Check className="w-3.5 h-3.5" />}
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

        {/* Best Match Summary Card */}
        <div className="card p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5D5] text-[#11665C] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[#147D70]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#147D70]">
                Algorithm Recommendation
              </span>
              <h3 className="text-base font-bold text-[#202124]">
                {best ? `Optimal Meeting Slot: ${best.replace('-', ' at ')}:00` : 'Select your hours above to calculate overlap'}
              </h3>
            </div>
          </div>

          {best && (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#D9F36A] text-[#202124]">
              Highest Peer Overlap
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
