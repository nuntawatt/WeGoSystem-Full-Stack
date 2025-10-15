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
  isOnline?: boolean;
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
      avatar: member.avatar,
      isOnline: member.isOnline
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
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-xl border border-amber-500/20">
        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
        <span className="text-sm font-bold text-amber-300">{members.length}</span>
        <span className="text-xs text-slate-300">{members.length === 1 ? 'Member' : 'Members'}</span>
      </div>
      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto thin-scrollbar pr-1">
        {members.map((member) => {
          const isMe = user && member.id === user._id;
          const isAdmin = member.role === 'admin';
          const displayName = getDisplayName(member);
          const initial = displayName.charAt(0).toUpperCase();
          
          return (
            <div 
              key={member.id} 
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/60 hover:to-slate-600/60 transition-all duration-300 group border border-slate-600/30 hover:border-amber-500/40 cursor-pointer shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  {member.avatar && !(member.avatar.startsWith('blob:') || member.avatar.startsWith('file:')) ? (
                    <img 
                      src={member.avatar} 
                      alt={displayName}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400/40 shadow-xl group-hover:ring-amber-400/70 group-hover:scale-105 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-base shadow-xl ring-2 ring-amber-400/40 group-hover:ring-amber-400/70 group-hover:scale-105 transition-all duration-300">
                      {initial}
                    </div>
                  )}
                  {member.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-slate-800 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate flex items-center gap-1.5 text-sm">
                    <span>{displayName}</span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/30 text-amber-300 rounded-md font-bold border border-amber-400/30">You</span>
                    )}
                    {isAdmin && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-300 rounded-md font-bold flex items-center gap-1 border border-amber-400/30">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    {member.name}
                  </div>
                </div>
              </div>
              {!isMe && (
                <button 
                  className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 opacity-0 group-hover:opacity-100 transition-all duration-300 text-amber-400 hover:text-amber-300"
                  onClick={() => handleDM(member)}
                  title="Send direct message"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
