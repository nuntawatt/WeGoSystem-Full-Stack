// src/components/UserInfoCard.tsx
import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { socket } from "../lib/socket";
import { X, User, Calendar, Mail, FileText } from "lucide-react";

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
  mode: "tooltip" | "modal";
  position?: { x: number; y: number }; // ใช้กับ tooltip เท่านั้น
  onClose: () => void;
}

export default function UserInfoCard({
  user,
  mode = "tooltip",
  position,
  onClose,
}: UserInfoCardProps) {
  const [isOnline, setIsOnline] = useState<boolean>(!!user.isOnline);

  // ----- socket: real-time status -----
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

    socket.on("userStatusChanged", handleStatusChange);
    return () => {
      socket.off("userStatusChanged", handleStatusChange);
    };
  }, [user.id]);

  // ----- lock scroll & ESC to close (modal only) -----
  useEffect(() => {
    if (mode !== "modal") return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mode, onClose]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const RoleBadge = useMemo(() => {
    if (!user.role || user.role === "user") return null;

    const colors: Record<string, string> = {
      admin: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700",
      moderator: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700",
      premium: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-700",
    };

    const cls = colors[user.role] || "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";

    return (
      <span className={`px-2.5 py-1 text-xs font-medium uppercase tracking-wider rounded-sm border ${cls}`}>
        {user.role}
      </span>
    );
  }, [user.role]);

  const cardContent = (
    <div className="relative">
      {/* Avatar + name + role */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-5">
          <div className="w-32 h-32 rounded-full bg-teal-700 flex items-center justify-center text-5xl font-semibold text-white overflow-hidden border-4 border-slate-200 dark:border-slate-600">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white">
                {(user.name || user.username || user.email)?.[0]?.toUpperCase()}
              </span>
            )}
          </div>

          {/* Online Badge */}
          {isOnline && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-full">
              <div className="w-2 h-2 bg-white rounded-full" />
              Online
            </div>
          )}
        </div>

        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {user.name || user.username || "Unknown User"}
        </h2>

        {!!RoleBadge && <div className="mb-3">{RoleBadge}</div>}

        <div className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
          <p className="flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Joined {formatDate(user.createdAt)}
          </p>
          <p className="flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {user.email}
          </p>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-sm border border-slate-200 dark:border-slate-600">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Bio</h3>
        </div>

        {user.bio?.trim() ? (
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {user.bio}
          </p>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 italic text-center py-4">
            No bio yet
          </p>
        )}
      </div>
    </div>
  );

  // ================== TOOLTIP MODE ==================
  if (mode === "tooltip" && position) {
    return (
      <div
        className="fixed z-40"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, 10px)",
        }}
      >
        <div className="pointer-events-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-lg p-4 min-w-[280px] max-w-[320px]">
          {cardContent}
        </div>
      </div>
    );
  }

  // ================== MODAL MODE (CENTER) ==================
  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-xl p-8 w-full max-w-xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-500 dark:text-slate-400"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {cardContent}
      </div>
    </div>
  );

  // ใช้ Portal เพื่อไม่ให้ modal โดน parent (sidebar/chat) ที่มี overflow/stacking ตัดทอน
  return createPortal(modalNode, document.body);
}
