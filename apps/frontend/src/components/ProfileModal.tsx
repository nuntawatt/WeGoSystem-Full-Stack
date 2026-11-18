import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { X, User, Mail, Calendar, Tag, Shield } from 'lucide-react';

type Profile = {
  userId: string;
  name: string;
  bio?: string;
  avatar?: string;
  tags?: string[];
  availability?: any;
  createdAt: string;
};

type UserData = {
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
  const [user, setUser] = useState<UserData | null>(null);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-2xl shadow-2xl border border-[#E8EBE9] max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#858B89] hover:text-[#202124] hover:bg-[#F3F5F4] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 border-3 border-[#147D70] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#858B89]">Loading profile...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && profile && user && (
          <div className="space-y-6">
            {/* Header Avatar & Info */}
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-[#147D70] flex items-center justify-center mb-3 overflow-hidden border-4 border-white shadow-md">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-[#202124]">{profile.name}</h3>
              
              <p className="text-xs text-[#858B89] flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-[#147D70]" />
                {user.email}
              </p>
              
              {user.role === 'admin' && (
                <span className="mt-2.5 px-3 py-0.5 bg-[#EAF5D5] border border-[#D9F36A] rounded-full text-xs font-semibold text-[#147D70] flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="p-4 bg-[#F3F5F4] rounded-xl border border-[#E8EBE9]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#858B89] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#147D70]" />
                  Bio
                </h4>
                <p className="text-sm text-[#202124] leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Interests / Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#858B89] mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#147D70]" />
                  Interests
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#EAF5D5] border border-[#D9F36A]/50 rounded-full text-xs font-medium text-[#147D70]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="pt-4 border-t border-[#E8EBE9] flex items-center justify-between text-xs text-[#858B89]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#147D70]" />
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Actions */}
            <div>
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 font-semibold text-sm rounded-xl border border-[#E8EBE9] bg-[#F3F5F4] hover:bg-[#E8EBE9] text-[#202124] transition-colors"
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
