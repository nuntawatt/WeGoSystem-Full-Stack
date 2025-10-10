// apps/frontend/src/pages/groups/GroupList.tsx
import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DEMO_EVENTS, DEMO_GROUPS, GroupItem, joinGroup } from '../../lib/demoData';

export default function GroupsList() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const eventId = sp.get('event');

  const event = useMemo(() => DEMO_EVENTS.find((e) => e.id === eventId), [eventId]);
  const groups = useMemo<GroupItem[]>(
    () => DEMO_GROUPS.filter((g) => g.eventId === eventId),
    [eventId]
  );

  return (
    <section className="container-app py-8 text-white space-y-6">
      <header className="space-y-2">
        <h3 className="text-2xl font-extrabold">Groups</h3>
        {event ? (
          <div className="flex items-center gap-3">
            <img src={event.cover} className="h-14 w-20 object-cover rounded" />
            <div>
              <div className="font-bold">{event.title}</div>
              <div className="text-sm opacity-80">{event.location}</div>
            </div>
          </div>
        ) : (
          <div className="opacity-80 text-sm">เลือกกิจกรรมจากหน้า Explore เพื่อดูรายชื่อกลุ่ม</div>
        )}
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {groups.map((g) => (
          <div key={g.id} className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{g.name}</div>
              <div className="text-xs opacity-80">
                {g.members}{g.max ? ` / ${g.max}` : ''} members
              </div>
            </div>
            <div className="text-sm opacity-90">{g.description ?? 'ยินดีต้อนรับสมาชิกใหม่!'}</div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  joinGroup(g.id);
                  navigate(`/groups/${g.id}`);
                }}
                className="btn-primary"
              >
                Join & Chat
              </button>
            </div>
          </div>
        ))}
      </div>

      {!groups.length && <div className="card p-6 opacity-90">ยังไม่มีกลุ่มสำหรับกิจกรรมนี้</div>}
    </section>
  );
}
