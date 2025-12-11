import { useState } from 'react';
import { toast } from './Toasts';
import { Star, X } from 'lucide-react';

export default function RatingDialog() {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState('');

  const submit = () => {
    setOpen(false);
    toast(`Thanks! You rated ${stars} stars`);
    setStars(0);
    setNote('');
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          <span className="font-medium text-slate-800 dark:text-slate-100">Rate recent activity</span>
        </div>
        <button 
          onClick={() => setOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-600 rounded-sm transition-colors"
        >
          Rate
        </button>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                className={`h-10 w-10 rounded-sm grid place-items-center transition-colors ${
                  i <= stars 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                onClick={() => setStars(i)}
                aria-label={`${i} stars`}
              >
                <Star className="w-5 h-5" fill={i <= stars ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <textarea
            className="w-full px-4 py-3 rounded-sm border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none resize-none h-24"
            placeholder="Leave a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-3">
            <button 
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 text-sm font-medium rounded-sm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={submit}
              className="px-4 py-2.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-600 rounded-sm transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}