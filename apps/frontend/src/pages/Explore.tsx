import { useMemo, useState, useEffect } from 'react';
import { useEvents, Event } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { ALL_TAGS } from '../lib/demoData';
import TagFilterBar from '../components/TagFilterBar';
import EventCard from '../components/EventCard';
import { Compass, X } from 'lucide-react';

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
    <section className="min-h-screen py-10 bg-slate-50 dark:bg-slate-900">
      <div className="container-app space-y-8">
        {/* Professional Header */}
        <header className="text-center py-6">
          <h1 className="text-3xl md:text-4xl font-light text-slate-800 dark:text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Activity <span className="italic">Rooms</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            ค้นหากิจกรรมและกลุ่มที่ตรงกับความสนใจของคุณ เริ่มต้นการเรียนรู้ใหม่วันนี้
          </p>
        </header>

        {/* Search and Filter Bar */}
        <div>
          <TagFilterBar allTags={ALL_TAGS} active={tags} onToggle={toggleTag} query={q} onQuery={setQ} />
        </div>

        {/* Results Counter */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                <span className="text-lg font-semibold text-teal-700 dark:text-teal-400">{filtered.length}</span>
                <span className="text-slate-500 dark:text-slate-400 ml-2 text-sm">Activity Rooms</span>
              </div>
            </div>
            {tags.length > 0 && (
              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                กรองด้วย {tags.length} แท็ก
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-16 text-center">
            <div className="inline-block space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700"></div>
                <div className="absolute inset-0 rounded-full border-2 border-teal-600 border-t-transparent animate-spin"></div>
                <Compass className="absolute inset-0 m-auto w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="text-lg font-medium text-slate-700 dark:text-slate-300">กำลังโหลด...</div>
              <div className="text-sm text-slate-400">รอสักครู่</div>
            </div>
          </div>
        ) : filtered.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filtered.map((ev) => {
              const isParticipant = !!(user && ev.participants?.some((p: any) => {
                if (!p) return false;
                const pid = typeof p === 'string' ? p : (p.user?._id || p.user);
                return pid === user._id;
              }));

              const isCreator = !!(user && ev.createdBy?._id === user._id);

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
                    cover: (!ev.cover || (typeof ev.cover === 'string' && (ev.cover.startsWith('blob:') || ev.cover.startsWith('file:')))) ? undefined : ev.cover,
                    tags: ev.tags,
                    location: ev.location,
                    date: ev.date,
                    participantsCount: participantsCount,
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
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-16 text-center space-y-6">
            <div className="relative inline-block">
              <Compass className="w-16 h-16 text-slate-300 dark:text-slate-600" />
            </div>
            <div className="space-y-3">
              <div className="text-xl font-medium text-slate-700 dark:text-slate-300">ไม่พบกิจกรรม</div>
              <div className="text-slate-500 dark:text-slate-400">ลองเปลี่ยนคำค้นหาหรือลบตัวกรองบางส่วน</div>
            </div>
            {(q || tags.length > 0) && (
              <button
                onClick={() => {
                  setQ('');
                  setTags([]);
                }}
                className="mt-4 px-5 py-2.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors duration-200 inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}