// src/components/UserInfoCard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { socket } from '../lib/socket';
import { X, Calendar, Mail, FileText, Shield } from 'lucide-react';

interface UserInfoCardProps {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    avatar?: string;
    isOnline?: boolean;
    createdAt: string;
    bio?: string;
  };
  mode: 'tooltip' | 'modal';
  position?: { x: number; y: number };
  onClose: () => void;
}

export default function UserInfoCard({
  user,
  mode = 'tooltip',
  position,
  onClose,
}: UserInfoCardProps) {
  const [isOnline, setIsOnline] = useState<boolean>(!!user.isOnline);

  // Real-time socket status
  useEffect(() => {
    const handleStatusChange = ({
      userId,
      isOnline: online,
    }: {
      userId: string;
      isOnline: boolean;
    }) => {
      if (userId === user.id) setIsOnline(online);
    };

    socket.on('userStatusChanged', handleStatusChange);
    return () => {
      socket.off('userStatusChanged', handleStatusChange);
    };
  }, [user.id]);

  // Lock scroll & ESC key in modal mode
  useEffect(() => {
    if (mode !== 'modal') return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mode, onClose]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const RoleBadge = useMemo(() => {
    if (!user.role || user.role === 'user') return null;

    const colors: Record<string, string> = {
      admin: 'bg-[#EAF5D5] text-[#147D70] border-[#D9F36A]',
      moderator: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      premium: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    const cls = colors[user.role] || 'bg-[#F3F5F4] text-[#202124] border-[#E8EBE9]';

    return (
      <span className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full border ${cls} flex items-center gap-1`}>
        <Shield className="w-3 h-3" />
        {user.role}
      </span>
    );
  }, [user.role]);

  const cardContent = (
    <div className="relative">
      {/* Header Profile Info */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-[#147D70] flex items-center justify-center text-3xl font-bold text-white overflow-hidden border-4 border-white shadow-md">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {(user.name || user.username || user.email)?.[0]?.toUpperCase()}
              </span>
            )}
          </div>

          {/* Online Indicator Badge */}
          {isOnline && (
            <div className="absolute bottom-0 right-0 flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-[11px] font-semibold rounded-full border-2 border-white shadow-sm">
              <span className="w-1.5 h-1.5 bg-[#D9F36A] rounded-full" />
              Online
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold text-[#202124] mb-1">
          {user.name || user.username || 'Unknown User'}
        </h2>

        {!!RoleBadge && <div className="mb-2">{RoleBadge}</div>}

        <div className="flex flex-col gap-1 text-xs text-[#858B89] mt-1">
          <p className="flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#147D70]" />
            {user.email}
          </p>
          <p className="flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#147D70]" />
            Joined {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {/* Bio Section */}
      <div className="bg-[#F3F5F4] p-4 rounded-xl border border-[#E8EBE9]">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-[#147D70]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#858B89]">About</h3>
        </div>

        {user.bio?.trim() ? (
          <p className="text-sm text-[#202124] leading-relaxed whitespace-pre-wrap">
            {user.bio}
          </p>
        ) : (
          <p className="text-xs text-[#858B89] italic text-center py-2">
            No bio provided yet
          </p>
        )}
      </div>
    </div>
  );

  // Tooltip Mode
  if (mode === 'tooltip' && position) {
    return (
      <div
        className="fixed z-40"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, 10px)',
        }}
      >
        <div className="pointer-events-auto bg-white border border-[#E8EBE9] rounded-2xl shadow-xl p-5 min-w-[280px] max-w-[320px]">
          {cardContent}
        </div>
      </div>
    );
  }

  // Modal Mode (Center Screen Portal)
  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#202124]/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-white border border-[#E8EBE9] rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#858B89] hover:text-[#202124] hover:bg-[#F3F5F4] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {cardContent}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
