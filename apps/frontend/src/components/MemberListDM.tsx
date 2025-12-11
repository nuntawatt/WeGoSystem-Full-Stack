import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { useDM } from '../hooks/useDM';
import UserInfoCard from './UserInfoCard';
import { Users, MessageCircle, Star, Shield } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  username?: string;
  isOnline?: boolean;
  bio?: string;
  createdAt?: string;
}

interface MemberListDMProps {
  members: Member[];
}

export default function MemberListDM({ members }: MemberListDMProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hoveredMember, setHoveredMember] = useState<Member | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [infoModalMember, setInfoModalMember] = useState<Member | null>(null);

  const { openDM } = useDM();

  const handleDM = async (member: Member) => {
    const peer: any = {
      uid: member.id,
      name: member.username || member.name.split('@')[0] || member.name,
      avatar: member.avatar,
      isOnline: member.isOnline
    };
    try {
      openDM(peer);
    } catch (err) {
      console.error('Failed to open DM:', err);
    }
  };

  const getDisplayName = (member: Member) => {
    if (member.username) return member.username;
    return member.name.split('@')[0] || member.name;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-sm border border-slate-200 dark:border-slate-600">
        <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{members.length}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{members.length === 1 ? 'Member' : 'Members'}</span>
      </div>
      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {members.map((member) => {
          const isMe = user && member.id === user._id;
          const isAdmin = member.role === 'admin';
          const displayName = getDisplayName(member);
          const initial = displayName.charAt(0).toUpperCase();

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-sm bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group border border-slate-200 dark:border-slate-700 cursor-pointer"
              onMouseEnter={(e) => {
                setHoveredMember(member);
                setTooltipPosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                if (hoveredMember?.id === member.id) {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }
              }}
              onMouseLeave={() => {
                setHoveredMember(null);
                setTooltipPosition(null);
              }}
              onClick={async () => {
                try {
                  const res = await api.get(`/profiles/${member.id}`).catch(() => null);
                  const prof = res && res.data ? res.data : null;
                  setInfoModalMember({
                    ...member,
                    bio: (prof && (prof.bio || prof.description)) ? (prof.bio || prof.description) : (member.bio || '')
                  });
                } catch (err) {
                  console.error('Failed to load profile for modal:', err);
                  setInfoModalMember(member);
                }
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  {member.avatar && !(member.avatar.startsWith('blob:') || member.avatar.startsWith('file:')) ? (
                    <img
                      src={member.avatar}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-white font-medium text-sm">
                      {initial}
                    </div>
                  )}
                  {member.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-teal-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5 text-sm">
                    <span>{displayName}</span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-sm font-medium">You</span>
                    )}
                    {isAdmin && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-sm font-medium flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {member.name}
                  </div>
                </div>
              </div>
              {!isMe && (
                <button
                  className="p-2 rounded-sm bg-slate-100 dark:bg-slate-700 hover:bg-teal-100 dark:hover:bg-teal-900/30 opacity-0 group-hover:opacity-100 transition-all text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDM(member);
                  }}
                  title="Send direct message"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* UserInfoCard - Tooltip Mode */}
      {hoveredMember && tooltipPosition && (
        <UserInfoCard
          user={{
            id: hoveredMember.id,
            name: hoveredMember.username || hoveredMember.name,
            username: hoveredMember.username || hoveredMember.name.split('@')[0],
            email: hoveredMember.name,
            role: hoveredMember.role,
            avatar: hoveredMember.avatar,
            isOnline: hoveredMember.isOnline,
            createdAt: hoveredMember.createdAt || new Date().toISOString(),
            bio: hoveredMember.bio
          }}
          mode="tooltip"
          position={tooltipPosition}
          onClose={() => {
            setHoveredMember(null);
            setTooltipPosition(null);
          }}
        />
      )}

      {/* UserInfoCard - Modal Mode */}
      {infoModalMember && (
        <UserInfoCard
          user={{
            id: infoModalMember.id,
            name: infoModalMember.username || infoModalMember.name,
            username: infoModalMember.username || infoModalMember.name.split('@')[0],
            email: infoModalMember.name,
            role: infoModalMember.role,
            avatar: infoModalMember.avatar,
            isOnline: infoModalMember.isOnline,
            createdAt: infoModalMember.createdAt || new Date().toISOString(),
            bio: infoModalMember.bio
          }}
          mode="modal"
          onClose={() => setInfoModalMember(null)}
        />
      )}
    </div>
  );
}
