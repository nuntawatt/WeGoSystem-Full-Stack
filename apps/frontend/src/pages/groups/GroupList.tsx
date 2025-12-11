// apps/frontend/src/pages/groups/GroupList.tsx
import { useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DEMO_EVENTS, DEMO_GROUPS, GroupItem, joinGroup } from '../../lib/demoData';
import { Users, MapPin, MessageCircle, Search } from 'lucide-react';

export default function GroupsList() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const eventId = sp.get('event');

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const event = useMemo(() => DEMO_EVENTS.find((e) => e.id === eventId), [eventId]);
  const groups = useMemo<GroupItem[]>(
    () => DEMO_GROUPS.filter((g) => g.eventId === eventId),
    [eventId]
  );

  return (
    <section className="min-h-screen py-12 bg-slate-50 dark:bg-slate-900">
      <div className="container-app space-y-8">
        {/* Header Section */}
        <header className="space-y-4 text-center">
          <div className="inline-block p-3 bg-teal-700 rounded-sm mb-4">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-3xl font-semibold text-slate-800 dark:text-slate-100" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Activity Groups
          </h3>
          {event ? (
            <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-sm max-w-2xl mx-auto shadow-sm">
              <div className="flex items-center gap-4">
                <img src={event.cover} className="h-16 w-24 object-cover rounded-sm" alt={event.title} />
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg text-slate-800 dark:text-slate-100">{event.title}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.location}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 dark:text-slate-400 text-lg flex items-center justify-center gap-2">
              <Search className="w-5 h-5" />
              Select an activity from Explore to see groups
            </div>
          )}
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((g) => (
            <div key={g.id} className="bg-white dark:bg-slate-800 p-5 space-y-3 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex items-start justify-between">
                <div className="font-semibold text-lg text-slate-800 dark:text-slate-100">{g.name}</div>
                <div className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-sm font-medium flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {g.members}{g.max ? ` / ${g.max}` : ''}
                </div>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 flex-1">{g.description ?? 'Welcome new members!'}</div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    joinGroup(g.id);
                    navigate(`/groups/${g.id}`);
                  }}
                  className="flex-1 px-5 py-2.5 font-medium text-white rounded-sm bg-teal-700 hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Join & Chat
                </button>
              </div>
            </div>
          ))}
        </div>

        {!groups.length && (
          <div className="bg-white dark:bg-slate-800 p-8 text-center border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <div className="text-lg text-slate-700 dark:text-slate-200">No groups available for this activity</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">Be the first to create one!</div>
          </div>
        )}
      </div>
    </section>
  );
}
