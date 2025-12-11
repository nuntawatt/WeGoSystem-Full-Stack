import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { X, User, Mail, Calendar, Tag } from 'lucide-react';

type Profile = {
  userId: string;
  name: string;
  bio?: string;
  avatar?: string;
  tags?: string[];
  availability?: any;
  createdAt: string;
};

type User = {
  _id: string;
  email: string;
  username?: string;
  role?: string;
  createdAt?: string;
};

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  userId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userId: string | null;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/profiles/${userId}`);
      setProfile(response.data.profile);
      setUser(response.data.user);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err?.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative bg-white dark:bg-slate-800 rounded-sm shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-600 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && profile && user && (
          <div>
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center mb-4 overflow-hidden shadow-md">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold text-white">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Name */}
              <h3 className="text-2xl font-serif font-medium text-slate-800 dark:text-slate-100 mb-1">{profile.name}</h3>
              
              {/* Email */}
              <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1.5 mb-2">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
              
              {/* Role Badge */}
              {user.role === 'admin' && (
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-sm text-xs font-medium text-amber-700 dark:text-amber-400">
                  Admin
                </span>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Bio
                </h4>
                <p className="text-slate-700 dark:text-slate-300">{profile.bio}</p>
              </div>
            )}

            {/* Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Interests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-sm text-xs font-medium text-teal-700 dark:text-teal-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
