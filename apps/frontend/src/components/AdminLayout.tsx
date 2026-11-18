import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Flag, 
  LogOut, 
  Settings, 
  X, 
  ExternalLink,
  Menu,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Camera,
  Home,
  MessageSquare
} from 'lucide-react';
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
  const location = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', avatar: '' });
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      showSuccess('อัปเดตโปรไฟล์สำเร็จ!', 'ข้อมูลโปรไฟล์ได้รับการบันทึกแล้ว');
    } catch (error) {
      console.error('Error saving profile:', error);
      showError('ไม่สามารถบันทึกโปรไฟล์ได้', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: '3' },
    { path: '/', label: 'Home', icon: Home, badge: null },
    { path: '/admin/activities', label: 'Activities', icon: Activity, badge: null },
    { path: '/admin/reports', label: 'Reports', icon: Flag, badge: '1' },
    { path: '/admin/users', label: 'Users', icon: Users, badge: null },
    { path: '/explore', label: 'Messages', icon: MessageSquare, badge: null }
  ];

  // Resolve current page title and breadcrumb
  const getCurrentPageMeta = () => {
    const current = location.pathname;
    if (current.includes('/admin/users')) {
      return { title: 'User Management', category: 'Administration' };
    }
    if (current.includes('/admin/activities')) {
      return { title: 'Activity Management', category: 'Administration' };
    }
    if (current.includes('/admin/reports')) {
      return { title: 'Content Reports', category: 'Moderation' };
    }
    return { title: 'System Overview', category: 'Dashboard' };
  };

  const pageMeta = getCurrentPageMeta();
  const avatarUrl = profile?.avatar && profile.avatar.startsWith('http') 
    ? profile.avatar 
    : profile?.avatar 
      ? `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${profile.avatar}`
      : null;

  return (
    <div className="flex min-h-screen bg-[#F3F5F4] text-[#202124]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#202124]/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Reference 1 & 2: Dark Charcoal #202124 */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#202124] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-[#2C2D30]
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header — Reference 1 (flux -> wego) */}
        <div className="px-6 py-6 border-b border-[#2C2D30]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Geometric 4-Petal Flower Mark (styled after reference flux logo) */}
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                  <path d="M16 2C18.2 2 20 3.8 20 6V10C20 12.2 18.2 14 16 14C13.8 14 12 12.2 12 10V6C12 3.8 13.8 2 16 2Z" fill="#D9F36A" />
                  <path d="M26 12C28.2 12 30 13.8 30 16C30 18.2 28.2 20 26 20H22C19.8 20 18 18.2 18 16C18 13.8 19.8 12 22 12H26Z" fill="#FFFFFF" />
                  <path d="M16 18C18.2 18 20 19.8 20 22V26C20 28.2 18.2 30 16 30C13.8 30 12 28.2 12 26V22C12 19.8 13.8 18 16 18Z" fill="#FFFFFF" />
                  <path d="M10 12C12.2 12 14 13.8 14 16C14 18.2 12.2 20 10 20H6C3.8 20 2 18.2 2 16C2 13.8 3.8 12 6 12H10Z" fill="#D9F36A" />
                </svg>
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white lowercase">wego</span>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-[#858B89] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 thin-scrollbar">
          <div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      relative group flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200
                      ${isActive 
                        ? 'bg-white text-[#202124] shadow-md font-bold' 
                        : 'text-[#858B89] hover:text-white hover:bg-white/[0.06]'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? 'text-[#202124]' : 'text-[#858B89] group-hover:text-white'}`} />
                      <span>{item.label}</span>
                    </div>

                    {/* Lime Green Notification Badge (Reference 1 style) */}
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                        isActive 
                          ? 'bg-[#D9F36A] text-[#202124]' 
                          : 'bg-[#D9F36A] text-[#202124]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Quick Shortcuts Section */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider uppercase text-[#858B89]">
              Application
            </div>
            <div className="space-y-1">
              <button
                onClick={() => navigate('/explore')}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-[#858B89] hover:text-white hover:bg-white/[0.06] transition-colors group"
              >
                <ExternalLink className="w-4 h-4 text-[#858B89] group-hover:text-white transition-colors" />
                <span className="flex-1 text-left">Public Explorer</span>
                <span className="text-[11px] text-[#858B89] bg-white/[0.06] px-2 py-0.5 rounded-md">Live</span>
              </button>
            </div>
          </div>

          {/* System Health / Status Card */}
          <div className="mx-1 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9F36A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D9F36A]"></span>
              </span>
              <span className="font-semibold text-white">System Status: Active</span>
            </div>
            <p className="text-[#858B89] text-[11px] leading-relaxed">
              Real-time synchronization and socket streams are operational.
            </p>
          </div>
        </div>

        {/* User Account / Sidebar Footer */}
        <div className="p-4 border-t border-[#2C2D30] bg-[#1C1D1F]">
          <div 
            onClick={handleOpenProfile}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-colors group"
          >
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.name || user?.email}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#147D70]"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#147D70] flex items-center justify-center text-white font-bold text-sm">
                  {user?.username ? user.username.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#D9F36A] border-2 border-[#1C1D1F] rounded-full" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate group-hover:text-[#D9F36A] transition-colors">
                {profile?.name || user?.username || user?.email?.split('@')[0]}
              </p>
              <p className="text-[11px] text-[#858B89] truncate">{user?.email}</p>
            </div>

            <button 
              title="Profile settings"
              className="p-1.5 text-[#858B89] hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              logOut();
              navigate('/');
            }}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72 transition-all duration-300">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E8EBE9] px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#202124] hover:bg-[#F3F5F4] border border-[#E8EBE9] transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb & Title */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#858B89]">
                <span>WegoSystem</span>
                <span>/</span>
                <span>{pageMeta.category}</span>
                <span>/</span>
                <span className="text-[#147D70] font-medium">{pageMeta.title}</span>
              </div>
              <h1 className="text-lg font-bold text-[#202124] tracking-tight">
                {pageMeta.title}
              </h1>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3">
            {/* Direct Link to public explorer */}
            <button
              onClick={() => navigate('/explore')}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#E8EBE9] text-[#202124] hover:border-[#147D70] hover:text-[#147D70] transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Live Site
            </button>

            {/* Admin Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF5D5] border border-[#D9F36A] text-[#11665C] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#147D70]" />
              <span>Admin Mode</span>
            </div>

            {/* Quick Profile Pill */}
            <button
              onClick={handleOpenProfile}
              className="flex items-center gap-2 p-1 pl-2 bg-[#F3F5F4] hover:bg-[#E8EBE9] rounded-full border border-[#E8EBE9] transition-colors"
            >
              <span className="text-xs font-semibold text-[#202124] hidden md:inline">
                {profile?.name || user?.username || user?.email?.split('@')[0]}
              </span>
              <div className="w-7 h-7 rounded-full bg-[#147D70] text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.email?.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Admin Profile Modal */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 bg-[#202124]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-[#E8EBE9] shadow-xl animate-fade-in" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#202124] text-white px-6 py-5 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#D9F36A]" />
                  Administrator Profile
                </h2>
                <p className="text-xs text-[#858B89]">Manage your system identity and account details</p>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {loading && !profile ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#147D70] border-t-transparent" />
                  <span className="text-xs text-[#858B89]">Loading profile details...</span>
                </div>
              ) : (
                <>
                  {/* Avatar & Identity Box */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F3F5F4] border border-[#E8EBE9]">
                    <div className="relative">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="avatar"
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#147D70]"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-[#147D70] text-white flex items-center justify-center text-2xl font-bold">
                          {user?.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#D9F36A] border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-[#11665C]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#147D70] bg-[#E0F3F1] px-2 py-0.5 rounded-full">
                        Super Administrator
                      </span>
                      <h3 className="text-base font-bold text-[#202124] mt-1 truncate">
                        {profile?.name || user?.username || 'System Administrator'}
                      </h3>
                      <p className="text-xs text-[#858B89] truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="label">Display Name</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Alex Henderson"
                          className="input"
                        />
                      ) : (
                        <div className="p-3 bg-[#F3F5F4] rounded-xl text-sm font-medium text-[#202124] border border-[#E8EBE9]">
                          {profile?.name || user?.username || 'Not set'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="label">Bio / Responsibilities</label>
                      {editMode ? (
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Describe your role or responsibilities..."
                          rows={3}
                          className="input resize-none"
                        />
                      ) : (
                        <div className="p-3 bg-[#F3F5F4] rounded-xl text-sm text-[#5F6664] border border-[#E8EBE9] min-h-[5rem]">
                          {profile?.bio || 'No administrative bio added yet.'}
                        </div>
                      )}
                    </div>

                    {editMode && (
                      <div>
                        <label className="label">Avatar Image URL</label>
                        <input
                          type="url"
                          value={formData.avatar}
                          onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="input"
                        />
                        <p className="text-[11px] text-[#858B89] mt-1">
                          Direct HTTPS URL to your avatar image file.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-3 border-t border-[#E8EBE9]">
                    {editMode ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          className="btn-secondary flex-1"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          className="btn-primary flex-1"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Profile'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowProfileModal(false)}
                          className="btn-secondary flex-1"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMode(true)}
                          className="btn-primary flex-1"
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
