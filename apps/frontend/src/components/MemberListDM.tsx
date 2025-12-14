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
  const [infoModalMember, setInfoModalMember] = useState<Member | null>(null);

  const { openDM } = useDM();

  const handleDM = async (member: Member) => {
    const rawName = (member.name || '').toString();
    const emailPrefix = rawName ? (rawName.split('@')[0] || rawName) : '';
    const peer: any = {
      uid: member.id,
      name: (member.username || '').toString().trim() || emailPrefix || rawName || 'User',
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
    const username = (member.username || '').toString().trim();
    if (username) return username;
    const rawName = (member.name || '').toString().trim();
    if (!rawName) return 'User';
    const part = rawName.split('@')[0];
    return (part || rawName || 'User').toString();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 dark:bg-slate-700/30 dark:border-slate-600/30">
        <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{members.length}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{members.length === 1 ? 'Member' : 'Members'}</span>
      </div>
      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent dark:scrollbar-thumb-slate-600">
        {members.map((member) => {
          const isMe = user && member.id === user._id;
          const isAdmin = member.role === 'admin';
          const displayName = getDisplayName(member);
          const initial = (displayName.trim().charAt(0) || '?').toUpperCase();

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-50 transition-colors group border border-slate-200 hover:border-teal-500/30 cursor-pointer dark:bg-slate-700/30 dark:hover:bg-slate-600/40 dark:border-slate-600/20"

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
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-500/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-teal-500/20">
                      {initial}
                    </div>
                  )}
                  {member.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse dark:border-slate-800"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white truncate flex items-center gap-1.5 text-sm">
                    <span>{displayName}</span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium dark:bg-slate-600/50 dark:text-slate-300">You</span>
                    )}
                    {isAdmin && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-md font-medium flex items-center gap-1 border border-amber-500/30">
                        <Shield className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {member.name}
                  </div>
                </div>
              </div>
              {!isMe && (
                <button
                  className="p-2 rounded-lg bg-slate-100 hover:bg-teal-500/10 opacity-0 group-hover:opacity-100 transition-all text-slate-500 hover:text-teal-700 border border-transparent hover:border-teal-500/20 dark:bg-slate-600/30 dark:hover:bg-teal-500/20 dark:text-slate-400 dark:hover:text-teal-400 dark:hover:border-teal-500/30"
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



      {/* UserInfoCard - Modal Mode */}
      {infoModalMember && (
        <UserInfoCard
          user={{
            id: infoModalMember.id,
            name: infoModalMember.username || infoModalMember.name,
            username:
              (infoModalMember.username || '').toString().trim() ||
              ((infoModalMember.name || '').toString().split('@')[0] || 'user'),
            email: (infoModalMember.name || '').toString(),
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
