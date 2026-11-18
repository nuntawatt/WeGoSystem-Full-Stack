import { useState } from 'react';
import { showSuccess } from '../lib/swal';
import { Star, X } from 'lucide-react';

export default function RatingDialog() {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState('');

  const submit = () => {
    setOpen(false);
    showSuccess('ขอบคุณสำหรับคะแนน!', `คุณให้คะแนน ${stars} ดาว`);
    setStars(0);
    setNote('');
  };

  return (
    <div className="card p-5 bg-white shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Star className="w-4 h-4 fill-amber-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#202124]">Rate Session Experience</h4>
            <p className="text-[11px] text-[#858B89]">Share peer feedback for this activity</p>
          </div>
        </div>
        <button 
          onClick={() => setOpen(true)}
          className="btn-primary text-xs py-1.5 px-3.5"
        >
          Add Rating
        </button>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-[#E8EBE9] space-y-4">
          <div>
            <label className="label">Your Star Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`w-9 h-9 rounded-xl grid place-items-center transition-colors cursor-pointer ${
                    i <= stars 
                      ? 'bg-amber-400 text-white' 
                      : 'bg-[#F3F5F4] text-[#BAC2BF] hover:bg-[#E8EBE9]'
                  }`}
                  onClick={() => setStars(i)}
                  aria-label={`${i} stars`}
                >
                  <Star className="w-4 h-4" fill={i <= stars ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Note or Feedback (Optional)</label>
            <textarea
              className="input text-xs min-h-[5rem] resize-none"
              placeholder="What went well? Any suggestions for upcoming sessions?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button 
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={submit}
              disabled={stars === 0}
              className="btn-primary text-xs"
            >
              Submit Rating
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
