import { useMemo, useState } from 'react';
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
    <section className="container-app py-10 text-white space-y-6">
      <header className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-extrabold">
          Explore <span className="brand-gradient">Activities</span>
        </h2>
        <p className="opacity-90">Find buddies and groups</p>
      </header>

      <TagFilterBar allTags={ALL_TAGS} active={tags} onToggle={toggleTag} query={q} onQuery={setQ} />

      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="text-lg font-semibold">Loading events...</div>
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
        <div className="card p-8 text-center">
          <div className="text-lg font-semibold">ไม่พบกิจกรรมที่ตรงกับการค้นหา</div>
          <div className="opacity-80">ลองลบตัวกรองหรือพิมพ์คำค้นใหม่อีกครั้ง</div>
        </div>
      )}
    </section>
  );
}