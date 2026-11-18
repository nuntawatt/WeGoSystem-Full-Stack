import { useMemo, useState, useEffect } from 'react';
import { useEvents, Event } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { ALL_TAGS } from '../lib/demoData';
import TagFilterBar from '../components/TagFilterBar';
import EventCard from '../components/EventCard';
import { Compass, X, Sparkles, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Explore() {
  const { events, isLoading, fetchEvents } = useEvents();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const toggleTag = (t: string) => setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

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
    <section className="min-h-screen py-8 bg-[#F3F5F4]">
      <div className="container-app space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#E8EBE9] p-6 rounded-2xl shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight">
                Activity Room Explorer
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF5D5] text-[#11665C] border border-[#D9F36A]">
                Discover
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#858B89] mt-1">
              Browse public group sessions, study circles, and peer activities.
            </p>
          </div>

          <button
            onClick={() => navigate('/create')}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Room</span>
          </button>
        </div>

        {/* Search & Tag Filter Bar */}
        <TagFilterBar 
          allTags={ALL_TAGS} 
          active={tags} 
          onToggle={toggleTag} 
          query={q} 
          onQuery={setQ} 
        />

        {/* Results Counter Bar */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#202124]">
                {filtered.length}
              </span>
              <span className="text-xs text-[#858B89]">
                Activity {filtered.length === 1 ? 'room' : 'rooms'} found
              </span>
            </div>

            {tags.length > 0 && (
              <span className="text-xs font-semibold text-[#147D70]">
                Filtered by {tags.length} tag{tags.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Results Grid / Loading / Empty */}
        {isLoading ? (
          <div className="card p-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-3 border-[#147D70] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#202124]">Loading activity rooms...</p>
            <p className="text-[11px] text-[#858B89]">Connecting to peer database</p>
          </div>
        ) : filtered.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
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
          <div className="card p-16 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#E0F3F1] text-[#147D70] flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#202124]">No Activity Rooms Found</h3>
              <p className="text-xs text-[#858B89] mt-1 max-w-xs mx-auto">
                No active rooms match your current search criteria or tags. Try clearing filters or create your own room!
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              {(q || tags.length > 0) && (
                <button
                  onClick={() => {
                    setQ('');
                    setTags([]);
                  }}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
              <button
                onClick={() => navigate('/create')}
                className="btn-primary text-xs"
              >
                Create an Activity
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
