import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';

interface Profile {
  name?: string;
  avatar?: string;
  bio?: string;
  updatedAt?: string;
}

export default function AdminLayout() {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', avatar: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่า user เป็น admin หรือไม่
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await api.get(`/profiles/${user._id}`);
      setProfile(response.data);
      setFormData({
        name: response.data?.name || '',
        bio: response.data?.bio || '',
        avatar: response.data?.avatar || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = () => {
    setShowProfileModal(true);
    fetchProfile();
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await api.post('/profiles', {
        userId: user._id,
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar
      });
      await fetchProfile();
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/activities', label: 'Activities', icon: '🎯' },
    { path: '/admin/events', label: 'Events', icon: '📅' },
    { path: '/admin/groups', label: 'Groups', icon: '👫' },
    { path: '/admin/chats', label: 'Chats', icon: '💬' }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-800/50 backdrop-blur-sm border-r border-primary-700 shadow-2xl fixed h-full">
        <div className="p-6 border-b border-primary-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-primary-400 text-sm mt-1">Management Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">{navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                    : 'text-primary-300 hover:bg-primary-700 hover:text-white'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>


        {/* User Info */}
        <div className="p-4 border-t border-white/10">
          <div 
            className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-primary-700 rounded-lg p-2 transition-colors"
            onClick={handleOpenProfile}
          >
            {profile?.avatar ? (
              <img
                src={profile.avatar.startsWith('http') ? profile.avatar : `http://localhost:3000${profile.avatar}`}
                alt={profile.name || user?.email}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">
                {profile?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-primary-400">Admin • Click to edit</p>
            </div>
          </div>
          <button
            onClick={() => {
              logOut();
              navigate('/');
            }}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        <Outlet />
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-primary-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-primary-800 border-b border-primary-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Admin Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-primary-400 hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {loading && !profile ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
                </div>
              ) : (
                <>
                  {/* Avatar & Basic Info */}
                  <div className="flex items-center gap-4">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar.startsWith('http') ? profile.avatar : `http://localhost:3000${profile.avatar}`}
                        alt={profile.name || user?.email}
                        className="w-20 h-20 rounded-full object-cover border-2 border-emerald-400/30"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-400 font-bold text-3xl">
                          {user?.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your name"
                          className="w-full bg-primary-700 text-white rounded-lg px-3 py-2 border border-primary-600 focus:border-emerald-400 focus:outline-none text-xl font-bold"
                        />
                      ) : (
                        <h3 className="text-2xl font-bold text-white">{profile?.name || 'No name set'}</h3>
                      )}
                      <p className="text-primary-300 mt-1">{user?.email}</p>
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div>
                    <label className="text-primary-400 text-sm mb-2 block">Bio</label>
                    {editMode ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full bg-primary-700 text-white rounded-lg px-3 py-2 border border-primary-600 focus:border-emerald-400 focus:outline-none resize-none"
                      />
                    ) : (
                      <p className="text-white bg-primary-700/50 rounded-lg p-3">
                        {profile?.bio || 'No bio added yet'}
                      </p>
                    )}
                  </div>

                  {/* Avatar URL */}
                  {editMode && (
                    <div>
                      <label className="text-primary-400 text-sm mb-2 block">Avatar URL</label>
                      <input
                        type="text"
                        value={formData.avatar}
                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full bg-primary-700 text-white rounded-lg px-3 py-2 border border-primary-600 focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-primary-700">
                    <div>
                      <label className="text-primary-400 text-sm">Role</label>
                      <p className="text-white">
                        <span className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400 border border-red-500/30">
                          Admin
                        </span>
                      </p>
                    </div>
                    {profile?.updatedAt && (
                      <div>
                        <label className="text-primary-400 text-sm">Profile Updated</label>
                        <p className="text-white">{new Date(profile.updatedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-primary-700">
                    {editMode ? (
                      <>
                        <button
                          onClick={() => setEditMode(false)}
                          className="flex-1 px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-600 transition-colors"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400"></div>
                              Saving...
                            </span>
                          ) : (
                            <>
                              <i className="fas fa-save mr-2"></i>Save Changes
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowProfileModal(false)}
                          className="flex-1 px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-600 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => setEditMode(true)}
                          className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                        >
                          <i className="fas fa-edit mr-2"></i>Edit Profile
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
