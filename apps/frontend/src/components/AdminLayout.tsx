import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import { LayoutDashboard, Users, Activity, Flag, LogOut, Settings, X, ChevronRight, Shield } from 'lucide-react';
import { showSuccess, showError } from '../lib/swal';

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
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user?._id]);

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
      showSuccess('อัปเดตโปรไฟล์สำเร็จ!', '');
    } catch (error) {
      console.error('Error saving profile:', error);
      showError('ไม่สามารถบันทึกโปรไฟล์ได้', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/activities', label: 'Activities', icon: Activity },
    { path: '/admin/reports', label: 'Reports', icon: Flag }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-sm fixed h-full">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-slate-800 dark:text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Admin Panel
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Management Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">{navItems.map((item) => {
          const IconComponent = item.icon;
          return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-sm transition-colors ${isActive
                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-medium'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`
            }
          >
            <IconComponent className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        );})}
        </nav>


        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div
            className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm p-3 transition-colors group"
            onClick={handleOpenProfile}
          >
            {profile?.avatar ? (
              <div className="relative">
                <img
                  src={profile.avatar && profile.avatar.startsWith('http') ? profile.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${profile.avatar}`}
                  alt={profile.name || user?.email}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-600"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-500 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>
            ) : (
              <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-600">
                <span className="text-teal-700 dark:text-teal-400 font-medium text-lg">
                  {user?.username ? user.username.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : '')}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 dark:text-white font-medium truncate">
                {user?.username || profile?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                Click to edit
              </p>
            </div>
            <Settings className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
          </div>
          <button
            onClick={() => {
              logOut();
              navigate('/');
            }}
            className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors border border-red-200 dark:border-red-800 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto bg-slate-50 dark:bg-slate-900">
        <Outlet />
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-lg" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-medium text-slate-800 dark:text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Admin Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {loading && !profile ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
              ) : (
                <>
                  {/* Avatar & Basic Info */}
                  <div className="flex items-center gap-4">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar.startsWith('http') ? profile.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${profile.avatar}`}
                        alt={profile.name || user?.email}
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-teal-700 dark:text-teal-400 font-medium text-3xl">
                          {user?.username ? user.username.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase())}
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
                          className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white rounded-sm px-3 py-2 border border-slate-200 dark:border-slate-600 focus:border-teal-500 focus:outline-none text-xl font-medium"
                        />
                      ) : (
                        <h3 className="text-2xl font-medium text-slate-800 dark:text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{profile?.name || user?.username || 'No name set'}</h3>
                      )}
                      <p className="text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 text-sm mb-2 block">Bio</label>
                    {editMode ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white rounded-sm px-3 py-2 border border-slate-200 dark:border-slate-600 focus:border-teal-500 focus:outline-none resize-none"
                      />
                    ) : (
                      <p className="text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 rounded-sm p-3">
                        {profile?.bio || 'No bio added yet'}
                      </p>
                    )}
                  </div>

                  {/* Avatar URL */}
                  {editMode && (
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 text-sm mb-2 block">Avatar URL</label>
                      <input
                        type="text"
                        value={formData.avatar}
                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white rounded-sm px-3 py-2 border border-slate-200 dark:border-slate-600 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 text-sm">Role</label>
                      <p className="text-slate-800 dark:text-white mt-1">
                        <span className="px-3 py-1 rounded-sm text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                          Admin
                        </span>
                      </p>
                    </div>
                    {profile?.updatedAt && (
                      <div>
                        <label className="text-slate-500 dark:text-slate-400 text-sm">Profile Updated</label>
                        <p className="text-slate-800 dark:text-white mt-1">{new Date(profile.updatedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {editMode ? (
                      <>
                        <button
                          onClick={() => setEditMode(false)}
                          className="flex-1 px-4 py-2 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="flex-1 px-4 py-2 rounded-sm bg-teal-700 text-white hover:bg-teal-600 transition-colors"
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Saving...
                            </span>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowProfileModal(false)}
                          className="flex-1 px-4 py-2 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => setEditMode(true)}
                          className="px-4 py-2 rounded-sm bg-teal-700 text-white hover:bg-teal-600 transition-colors"
                        >
                          Edit Profile
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
