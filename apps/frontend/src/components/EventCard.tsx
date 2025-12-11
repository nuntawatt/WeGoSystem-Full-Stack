// apps/frontend/src/components/EventCard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../lib/api';
import { toast } from './Toasts';
import { useAuth } from '../hooks/useAuth';
import ReportModal from './ReportModal';
import { MapPin, Calendar, Users, MessageCircle, LogOut as LogOutIcon, UserPlus } from 'lucide-react';

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
  const [showReportModal, setShowReportModal] = useState(false);

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
  const participantsArray = Array.isArray((event as any).participants) ? (event as any).participants : null;
  let storedParticipants = 0;
  let creatorOccupiesSlot = false;
  let computedParticipants = 0;

  if (participantsArray) {
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
    if ((event as any).popularity != null) {
      creatorOccupiesSlot = (event as any).popularity > storedParticipants;
    } else {
      creatorOccupiesSlot = false;
    }
    computedParticipants = storedParticipants + (creatorOccupiesSlot ? 1 : 0);
  }

  const displayedPopularity = event.popularity ?? computedParticipants;
  const displayIsFullyBooked = maxParticipants ? displayedPopularity >= maxParticipants : false;
  const effectiveCount = computedParticipants;
  const joinBlockedForNonCreator = maxParticipants ? effectiveCount >= maxParticipants : false;

  // Generate placeholder if no cover image
  const isTransientCover = typeof event.cover === 'string' && (event.cover.startsWith('blob:') || event.cover.startsWith('file:'));
  let coverImage = undefined as string | undefined;
  if (!event.cover || isTransientCover) {
    coverImage = `https://placehold.co/600x400/1e293b/f59e0b?text=${encodeURIComponent(event.title)}`;
  } else {
    if (event.cover.startsWith('/')) {
      coverImage = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${event.cover}`;
    } else {
      coverImage = event.cover;
    }
  }

  // Tag colors - professional muted
  const tagColors = [
    { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
    { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
    { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
  ];

  return (
    <>
      <article className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={coverImage}
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/600x400/1e293b/f59e0b?text=${encodeURIComponent(event.title)}`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

          {/* Participant badge */}
          {maxParticipants && (
            <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
              displayIsFullyBooked 
                ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            }`}>
              <Users className="w-3.5 h-3.5" />
              {displayedPopularity}/{maxParticipants}
            </div>
          )}

          {/* Location and Date - Bottom overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
            {event.location && (
              <div className="flex items-center gap-1.5 text-white text-xs px-2.5 py-1 rounded bg-slate-900/70 backdrop-blur-sm">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[120px]">
                  {typeof event.location === 'string' ? event.location : event.location?.address || 'ไม่ระบุ'}
                </span>
              </div>
            )}
            {event.date && (
              <div className="flex items-center gap-1.5 text-white text-xs px-2.5 py-1 rounded bg-slate-900/70 backdrop-blur-sm">
                <Calendar className="w-3 h-3" />
                {new Date(event.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-3">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white line-clamp-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {event.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{event.about}</p>

          {/* Tags - Professional style */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {event.tags.slice(0, 3).map((t, i) => {
              const color = tagColors[i % tagColors.length];
              return (
                <span 
                  key={t} 
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${color.bg} ${color.text}`}
                >
                  {t}
                </span>
              );
            })}
            {event.tags.length > 3 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                +{event.tags.length - 3}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-2">
            {isParticipant ? (
              <>
                {chatId && (
                  <button
                    onClick={() => navigate(`/dm/${chatId}`)}
                    className="flex-1 px-4 py-2.5 rounded-sm text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    เข้าแชท
                  </button>
                )}
                {!isCreator && (
                  <button
                    onClick={handleLeave}
                    className="flex-1 px-4 py-2.5 rounded-sm text-sm font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center justify-center gap-2"
                    disabled={isJoining}
                  >
                    <LogOutIcon className="w-4 h-4" />
                    {isJoining ? 'กำลังออก...' : 'ออกจากกิจกรรม'}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleJoin}
                className={`flex-1 px-4 py-2.5 rounded-sm text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                  joinBlockedForNonCreator && !isCreator
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100'
                }`}
                disabled={isJoining || (joinBlockedForNonCreator && !isCreator)}
              >
                {isJoining ? (
                  <>กำลังเข้าร่วม...</>
                ) : (joinBlockedForNonCreator && !isCreator) ? (
                  <>เต็มแล้ว</>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    เข้าร่วมกิจกรรม
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="activity"
        targetId={event.id}
      />
    </>
  );
}
