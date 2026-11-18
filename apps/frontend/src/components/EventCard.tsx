import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../lib/api';
import { showSuccess, showError, showWarning } from '../lib/swal';
import { useAuth } from '../hooks/useAuth';
import ReportModal from './ReportModal';
import { 
  MapPin, 
  Calendar, 
  Users, 
  MessageCircle, 
  LogOut as LogOutIcon, 
  UserPlus, 
  Flag, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

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

export default function EventCard({
  event,
  maxParticipants,
  isParticipant = false,
  isCreator = false,
  chatId,
  onUpdate,
}: EventCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleJoin = async () => {
    if (!user) {
      showWarning('กรุณาเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนเข้าร่วมกิจกรรม');
      navigate('/auth/signin');
      return;
    }

    try {
      setIsJoining(true);
      const response = await eventsAPI.join(event.id);
      showSuccess('เข้าร่วมกิจกรรมสำเร็จ!', 'คุณเข้าร่วมกลุ่มกิจกรรมนี้แล้ว');
      
      if (response.data.chatId) {
        navigate(`/dm/${response.data.chatId}`);
      } else if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Join error:', error);
      showError('เข้าร่วมไม่สำเร็จ', error?.message || 'ไม่สามารถเข้าร่วมกิจกรรมได้');
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      setIsJoining(true);
      await eventsAPI.leave(event.id);
      showSuccess('ออกจากกิจกรรมสำเร็จ!', 'คุณออกจากกิจกรรมแล้ว');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Leave error:', error);
      showError('ออกไม่สำเร็จ', error.response?.data?.error || 'ไม่สามารถออกจากกิจกรรมได้');
    } finally {
      setIsJoining(false);
    }
  };

  // Participant calculation
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

  // Placeholder cover
  const isTransientCover = typeof event.cover === 'string' && (event.cover.startsWith('blob:') || event.cover.startsWith('file:'));
  let coverImage = undefined as string | undefined;
  if (!event.cover || isTransientCover) {
    coverImage = `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80`;
  } else {
    if (event.cover.startsWith('/')) {
      coverImage = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${event.cover}`;
    } else {
      coverImage = event.cover;
    }
  }

  return (
    <>
      <article className="card card-hover overflow-hidden flex flex-col justify-between group">
        {/* Top Image Section */}
        <div>
          <div className="relative h-48 w-full bg-[#F3F5F4] overflow-hidden">
            <img
              src={coverImage}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#202124]/70 via-transparent to-black/20" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              {/* Participant Pill */}
              {maxParticipants ? (
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow-xs ${
                  displayIsFullyBooked
                    ? 'bg-[#202124]/80 text-[#D9F36A] border border-[#D9F36A]/40'
                    : 'bg-white/90 text-[#147D70] border border-white'
                }`}>
                  <Users className="w-3.5 h-3.5" />
                  <span>{displayedPopularity} / {maxParticipants}</span>
                </div>
              ) : (
                <div />
              )}

              {/* Report Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReportModal(true);
                }}
                className="w-7 h-7 rounded-full bg-[#202124]/60 hover:bg-[#202124] text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                title="Report Activity"
                aria-label="Report Activity"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bottom Overlay: Location & Date */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2 text-white text-[11px] font-semibold">
              {event.location && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#202124]/75 backdrop-blur-sm truncate max-w-[150px]">
                  <MapPin className="w-3 h-3 text-[#D9F36A]" />
                  <span className="truncate">
                    {typeof event.location === 'string' ? event.location : event.location?.address || 'On-site'}
                  </span>
                </div>
              )}
              {event.date && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#202124]/75 backdrop-blur-sm">
                  <Calendar className="w-3 h-3 text-[#D9F36A]" />
                  <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content Details */}
          <div className="p-5 space-y-3">
            <h3 className="text-base font-bold text-[#202124] line-clamp-1 group-hover:text-[#147D70] transition-colors">
              {event.title}
            </h3>

            <p className="text-xs text-[#5F6664] line-clamp-2 leading-relaxed">
              {event.about || 'Join this group activity room to collaborate and meet peers.'}
            </p>

            {/* Tag Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {event.tags && event.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#E0F3F1] text-[#11665C] border border-[#BFE7E2]"
                >
                  {t}
                </span>
              ))}
              {event.tags && event.tags.length > 3 && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F3F5F4] text-[#858B89] border border-[#E8EBE9]">
                  +{event.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="p-5 pt-0 border-t border-[#E8EBE9] mt-3 pt-3 flex gap-2">
          {isParticipant ? (
            <>
              {chatId && (
                <button
                  onClick={() => navigate(`/dm/${chatId}`)}
                  className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open Room Chat</span>
                </button>
              )}
              {!isCreator && (
                <button
                  onClick={handleLeave}
                  disabled={isJoining}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                  title="Leave activity"
                >
                  <LogOutIcon className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleJoin}
              disabled={isJoining || (joinBlockedForNonCreator && !isCreator)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                joinBlockedForNonCreator && !isCreator
                  ? 'bg-[#E8EBE9] text-[#858B89] cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              {isJoining ? (
                <span>Joining...</span>
              ) : joinBlockedForNonCreator && !isCreator ? (
                <span>Full Capacity</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Join Activity Room</span>
                </>
              )}
            </button>
          )}
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
