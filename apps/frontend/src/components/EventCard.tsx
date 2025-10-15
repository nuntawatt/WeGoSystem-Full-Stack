// apps/frontend/src/components/EventCard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../lib/api';
import { toast } from './Toasts';
import { useAuth } from '../hooks/useAuth';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    cover?: string;
    about: string;
    tags: string[];
    location?: string | { coordinates?: number[]; address?: string };
    date?: string;
    popularity?: number;
    participantsCount?: number;
  };
  maxParticipants?: number;
  isParticipant?: boolean;
  isCreator?: boolean;
  chatId?: string;
  onUpdate?: () => void;
}

export default function EventCard({ event, maxParticipants, isParticipant = false, isCreator = false, chatId, onUpdate }: EventCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!user) {
      toast('กรุณาเข้าสู่ระบบก่อนเข้าร่วมกิจกรรม');
      navigate('/signin');
      return;
    }

    try {
      setIsJoining(true);
      const response = await eventsAPI.join(event.id);
      toast('เข้าร่วมกิจกรรมสำเร็จ!');
      
      // Navigate to group chat if chatId is returned
      if (response.data.chatId) {
        navigate(`/dm/${response.data.chatId}`);
      } else if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Join error:', error);
      // apiClient now surfaces server message as error.message
      toast(error?.message || 'ไม่สามารถเข้าร่วมกิจกรรมได้');
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      setIsJoining(true);
      await eventsAPI.leave(event.id);
      toast('ออกจากกิจกรรมสำเร็จ');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Leave error:', error);
      toast(error.response?.data?.error || 'ไม่สามารถออกจากกิจกรรมได้');
    } finally {
      setIsJoining(false);
    }
  };

  // Robust participant count calculation
  // Priority: event.popularity (authoritative) -> participants array (deduped) -> participantsCount
  const participantsArray = Array.isArray((event as any).participants) ? (event as any).participants : null;
  let storedParticipants = 0; // number of stored participants (usually excludes creator)
  let creatorOccupiesSlot = false;
  let computedParticipants = 0;

  if (participantsArray) {
    // Extract user ids (support cases where participant.user may be an object or id)
    const ids = participantsArray
      .map((p: any) => (p && p.user ? String(p.user._id || p.user) : null))
      .filter(Boolean) as string[];
    const uniqueIds = Array.from(new Set(ids));
    storedParticipants = uniqueIds.length;
    const creatorId = (event as any).createdBy ? String((event as any).createdBy) : null;
    creatorOccupiesSlot = creatorId ? !uniqueIds.includes(creatorId) : false;
    computedParticipants = storedParticipants + (creatorOccupiesSlot ? 1 : 0);
  } else {
    storedParticipants = event.participantsCount ?? 0;
    // If popularity is provided and larger than stored count, assume creator occupies a slot
    if ((event as any).popularity != null) {
      creatorOccupiesSlot = (event as any).popularity > storedParticipants;
    } else {
      creatorOccupiesSlot = false;
    }
    computedParticipants = storedParticipants + (creatorOccupiesSlot ? 1 : 0);
  }

  // Final displayed popularity prefers backend-provided popularity when available
  const displayedPopularity = event.popularity ?? computedParticipants;
  const displayIsFullyBooked = maxParticipants ? displayedPopularity >= maxParticipants : false;
  const effectiveCount = computedParticipants;
  const joinBlockedForNonCreator = maxParticipants ? effectiveCount >= maxParticipants : false;

  // Generate placeholder if no cover image or if cover is a transient blob/file URL
  const isTransientCover = typeof event.cover === 'string' && (event.cover.startsWith('blob:') || event.cover.startsWith('file:'));
  let coverImage = undefined as string | undefined;
  if (!event.cover || isTransientCover) {
    coverImage = `https://placehold.co/600x400/1e293b/f59e0b?text=${encodeURIComponent(event.title)}`;
  } else {
    // If backend returns a relative path like /uploads/..., prefix with backend origin
    if (event.cover.startsWith('/')) {
  coverImage = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${event.cover}`;
    } else {
      coverImage = event.cover;
    }
  }

  return (
    <article className="card overflow-hidden group hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 border-2 border-transparent hover:border-amber-500/30">
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
        <img
          src={coverImage}
          alt={event.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src = `https://placehold.co/600x400/1e293b/f59e0b?text=${encodeURIComponent(event.title)}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Participant limit badge with animation */}
        {maxParticipants && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg border border-white/10">
            <span className={displayIsFullyBooked ? 'text-red-400' : 'text-green-400'}>
              {displayedPopularity}/{maxParticipants}
            </span>
            <span className="text-white/80 ml-1">คน</span>
          </div>
        )}
        
        {/* Location and Date info - show on hover */}
        <div className="absolute bottom-3 left-3 right-3 space-y-1.5 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          {event.location && (
            <div className="flex items-center gap-2 text-white/90 text-sm bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="truncate">
                {typeof event.location === 'string' ? event.location : event.location?.address || 'ไม่ระบุสถานที่'}
              </span>
            </div>
          )}
          {event.date && (
            <div className="flex items-center gap-2 text-white/90 text-sm bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>{new Date(event.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-3">
        <h3 className="text-xl font-bold text-white line-clamp-2 font-['Poppins']">{event.title}</h3>
        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{event.about}</p>

        <div className="flex flex-wrap gap-2 pt-2">
          {event.tags.slice(0, 3).map((t) => (
            <span key={t} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/30">
              {t}
            </span>
          ))}
          {event.tags.length > 3 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-400 border border-slate-600/50">
              +{event.tags.length - 3}
            </span>
          )}
        </div>

        <div className="pt-4 flex gap-3">
          {isParticipant ? (
            <>
              {chatId && (
                <button
                  onClick={() => navigate(`/dm/${chatId}`)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                  เข้าแชท
                </button>
              )}
              {!isCreator && (
                <button
                  onClick={handleLeave}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-400 font-semibold border border-red-500/30 hover:border-red-400 shadow-lg transition-all duration-200"
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังออก...
                    </span>
                  ) : 'ออกจากกิจกรรม'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleJoin}
              className={`flex-1 px-4 py-3 rounded-lg font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                joinBlockedForNonCreator && !isCreator
                  ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
              }`}
              disabled={isJoining || (joinBlockedForNonCreator && !isCreator)}
            >
              {isJoining ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังเข้าร่วม...
                </>
              ) : (joinBlockedForNonCreator && !isCreator) ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                  เต็มแล้ว
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  เข้าร่วมกิจกรรม
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
