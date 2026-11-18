import { useEffect, useMemo, useState } from 'react';
import { showSuccess } from '../lib/swal';
import { Calendar, Save, Check } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E8EBE9]">
        <div>
          <h4 className="text-sm font-bold text-[#202124]">Personal Availability</h4>
          <p className="text-[11px] text-[#858B89]">Select your active hours</p>
        </div>
        <button 
          onClick={save}
          className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5 text-[#D9F36A]" />
          <span>Save</span>
        </button>
      </div>

      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] gap-1.5 text-xs">
        <div className="text-[11px] font-bold text-[#858B89] uppercase tracking-wider">Hour</div>
        {days.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold text-[#202124]">
            {d}
          </div>
        ))}

        {blocks.map((h) => (
          <div key={`row-${h}`} className="contents">
            <div className="text-[11px] text-[#858B89] font-medium py-1">
              {String(h).padStart(2, '0')}:00
            </div>
            {days.map((d) => {
              const on = avail[d]?.includes(h);
              return (
                <button
                  key={`${d}-${h}`}
                  className={`h-7 rounded-lg transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    on 
                      ? 'bg-[#147D70] text-white shadow-xs' 
                      : 'bg-[#F3F5F4] hover:bg-[#E8EBE9] border border-[#E8EBE9]'
                  }`}
                  onClick={() => toggle(d, h)}
                  title={`${d} at ${h}:00`}
                >
                  {on && <Check className="w-3 h-3 text-[#D9F36A]" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-[#E8EBE9] flex justify-between items-center text-xs">
        <span className="text-[#858B89]">Active blocks selected:</span>
        <span className="font-bold text-[#147D70] bg-[#E0F3F1] px-2 py-0.5 rounded-md">
          {count} slots
        </span>
      </div>
    </div>
  );
}
