import React, { useEffect, useState } from 'react';
import { socket } from '../lib/socket';

interface UserInfoCardProps {
  user: {
    id: string;
    name?: string;
    username?: string;
    email: string;
    role?: string;
    avatar?: string;
    isOnline?: boolean;
    createdAt?: string;
  };
  mode?: 'tooltip' | 'modal';
  position?: { x: number; y: number };
  onClose?: () => void;
}

export default function UserInfoCard({ user, mode = 'tooltip', position, onClose }: UserInfoCardProps) {
  const [isOnline, setIsOnline] = useState(user.isOnline || false);

  useEffect(() => {
    // Listen for real-time status updates
    const handleStatusChange = ({ userId, isOnline: online }: { userId: string; isOnline: boolean }) => {
      if (userId === user.id) {
        setIsOnline(online);
      }
    };

    socket.on('userStatusChanged', handleStatusChange);

    return () => {
      socket.off('userStatusChanged', handleStatusChange);
    };
  }, [user.id]);

  useEffect(() => {
    if (mode === 'modal') {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [mode, onClose]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRoleBadge = (role?: string) => {
    if (!role || role === 'user') return null;
    
    const colors = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      moderator: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      premium: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    };

    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${colors[role as keyof typeof colors] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
        {role.toUpperCase()}
      </span>
    );
  };

  const cardContent = (
    <div className="relative">
      {/* Avatar & Status */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl font-bold text-white border-2 border-slate-600 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name || user.username} className="w-full h-full object-cover" />
            ) : (
              <span>{(user.name || user.username || user.email)?.[0]?.toUpperCase()}</span>
            )}
          </div>
          {/* Online Status Badge */}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-800 ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`}>
            <div className={`w-full h-full rounded-full ${isOnline ? 'animate-ping bg-green-400 opacity-75' : ''}`} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-white truncate">
              {user.name || user.username || 'Unknown User'}
            </h3>
            {getRoleBadge(user.role)}
          </div>
          <p className="text-sm text-slate-400 truncate">{user.email}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`} />
            <span className={`text-xs font-medium ${isOnline ? 'text-green-400' : 'text-slate-400'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="space-y-2 pt-3 border-t border-slate-700/50">
        {user.username && (
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-slate-300">@{user.username}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-slate-300 truncate">{user.email}</span>
        </div>

        {user.createdAt && (
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-slate-400">Joined {formatDate(user.createdAt)}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (mode === 'tooltip' && position) {
    return (
      <div
        className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, 10px)'
        }}
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl p-4 min-w-[280px] max-w-[320px]">
          {cardContent}
        </div>
      </div>
    );
  }

  // Modal mode
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {cardContent}
      </div>
    </div>
  );
}
