import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { socket } from '../../lib/socket';
import { 
  Users, 
  Shield, 
  Wifi, 
  Ban, 
  Search, 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  Eye, 
  Lock, 
  Unlock, 
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { confirm, showSuccess, showError } from '../../lib/swal';

interface UserItem {
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
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchUsers();

    const initSocket = async () => {
      if (!socket.connected) {
        socket.connect();
      }

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          const currentUserId = response.data._id;
          socket.emit('user:join', currentUserId);
        } catch (error) {
          console.error('Error getting current user:', error);
        }
      }
    };

    initSocket();

    socket.on('userStatusChanged', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId ? { ...u, isOnline } : u
        )
      );

      setSelectedUser((prevSelected) =>
        prevSelected && prevSelected._id === userId
          ? { ...prevSelected, isOnline }
          : prevSelected
      );
    });

    return () => {
      socket.off('userStatusChanged');
    };
  }, []);

  const fetchUsers = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
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

    const targetUser = users.find((u) => u._id === userId);
    const confirmTitle = isBlocked 
      ? `ปลดบล็อก ${targetUser?.email || 'ผู้ใช้นี้'}?`
      : `บล็อก ${targetUser?.email || 'ผู้ใช้นี้'}?`;
    const confirmText = isBlocked
      ? 'ผู้ใช้จะสามารถเข้าสู่ระบบและใช้งานได้อีกครั้ง'
      : 'ผู้ใช้จะไม่สามารถเข้าสู่ระบบหรือใช้งานระบบได้';
    
    const result = await confirm(confirmTitle, confirmText, isBlocked ? 'ปลดบล็อก' : 'บล็อก', 'ยกเลิก');
    if (!result.isConfirmed) return;

    try {
      await api.put(`/admin/users/${userId}/block`, { isBlocked: !isBlocked });
      await fetchUsers(true);
      
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, isBlocked: !isBlocked });
      }

      showSuccess(
        !isBlocked ? 'บล็อกผู้ใช้สำเร็จ!' : 'ปลดบล็อกผู้ใช้สำเร็จ!',
        !isBlocked ? `${targetUser?.email} ถูกระงับการใช้งานแล้ว` : `${targetUser?.email} สามารถเข้าใช้งานได้แล้ว`
      );
    } catch (error: any) {
      console.error('Error blocking user:', error);
      showError(
        `ไม่สามารถ${isBlocked ? 'ปลดบล็อก' : 'บล็อก'}ผู้ใช้ได้`,
        error.response?.data?.message || 'เกิดข้อผิดพลาด'
      );
    }
  };

  const handleViewUser = async (userItem: UserItem) => {
    setSelectedUser(userItem);
    setShowModal(true);
    setLoadingProfile(true);

    try {
      const response = await api.get(`/profiles/${userItem._id}`);
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

  const totalUsersCount = users.length;
  const adminUsersCount = users.filter((u) => u.role === 'admin').length;
  const onlineUsersCount = users.filter((u) => u.isOnline && !u.isBlocked).length;
  const blockedUsersCount = users.filter((u) => u.isBlocked).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-[#147D70] border-t-transparent animate-spin" />
        <span className="text-sm font-medium text-[#858B89]">Loading user accounts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#E8EBE9] p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight">
            User Management Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#858B89] mt-1">
            Audit user roles, inspect account activity, monitor real-time presence, and manage access restrictions.
          </p>
        </div>
        <button 
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="btn-secondary text-xs px-3.5 py-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#147D70] ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Users'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#858B89]">Total Users</span>
            <div className="w-9 h-9 rounded-xl bg-[#E0F3F1] flex items-center justify-center text-[#147D70]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#202124]">{totalUsersCount}</div>
          <span className="text-[11px] text-[#858B89] mt-1 block">Registered in platform</span>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#858B89]">Administrators</span>
            <div className="w-9 h-9 rounded-xl bg-[#202124] flex items-center justify-center text-white">
              <Shield className="w-4 h-4 text-[#D9F36A]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#202124]">{adminUsersCount}</div>
          <span className="text-[11px] text-[#858B89] mt-1 block">Privileged staff roles</span>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#858B89]">Online Now</span>
            <div className="w-9 h-9 rounded-xl bg-[#EAF5D5] flex items-center justify-center text-[#11665C]">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#202124]">{onlineUsersCount}</div>
          <span className="text-[11px] text-[#147D70] font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#147D70] animate-pulse" /> Active live sockets
          </span>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#858B89]">Blocked</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#202124]">{blockedUsersCount}</div>
          <span className="text-[11px] text-red-600 font-medium mt-1 block">Restricted from login</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#858B89]" />
          <input
            type="text"
            placeholder="Search by email address or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 text-xs py-2.5"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-semibold text-[#858B89] hidden sm:inline">Role Filter:</span>
          <div className="flex rounded-xl bg-[#F3F5F4] p-1 border border-[#E8EBE9] w-full sm:w-auto">
            {(['all', 'user', 'admin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterRole === role
                    ? 'bg-white text-[#202124] shadow-xs'
                    : 'text-[#858B89] hover:text-[#202124]'
                }`}
              >
                {role === 'all' ? 'All Roles' : role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F3F5F4] text-[#858B89] font-semibold uppercase tracking-wider border-b border-[#E8EBE9]">
              <tr>
                <th className="py-3.5 px-6">Account Profile</th>
                <th className="py-3.5 px-6">Email Address</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 hidden md:table-cell">Registered Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBE9]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const avatarUrl = u.profile?.avatar && u.profile.avatar.startsWith('http')
                    ? u.profile.avatar
                    : u.profile?.avatar
                      ? `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${u.profile.avatar}`
                      : null;

                  return (
                    <tr 
                      key={u._id} 
                      className="hover:bg-[#F3F5F4]/70 transition-colors group"
                    >
                      {/* Profile Column */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={u.profile?.name || u.email}
                                className={`w-9 h-9 rounded-xl object-cover ring-2 ${
                                  u.isBlocked 
                                    ? 'ring-red-300 opacity-60 grayscale' 
                                    : 'ring-[#E8EBE9]'
                                }`}
                              />
                            ) : (
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                u.isBlocked 
                                  ? 'bg-red-100 text-red-600' 
                                  : 'bg-[#147D70] text-white'
                              }`}>
                                {u.email.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {/* Online / Status Dot */}
                            {!u.isBlocked && (
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                u.isOnline ? 'bg-[#147D70]' : 'bg-[#BAC2BF]'
                              }`} />
                            )}
                          </div>
                          <div>
                            <span className={`font-semibold text-xs text-[#202124] ${u.isBlocked ? 'line-through text-red-500' : ''}`}>
                              {u.profile?.name || u.username || 'N/A'}
                            </span>
                            {u.isBlocked && (
                              <span className="block text-[10px] text-red-600 font-semibold">Access Suspended</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email Column */}
                      <td className="py-3.5 px-6 font-medium text-[#5F6664]">
                        {u.email}
                      </td>

                      {/* Role Column */}
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-[#202124] text-white'
                            : 'bg-[#F3F5F4] text-[#5F6664] border border-[#E8EBE9]'
                        }`}>
                          {u.role === 'admin' ? '👑 Admin' : 'User'}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-6">
                        {u.isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            <Ban className="w-3 h-3" /> Blocked
                          </span>
                        ) : u.isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5D5] text-[#11665C] border border-[#D9F36A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#147D70] animate-pulse" /> Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F3F5F4] text-[#858B89] border border-[#E8EBE9]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#BAC2BF]" /> Offline
                          </span>
                        )}
                      </td>

                      {/* Registered Date Column */}
                      <td className="py-3.5 px-6 text-[#858B89] hidden md:table-cell">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewUser(u)}
                            className="btn-secondary py-1 px-2.5 text-xs font-semibold"
                            title="Inspect details"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Details
                          </button>

                          <button
                            onClick={() => handleBlockUser(u._id, u.isBlocked || false)}
                            className={`py-1 px-2.5 text-xs font-semibold rounded-xl transition-colors border ${
                              u.isBlocked
                                ? 'bg-[#E0F3F1] text-[#11665C] border-[#BFE7E2] hover:bg-[#147D70] hover:text-white'
                                : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white'
                            }`}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#858B89]">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">No matching users found</p>
                    <p className="text-xs text-[#BAC2BF] mt-0.5">Try altering your search or role filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-[#202124]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-[#E8EBE9] shadow-2xl animate-fade-in" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#202124] text-white px-6 py-5 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D9F36A]" />
                  User Account Inspection
                </h3>
                <p className="text-xs text-[#858B89]">Unique identifier: {selectedUser._id}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Blocked warning banner */}
              {selectedUser.isBlocked && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-700">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">Account Access Suspended</span>
                    This user cannot sign in or interact with activities and chats.
                  </div>
                </div>
              )}

              {/* Profile Card Header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F3F5F4] border border-[#E8EBE9]">
                <div className="relative">
                  {userProfile?.avatar ? (
                    <img
                      src={userProfile.avatar.startsWith('http') ? userProfile.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${userProfile.avatar}`}
                      alt="avatar"
                      className="w-16 h-16 rounded-xl object-cover ring-2 ring-[#E8EBE9]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#147D70] text-white flex items-center justify-center text-2xl font-bold">
                      {selectedUser.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    selectedUser.isOnline ? 'bg-[#147D70]' : 'bg-[#BAC2BF]'
                  }`} />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-[#202124] truncate">
                    {userProfile?.name || selectedUser.username || 'No display name'}
                  </h4>
                  <p className="text-xs text-[#858B89] truncate">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedUser.role === 'admin'
                        ? 'bg-[#202124] text-white'
                        : 'bg-white text-[#5F6664] border border-[#E8EBE9]'
                    }`}>
                      {selectedUser.role}
                    </span>
                    <span className="text-[11px] text-[#858B89]">
                      {selectedUser.isOnline ? '🟢 Live online' : '⚫ Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {userProfile?.bio && (
                <div>
                  <span className="label">Bio</span>
                  <p className="p-3 rounded-xl bg-[#F3F5F4] border border-[#E8EBE9] text-xs text-[#202124] leading-relaxed">
                    {userProfile.bio}
                  </p>
                </div>
              )}

              {/* Metadata Key/Value Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F3F5F4] border border-[#E8EBE9]">
                  <span className="text-[#858B89] block font-medium">Joined On</span>
                  <span className="font-semibold text-[#202124] mt-1 block">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F3F5F4] border border-[#E8EBE9]">
                  <span className="text-[#858B89] block font-medium">Account Status</span>
                  <span className="font-semibold text-[#202124] mt-1 block">
                    {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#E8EBE9] flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleBlockUser(selectedUser._id, selectedUser.isBlocked || false)}
                  className={`flex-1 text-xs font-semibold py-2.5 rounded-xl transition-colors ${
                    selectedUser.isBlocked
                      ? 'btn-primary'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {selectedUser.isBlocked ? 'Unblock User' : 'Suspend & Block User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
