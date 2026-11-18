// apps/frontend/src/pages/groups/GroupList.tsx
import { useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { DEMO_EVENTS, DEMO_GROUPS, GroupItem, joinGroup } from '../../lib/demoData';
import { Users, MapPin, MessageCircle, ArrowLeft, Sparkles, Compass } from 'lucide-react';

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
    () => DEMO_GROUPS.filter((g) => (eventId ? g.eventId === eventId : true)),
    [eventId]
  );

  return (
    <section className="min-h-screen py-10 bg-[#F3F5F4] text-[#202124]">
      <div className="container-app max-w-6xl space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/explore"
              className="p-2.5 rounded-xl bg-white border border-[#E8EBE9] hover:border-[#147D70]/40 text-[#858B89] hover:text-[#147D70] transition-colors shadow-sm"
              title="Back to Explore"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#147D70] bg-[#EAF5D5] px-2.5 py-0.5 rounded-full">
                  Community Groups
                </span>
                <span className="text-xs text-[#858B89] font-medium">
                  {groups.length} {groups.length === 1 ? 'room' : 'rooms'} active
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124] mt-1">
                {event ? event.title : 'Activity Groups'}
              </h1>
            </div>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#147D70] bg-white border border-[#E8EBE9] hover:bg-[#F3F5F4] rounded-xl transition-colors shadow-sm w-fit"
          >
            <Compass className="w-4 h-4" />
            Explore More Activities
          </Link>
        </div>

        {/* Selected Event Context Card (if present) */}
        {event && (
          <div className="bg-white rounded-2xl p-5 border border-[#E8EBE9] shadow-sm flex flex-col sm:flex-row items-center gap-5">
            <img
              src={event.cover}
              alt={event.title}
              className="h-24 w-full sm:w-36 object-cover rounded-xl border border-[#E8EBE9] flex-shrink-0"
            />
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <span className="text-xs font-medium text-[#147D70] uppercase tracking-wide">
                Linked Activity
              </span>
              <h3 className="text-lg font-bold text-[#202124]">{event.title}</h3>
              <p className="text-sm text-[#858B89] flex items-center justify-center sm:justify-start gap-1.5">
                <MapPin className="w-4 h-4 text-[#147D70]" />
                {event.location}
              </p>
            </div>
          </div>
        )}

        {/* Groups Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((g) => (
            <div
              key={g.id}
              className="bg-white p-6 rounded-2xl border border-[#E8EBE9] shadow-sm hover:shadow-md hover:border-[#147D70]/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-[#EAF5D5] text-[#147D70]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-xs bg-[#F3F5F4] text-[#202124] border border-[#E8EBE9] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#147D70]" />
                    {g.members}{g.max ? ` / ${g.max}` : ''} Members
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-[#202124] group-hover:text-[#147D70] transition-colors">
                    {g.name}
                  </h3>
                  <p className="text-sm text-[#858B89] mt-1 leading-relaxed">
                    {g.description ?? 'Welcome new members! Join the discussion and coordinate meetups.'}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-[#E8EBE9]">
                <button
                  onClick={() => {
                    joinGroup(g.id);
                    navigate(`/groups/${g.id}`);
                  }}
                  className="w-full py-2.5 px-4 font-semibold text-sm text-white rounded-xl bg-[#147D70] hover:bg-[#11665C] transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Join & Chat
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!groups.length && (
          <div className="bg-white p-12 text-center border border-[#E8EBE9] rounded-2xl shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#EAF5D5] text-[#147D70] flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#202124]">No groups available</h3>
            <p className="text-sm text-[#858B89] mt-2 mb-6">
              There are currently no active discussion rooms for this activity. Be the first to start one or explore other events!
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm text-white bg-[#147D70] hover:bg-[#11665C] rounded-xl transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#D9F36A]" />
              Browse Activities
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
