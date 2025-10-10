import { useMemo, useState } from 'react';
import { useEvents, Event } from '../hooks/useEvents';
import { ALL_TAGS } from '../lib/demoData';
import TagFilterBar from '../components/TagFilterBar';
import EventCard from '../components/EventCard';

export default function Explore() {
  const { events, isLoading } = useEvents();
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
          {filtered.map((ev) => (
            <EventCard 
              key={ev._id} 
              event={{
                id: ev._id,
                title: ev.title,
                about: ev.description,
                cover: ev.cover || 'https://via.placeholder.com/400x300',
                tags: ev.tags,
                location: ev.location,
                date: ev.date,
                popularity: ev.participants?.length || 0
              }} 
            />
          ))}
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