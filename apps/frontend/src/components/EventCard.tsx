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
    location?: string;
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

  // Show participant count
  // event.participantsCount is number of participants stored (does NOT include creator)
  const storedParticipants = event.participantsCount ?? 0;
  // popularity is the displayed total including creator (if any)
  const displayedPopularity = event.popularity ?? storedParticipants;
  // Determine if creator occupies a slot (frontend best-effort; backend authoritative)
  // Here, assume event.popularity was computed as storedParticipants + (creator occupies slot if not present)
  const displayIsFullyBooked = maxParticipants ? displayedPopularity >= maxParticipants : false;
  // Compute effective count like backend: storedParticipants + (creatorOccupiesSlot ? 1 : 0)
  const creatorOccupiesSlot = displayedPopularity > storedParticipants;
  const effectiveCount = storedParticipants + (creatorOccupiesSlot ? 1 : 0);
  const joinBlockedForNonCreator = maxParticipants ? effectiveCount >= maxParticipants : false;

  // Generate placeholder if no cover image or if cover is a transient blob/file URL
  const isTransientCover = typeof event.cover === 'string' && (event.cover.startsWith('blob:') || event.cover.startsWith('file:'));
  let coverImage = undefined as string | undefined;
  if (!event.cover || isTransientCover) {
    coverImage = `https://placehold.co/600x400/1e293b/f59e0b?text=${encodeURIComponent(event.title)}`;
  } else {
    // If backend returns a relative path like /uploads/..., prefix with backend origin
    if (event.cover.startsWith('/')) {
      coverImage = `http://localhost:5000${event.cover}`;
    } else {
      coverImage = event.cover;
    }
  }

  return (
    <article className="card overflow-hidden group">
      <div className="relative h-48 sm:h-56 md:h-64">
        <img
          src={coverImage}
          alt={event.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src = `https://placehold.co/600x400/1e293b/f59e0b?text=${encodeURIComponent(event.title)}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Participant limit badge */}
        {maxParticipants && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold">
            <span className={displayIsFullyBooked ? 'text-red-400' : 'text-green-400'}>
              {displayedPopularity}/{maxParticipants}
            </span>
            <span className="text-white/80 ml-1">คน</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-lg font-bold">{event.title}</h3>
        <p className="text-sm opacity-80 line-clamp-2">{event.about}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          {event.tags.map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>

        <div className="pt-3 flex gap-2">
          {isParticipant ? (
            <>
              {chatId && (
                <button
                  onClick={() => navigate(`/dm/${chatId}`)}
                  className="btn-primary flex-1"
                >
                  <i className="fas fa-comments mr-2"></i>
                  เข้าแชท
                </button>
              )}
              {!isCreator && (
                <button
                  onClick={handleLeave}
                  className="btn-secondary flex-1"
                  disabled={isJoining}
                >
                  {isJoining ? 'กำลังออก...' : 'ออกจากกิจกรรม'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleJoin}
              className="btn-primary flex-1"
              disabled={isJoining || (joinBlockedForNonCreator && !isCreator)}
            >
              {isJoining ? 'กำลังเข้าร่วม...' : (joinBlockedForNonCreator && !isCreator) ? 'เต็มแล้ว' : 'เข้าร่วม'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
