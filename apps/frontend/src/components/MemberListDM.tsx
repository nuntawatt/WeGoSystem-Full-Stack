// apps/frontend/src/components/MemberListDM.tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDM } from '../hooks/useDM';

interface Member {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  username?: string;
}

interface MemberListDMProps {
  members: Member[];
}

export default function MemberListDM({ members }: MemberListDMProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { openDM } = useDM();

  const handleDM = async (member: Member) => {
    // Build peer meta and open the floating direct-message panel for this member
    const peer: any = {
      uid: member.id,
      name: member.username || member.name.split('@')[0] || member.name,
      avatar: member.avatar
    };
    try {
      openDM(peer);
    } catch (err) {
      console.error('Failed to open DM:', err);
    }
  };

  // Extract username from email
  const getDisplayName = (member: Member) => {
    if (member.username) return member.username;
    // Extract username from email (before @)
    return member.name.split('@')[0] || member.name;
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-white/60 uppercase tracking-wide">
        สมาชิก {members.length} คน
      </div>
      <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto thin-scrollbar">
        {members.map((member) => {
          const isMe = user && member.id === user._id;
          const isAdmin = member.role === 'admin';
          const displayName = getDisplayName(member);
          const initial = displayName.charAt(0).toUpperCase();
          
          return (
            <div 
              key={member.id} 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  {member.avatar && !(member.avatar.startsWith('blob:') || member.avatar.startsWith('file:')) ? (
                    <img 
                      src={member.avatar} 
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center text-black font-bold">
                      {initial}
                    </div>
                  )}
                  {isAdmin && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-crown text-[10px] text-black"></i>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {displayName}
                    {isMe && (
                      <span className="text-xs text-brand-gold">(คุณ)</span>
                    )}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {member.name}
                  </div>
                  <div className="text-[10px] text-white/40">
                    {isAdmin ? 'ผู้ดูแล' : 'สมาชิก'}
                  </div>
                </div>
              </div>
              {!isMe && (
                <button 
                  className="btn-ghost px-3 py-1 text-xs opacity-0 group-hover:opacity-100 transition"
                  onClick={() => handleDM(member)}
                  title="ส่งข้อความส่วนตัว"
                >
                  <i className="fas fa-comment-dots"></i>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
