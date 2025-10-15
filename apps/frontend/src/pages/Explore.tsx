import { useMemo, useState, useEffect } from 'react';
import { useEvents, Event } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { ALL_TAGS } from '../lib/demoData';
import TagFilterBar from '../components/TagFilterBar';
import EventCard from '../components/EventCard';

export default function Explore() {
  const { events, isLoading, fetchEvents } = useEvents();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const toggleTag = (t: string) => setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filtered = useMemo(() => {
    let arr: Event[] = [...events];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((e) => 
        e.title.toLowerCase().includes(s) || 
        e.description.toLowerCase().includes(s) || 
        e.tags.some((t: string) => t.toLowerCase().includes(s))
      );
    }
    if (tags.length) arr = arr.filter((e) => tags.every((t) => e.tags.includes(t)));
    return arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [q, tags, events]);

  return (
    <section className="min-h-screen py-8">
      <div className="container-app space-y-8">
        {/* Enhanced Header with Icon and Animations */}
        <header className="mb-6 text-center">
          <div className="inline-block p-3 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent font-['Poppins']">
            🌟 Explore Activities
          </h2>
          <p className="text-slate-400">ค้นหากิจกรรมและกลุ่มที่ตรงกับความสนใจของคุณ เริ่มต้นการผลผลิตใหม่วันนี้!</p>
        </header>

      {/* Search and Filter Bar with Animation */}
      <div>
        <TagFilterBar allTags={ALL_TAGS} active={tags} onToggle={toggleTag} query={q} onQuery={setQ} />
      </div>

      {/* Results Counter */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-full border border-amber-500/30">
              <span className="text-amber-400 font-bold text-lg">{filtered.length}</span>
              <span className="text-slate-300 ml-2">กิจกรรม</span>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            {tags.length > 0 && `กรองด้วย ${tags.length} แท็ก`}
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="card p-16 text-center border-2 border-amber-500/20 shadow-2xl shadow-amber-500/10">
            <div className="inline-block space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-amber-400/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-xl font-bold text-white">กำลังโหลดกิจกรรม...</div>
              <div className="text-sm text-slate-400">รอสักครู่นะ 🎯</div>
            </div>
        </div>
      ) : filtered.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filtered.map((ev) => {
            // Check if current user is a participant (robustly handle string IDs and object shapes)
            const isParticipant = !!(user && ev.participants?.some((p: any) => {
              if (!p) return false;
              const pid = typeof p === 'string' ? p : (p.user?._id || p.user);
              return pid === user._id;
            }));

            // Check if current user is the creator
            const isCreator = !!(user && ev.createdBy?._id === user._id);

            // Compute participants and popularity safely
            const participantsCount = ev.participants?.length || 0;
            const createdById = ev.createdBy ? (typeof ev.createdBy === 'string' ? ev.createdBy : ev.createdBy._id) : null;
            let creatorIncluded = false;
            if (createdById && ev.participants && Array.isArray(ev.participants)) {
              creatorIncluded = ev.participants.some((p: any) => {
                if (!p) return false;
                const pid = typeof p === 'string' ? p : (p.user?._id || p.user);
                return pid === createdById;
              });
            }
            const popularity = participantsCount + (createdById && !creatorIncluded ? 1 : 0);

            return (
              <EventCard
                key={ev._id}
                event={{
                  id: ev._id,
                  title: ev.title,
                  about: ev.description,
                    // If no valid cover (or it's a transient blob/file URL), pass undefined so EventCard will render its own placeholder
                    cover: (!ev.cover || (typeof ev.cover === 'string' && (ev.cover.startsWith('blob:') || ev.cover.startsWith('file:')))) ? undefined : ev.cover,
                    tags: ev.tags,
                    location: ev.location,
                    date: ev.date,
                    // participantsCount: number of participants stored (may or may not include creator)
                    participantsCount: participantsCount,
                    // popularity: computed display total including creator if not counted
                    popularity: popularity
                  }}
                  maxParticipants={ev.maxParticipants}
                  isParticipant={isParticipant}
                  isCreator={isCreator}
                  chatId={ev.chat}
                  onUpdate={fetchEvents}
                />
            );
          })}
        </div>
      ) : (
        <div className="card p-16 text-center border-2 border-slate-700/50 shadow-xl space-y-4">
            <div className="relative inline-block">
              <div className="text-8xl">🔍</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">ไม่พบกิจกรรม</div>
              <div className="text-slate-400">ลองเปลี่ยนคำค้นหาหรือลบตัวกรองบางส่วนดูนะ</div>
            </div>
            {(q || tags.length > 0) && (
              <button
                onClick={() => {
                  setQ('');
                  setTags([]);
                }}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-amber-500/50 transition-all duration-300"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}