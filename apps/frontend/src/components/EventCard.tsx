// apps/frontend/src/components/EventCard.tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventItem, DEMO_GROUPS } from '../lib/demoData';

export default function EventCard({ event }: { event: EventItem }) {
  const navigate = useNavigate();

  // หา "กลุ่มแรก" ที่อยู่ภายใต้อีเวนต์นี้
  const firstGroupId = useMemo(() => {
    const g = DEMO_GROUPS.find((x) => x.eventId === event.id);
    return g?.id;
  }, [event.id]);

  const goJoin = () => {
    if (!firstGroupId) return;
    navigate(`/groups/${firstGroupId}`);
  };

  return (
    <article className="card overflow-hidden group">
      <div className="relative h-48 sm:h-56 md:h-64">
        <img
          src={event.cover}
          alt={event.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-lg font-bold">{event.title}</h3>
        <p className="text-sm opacity-80 line-clamp-2">{event.about}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          {event.tags.map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>

        <div className="pt-3">
          <button
            onClick={goJoin}
            className="btn-primary"
            disabled={!firstGroupId}
            title={!firstGroupId ? 'ยังไม่มีกลุ่มสำหรับอีเวนต์นี้' : 'เข้ากลุ่มและเริ่มแชทในห้องรวม'}
          >
            Join & Chat
          </button>
        </div>
      </div>
    </article>
  );
}
