import { useState } from 'react';
import { api } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { useDM } from '../hooks/useDM';
import UserInfoCard from './UserInfoCard';
import { Users, MessageCircle, Shield } from 'lucide-react';

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
      {/* Header Member Counter */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#F3F5F4] rounded-xl border border-[#E8EBE9]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#147D70]" />
          <span className="text-xs font-bold text-[#202124]">{members.length}</span>
          <span className="text-xs text-[#858B89]">{members.length === 1 ? 'Participant' : 'Participants'}</span>
        </div>
      </div>

      {/* Members Scroll List */}
      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {members.map((member) => {
          const isMe = user && member.id === user._id;
          const isAdmin = member.role === 'admin';
          const displayName = getDisplayName(member);
          const initial = (displayName.trim().charAt(0) || '?').toUpperCase();

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-[#F3F5F4] transition-all group border border-[#E8EBE9] hover:border-[#147D70]/30 cursor-pointer shadow-xs"
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
                      className="w-10 h-10 rounded-full object-cover border border-[#E8EBE9]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#147D70] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                      {initial}
                    </div>
                  )}
                  {member.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#202124] truncate flex items-center gap-1.5 text-sm">
                    <span className="truncate">{displayName}</span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#F3F5F4] text-[#858B89] rounded-md font-medium border border-[#E8EBE9]">
                        You
                      </span>
                    )}
                    {isAdmin && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#EAF5D5] text-[#147D70] rounded-md font-semibold flex items-center gap-0.5 border border-[#D9F36A]">
                        <Shield className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#858B89] truncate">
                    {member.name}
                  </div>
                </div>
              </div>

              {!isMe && (
                <button
                  className="p-2 rounded-lg bg-[#F3F5F4] hover:bg-[#EAF5D5] opacity-0 group-hover:opacity-100 transition-all text-[#858B89] hover:text-[#147D70] border border-transparent hover:border-[#D9F36A]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDM(member);
                  }}
                  title="Send Direct Message"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* UserInfoCard Modal */}
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
