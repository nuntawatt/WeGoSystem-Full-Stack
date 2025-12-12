import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { socket } from '../../lib/socket';
import { Users, Shield, Wifi, Ban, Search, User, Mail, Calendar, Settings, Eye, Lock, Unlock, Trash2, X } from 'lucide-react';
import { confirm, showSuccess, showError } from '../../lib/swal';

interface User {
  _id: string;
  email: string;
  username?: string;
  role: 'user' | 'admin';
  isBlocked?: boolean;
  isOnline?: boolean;
  lastActive?: string;
  createdAt: string;
  profile?: {
    avatar?: string;
    name?: string;
  };
}

interface UserProfile {
  name?: string;
  avatar?: string;
  bio?: string;
  updatedAt?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    fetchUsers();
    
    // Connect socket and authenticate user
    const initSocket = async () => {
      if (!socket.connected) {
        socket.connect();
      }

      // Get current user ID from localStorage or API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          const currentUserId = response.data._id;
          
          // Join socket with user ID
          socket.emit('user:join', currentUserId);
          console.log('Admin joined socket with ID:', currentUserId);
        } catch (error) {
          console.error('Error getting current user:', error);
        }
      }
    };

    initSocket();

    // Listen for user status updates
    socket.on('userStatusChanged', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      console.log('User status changed:', userId, isOnline ? '🟢 ONLINE' : '⚫ OFFLINE');
      
      // Update users list
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, isOnline } : user
        )
      );
      
      // Update selected user in modal if it's open
      setSelectedUser((prevSelected) =>
        prevSelected && prevSelected._id === userId
          ? { ...prevSelected, isOnline }
          : prevSelected
      );
    });

    // Cleanup
    return () => {
      socket.off('userStatusChanged');
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    // ตรวจสอบว่าไม่ใช่ตัวเอง
    try {
      const response = await api.get('/auth/me');
      const currentUserId = response.data._id;
      
      if (userId === currentUserId) {
        showError('ไม่สามารถบล็อกตัวเองได้', 'คุณไม่สามารถบล็อกบัญชี Admin ของตัวเองได้');
        return;
      }
    } catch (error) {
      console.error('Error checking current user:', error);
    }

    // Confirmation message
    const user = users.find(u => u._id === userId);
    const confirmTitle = isBlocked 
      ? `ปลดบล็อก ${user?.email || 'ผู้ใช้นี้'}?`
      : `บล็อก ${user?.email || 'ผู้ใช้นี้'}?`;
    const confirmText = isBlocked
      ? 'ผู้ใช้จะสามารถเข้าสู่ระบบและใช้งานได้อีกครั้ง'
      : 'ผู้ใช้จะไม่สามารถเข้าสู่ระบบหรือใช้งานระบบได้';
    
    const result = await confirm(confirmTitle, confirmText, isBlocked ? 'ปลดบล็อก' : 'บล็อก', 'ยกเลิก');
    if (!result.isConfirmed) {
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/block`, { isBlocked: !isBlocked });
      
      // Update users list
      await fetchUsers();
      
      // Update selected user in modal if it's open
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, isBlocked: !isBlocked });
      }

      // Success message
      const successTitle = !isBlocked ? 'บล็อกผู้ใช้สำเร็จ!' : 'ปลดบล็อกผู้ใช้สำเร็จ!';
      const successText = !isBlocked 
        ? `${user?.email} ไม่สามารถเข้าสู่ระบบได้แล้ว`
        : `${user?.email} สามารถเข้าสู่ระบบได้แล้ว`;
      
      showSuccess(successTitle, successText);
    } catch (error: any) {
      console.error('Error blocking user:', error);
      showError(
        `ไม่สามารถ${isBlocked ? 'ปลดบล็อก' : 'บล็อก'}ผู้ใช้ได้`,
        error.response?.data?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      );
    }
  };
  
  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
    setLoadingProfile(true);
    
    // Fetch user profile
    try {
      const response = await api.get(`/profiles/${user._id}`);
      setUserProfile(response.data || null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full space-y-6">
      {/* Header with Quick Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-800 dark:text-white mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Manage all users in the system</p>
        </div>
        <button onClick={fetchUsers} className="btn-ghost px-3 py-2 text-sm rounded-lg hover:bg-white/5">
          <i className="fas fa-sync-alt mr-2"></i>Refresh
        </button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 text-xs font-medium uppercase tracking-wider">Total Users</p>
          </div>
          <p className="text-3xl sm:text-4xl font-semibold text-slate-800 dark:text-white">{filteredUsers.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 text-xs font-medium uppercase tracking-wider">Admins</p>
          </div>
          <p className="text-3xl sm:text-4xl font-semibold text-slate-800 dark:text-white">{filteredUsers.filter((u) => u.role === 'admin').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 text-xs font-medium uppercase tracking-wider">Online</p>
          </div>
          <p className="text-3xl sm:text-4xl font-semibold text-slate-800 dark:text-white">{filteredUsers.filter((u) => u.isOnline && !u.isBlocked).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Ban className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 text-xs font-medium uppercase tracking-wider">Blocked</p>
          </div>
          <p className="text-3xl sm:text-4xl font-semibold text-slate-800 dark:text-white">{filteredUsers.filter((u) => u.isBlocked).length}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none cursor-pointer transition-all"
          >
            <option value="all">All Roles</option>
            <option value="user">User Only</option>
            <option value="admin">Admin Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="text-left py-4 px-6 text-slate-700 dark:text-slate-200 font-medium text-sm uppercase tracking-wider">
                  <div className="flex items-center gap-2"><User className="w-4 h-4" /> User</div>
                </th>
                <th className="text-left py-4 px-6 text-slate-700 dark:text-slate-200 font-medium text-sm uppercase tracking-wider">
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email</div>
                </th>
                <th className="text-left py-4 px-6 text-slate-700 dark:text-slate-200 font-medium text-sm uppercase tracking-wider">
                  <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Role</div>
                </th>
                <th className="text-left py-4 px-6 text-slate-700 dark:text-slate-200 font-medium text-sm uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-slate-700 dark:text-slate-200 font-medium text-sm uppercase tracking-wider hidden md:table-cell">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined</div>
                </th>
                <th className="text-right py-4 px-6 text-slate-700 dark:text-slate-200 font-medium text-sm uppercase tracking-wider">
                  <div className="flex items-center gap-2 justify-end"><Settings className="w-4 h-4" /> Actions</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr 
                    key={user._id} 
                    className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.profile?.avatar ? (
                          <img
                            src={user.profile.avatar.startsWith('http') ? user.profile.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${user.profile.avatar}`}
                            alt={user.profile.name || user.email}
                            className={`w-12 h-12 rounded-xl object-cover ring-2 transition-all ${
                              user.isBlocked 
                                ? 'ring-red-500/50 opacity-50 grayscale' 
                                : 'ring-blue-500/30 group-hover:ring-blue-400/50'
                            }`}
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ring-2 transition-all ${
                            user.isBlocked
                              ? 'from-red-500/30 to-gray-500/30 ring-red-500/30 opacity-50'
                              : 'from-blue-500/30 to-purple-500/30 ring-blue-500/20 group-hover:ring-blue-400/40'
                          }`}>
                            <span className={`font-black text-lg ${user.isBlocked ? 'text-red-600' : 'text-blue-700 dark:text-blue-300'}`}>
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className={`font-bold text-sm transition-colors ${
                            user.isBlocked 
                              ? 'text-red-600 line-through' 
                              : 'text-slate-800 dark:text-white'
                          }`}>
                            {user.profile?.name || user.username || 'N/A'}
                          </span>
                          {user.isBlocked && (
                            <p className="text-xs text-red-400 mt-0.5">🚫 Blocked - Cannot use system</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-emerald-700 dark:text-emerald-300 text-sm font-medium">{user.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider inline-block ${
                        user.role === 'admin'
                          ? 'bg-gradient-to-r from-red-500/30 to-pink-500/20 text-red-700 dark:text-red-300 border border-red-500/40'
                          : 'bg-gradient-to-r from-blue-500/30 to-purple-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/40'
                      }`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                            user.isBlocked
                              ? 'bg-gradient-to-r from-gray-500/30 to-gray-600/20 text-gray-700 dark:text-gray-300 border border-gray-500/40'
                              : user.isOnline
                              ? 'bg-gradient-to-r from-emerald-500/30 to-green-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                              : 'bg-gradient-to-r from-amber-500/30 to-yellow-600/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {user.isBlocked ? '🚫 Blocked' : user.isOnline ? '🟢 Online' : '⚫ Offline'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-pink-700 dark:text-pink-300 text-sm font-medium hidden md:table-cell">
                      <i className="fas fa-calendar-alt mr-2"></i>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewUser(user);
                          }}
                          title="View user details"
                          className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                        >
                          <i className="fas fa-eye mr-2 group-hover/btn:scale-110 inline-block transition-transform"></i>
                          View
                        </button>
                        <button
                          onClick={() => handleBlockUser(user._id, user.isBlocked || false)}
                          title={user.isBlocked ? 'Unblock user' : 'Block user'}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 hover:shadow-lg group/btn ${
                            user.isBlocked
                                ? 'bg-gradient-to-r from-emerald-500/30 to-green-600/20 text-emerald-700 dark:text-emerald-300 hover:from-emerald-500/40 hover:to-green-600/30 border border-emerald-500/40 hover:shadow-emerald-500/20'
                                : 'bg-gradient-to-r from-red-500/30 to-pink-600/20 text-red-700 dark:text-red-300 hover:from-red-500/40 hover:to-pink-600/30 border border-red-500/40 hover:shadow-red-500/20'
                          }`}
                        >
                          <i className={`fas ${user.isBlocked ? 'fa-unlock' : 'fa-ban'} mr-2 group-hover/btn:scale-110 inline-block transition-transform`}></i>
                          <span className="hidden sm:inline">{user.isBlocked ? 'Unblock' : 'Block'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-600 dark:text-slate-400">
                    <i className="fas fa-users text-4xl mb-3 opacity-50"></i>
                    <p>No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">User Details</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <span className="sr-only">Close</span>
                <span className="text-lg">✕</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Blocked Warning */}
              {selectedUser.isBlocked && (
                <div className="bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 dark:text-red-300 font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-red-700 dark:text-red-300 font-bold text-lg">User Blocked</p>
                    <p className="text-red-700 dark:text-red-300 text-sm">This user cannot login or access any system features</p>
                  </div>
                </div>
              )}

              {/* Avatar & Basic Info */}
              <div className="flex items-center gap-4">
                {loadingProfile ? (
                  <div className="w-20 h-20 rounded-full bg-primary-700 animate-pulse"></div>
                  ) : userProfile?.avatar ? (
                  <img
                    src={userProfile.avatar.startsWith('http') ? userProfile.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${userProfile.avatar}`}
                    alt={userProfile.name || selectedUser.email}
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-400/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold text-3xl">
                      {selectedUser.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {loadingProfile ? (
                      <div className="h-8 w-48 bg-primary-700 animate-pulse rounded"></div>
                    ) : (
                      userProfile?.name || selectedUser.username || 'N/A'
                    )}
                  </h3>
                  <p className="text-slate-700 dark:text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              {/* Bio Section */}
              {!loadingProfile && userProfile?.bio && (
                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-sm">Bio</label>
                  <p className="text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mt-1">{userProfile.bio}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-sm font-semibold">User ID</label>
                  <p className="text-slate-800 dark:text-slate-100 font-mono text-xs mt-1 break-all">{selectedUser._id}</p>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 text-sm font-semibold">Role</label>
                  <p className="text-slate-800 dark:text-slate-100 mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedUser.role === 'admin'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {selectedUser.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-slate-600 dark:text-slate-400 text-sm font-semibold">Online Status</label>
                  <p className="text-slate-800 dark:text-slate-100 mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedUser.isOnline
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {selectedUser.isOnline ? '🟢 Online' : '⚫ Offline'}
                    </span>
                  </p>
                  {!selectedUser.isOnline && selectedUser.lastActive && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Last seen: {new Date(selectedUser.lastActive).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-slate-600 dark:text-slate-400 text-sm font-semibold">Joined Date</label>
                  <p className="text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-2">
                    <span className="text-pink-400">📅</span>
                    {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    <span className="text-slate-600 dark:text-slate-400 text-sm">
                      ({new Date(selectedUser.createdAt).toLocaleTimeString()})
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-primary-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 px-4 py-2.5 rounded-lg font-semibold text-center"
                >
                  Close
                </button>
                <button
                  onClick={() => handleBlockUser(selectedUser._id, selectedUser.isBlocked || false)}
                  className={`flex-1 px-6 py-2.5 rounded-lg transition-all font-bold uppercase tracking-wider text-center ${
                    selectedUser.isBlocked
                      ? 'bg-emerald-600 text-white border-2 border-emerald-700 hover:bg-emerald-700'
                      : 'bg-red-600 text-white border-2 border-red-700 hover:bg-red-700'
                  }`}
                >
                  {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip hover preview removed - View button opens modal instead */}

      {/* View uses the existing User Details modal (handleViewUser) */}
    </div>
  );
}
