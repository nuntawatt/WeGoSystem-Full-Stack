import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';

interface User {
  _id: string;
  email: string;
  username?: string;
  role: 'user' | 'admin';
  isBlocked?: boolean;
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

  useEffect(() => {
    fetchUsers();
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
    try {
      await api.put(`/admin/users/${userId}/block`, { isBlocked: !isBlocked });
      fetchUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block/unblock user');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Failed to change user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
      if (selectedUser?._id === userId) {
        setShowModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">User Management</h1>
          <p className="text-primary-300 text-sm sm:text-base">Manage all users in the system</p>
        </div>
        <button onClick={fetchUsers} className="btn-ghost px-3 py-2 text-sm rounded-lg hover:bg-white/5">
          <i className="fas fa-sync-alt mr-2"></i>Refresh
        </button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-blue-300 text-xs font-medium mb-1">Total Users</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{filteredUsers.length}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-red-300 text-xs font-medium mb-1">Admins</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{filteredUsers.filter((u) => u.role === 'admin').length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-green-300 text-xs font-medium mb-1">Active</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{filteredUsers.filter((u) => !u.isBlocked).length}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-gray-300 text-xs font-medium mb-1">Blocked</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{filteredUsers.filter((u) => u.isBlocked).length}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-primary-400"></i>
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-primary-700/50 text-white rounded-lg pl-10 pr-4 py-2.5 sm:py-3 border border-primary-600/50 focus:border-blue-400 focus:outline-none transition-colors"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="bg-primary-700/50 text-white rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border border-primary-600/50 focus:border-blue-400 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="user">User Only</option>
            <option value="admin">Admin Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-700/50">
              <tr>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">User</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Email</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Role</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Status</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm hidden md:table-cell">Joined</th>
                <th className="text-right py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-t border-primary-700/30 hover:bg-primary-700/30 transition-colors">
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {user.profile?.avatar ? (
                          <img
                            src={user.profile.avatar.startsWith('http') ? user.profile.avatar : `http://localhost:3000${user.profile.avatar}`}
                            alt={user.profile.name || user.email}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-400 font-bold text-sm sm:text-base">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-white font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                          {user.profile?.name || user.username || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-primary-300 text-xs sm:text-sm truncate max-w-[150px]">{user.email}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user._id, e.target.value as any)}
                        className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        } cursor-pointer hover:brightness-110 transition-all`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <span
                        className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                          user.isBlocked
                            ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}
                      >
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-primary-300 text-xs sm:text-sm hidden md:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          title="View user details"
                          className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all border border-blue-500/30"
                        >
                          <i className="fas fa-eye sm:mr-1"></i>
                          <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                          onClick={() => handleBlockUser(user._id, user.isBlocked || false)}
                          title={user.isBlocked ? 'Unblock user' : 'Block user'}
                          className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            user.isBlocked
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
                          }`}
                        >
                          <i className={`fas ${user.isBlocked ? 'fa-unlock' : 'fa-ban'} sm:mr-1`}></i>
                          <span className="hidden sm:inline">{user.isBlocked ? 'Unblock' : 'Block'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          title="Delete user"
                          className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/30"
                        >
                          <i className="fas fa-trash sm:mr-1"></i>
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-primary-400">
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
          <div className="bg-primary-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-primary-800 border-b border-primary-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">User Details</h2>
              <button onClick={() => setShowModal(false)} className="text-primary-400 hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Avatar & Basic Info */}
              <div className="flex items-center gap-4">
                {loadingProfile ? (
                  <div className="w-20 h-20 rounded-full bg-primary-700 animate-pulse"></div>
                ) : userProfile?.avatar ? (
                  <img
                    src={userProfile.avatar.startsWith('http') ? userProfile.avatar : `http://localhost:3000${userProfile.avatar}`}
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
                  <h3 className="text-2xl font-bold text-white">
                    {loadingProfile ? (
                      <div className="h-8 w-48 bg-primary-700 animate-pulse rounded"></div>
                    ) : (
                      userProfile?.name || selectedUser.username || 'N/A'
                    )}
                  </h3>
                  <p className="text-primary-300">{selectedUser.email}</p>
                </div>
              </div>

              {/* Bio Section */}
              {!loadingProfile && userProfile?.bio && (
                <div>
                  <label className="text-primary-400 text-sm">Bio</label>
                  <p className="text-white bg-primary-700/50 rounded-lg p-3 mt-1">{userProfile.bio}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-primary-400 text-sm">User ID</label>
                  <p className="text-white font-mono text-sm">{selectedUser._id}</p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Role</label>
                  <p className="text-white">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedUser.role === 'admin'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {selectedUser.role}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Status</label>
                  <p className="text-white">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedUser.isBlocked
                        ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Joined</label>
                  <p className="text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-primary-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleChangeRole(selectedUser._id, selectedUser.role === 'admin' ? 'user' : 'admin');
                    setSelectedUser({ ...selectedUser, role: selectedUser.role === 'admin' ? 'user' : 'admin' });
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors border border-purple-500/30"
                >
                  <i className="fas fa-user-shield mr-2"></i>
                  {selectedUser.role === 'admin' ? 'Make User' : 'Make Admin'}
                </button>
                <button
                  onClick={() => {
                    handleBlockUser(selectedUser._id, selectedUser.isBlocked || false);
                    setSelectedUser({ ...selectedUser, isBlocked: !selectedUser.isBlocked });
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors border ${
                    selectedUser.isBlocked
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}
                >
                  <i className={`fas ${selectedUser.isBlocked ? 'fa-unlock' : 'fa-ban'} mr-2`}></i>
                  {selectedUser.isBlocked ? 'Unblock' : 'Block'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this user?')) {
                      handleDeleteUser(selectedUser._id);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/30"
                >
                  <i className="fas fa-trash mr-2"></i>Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}