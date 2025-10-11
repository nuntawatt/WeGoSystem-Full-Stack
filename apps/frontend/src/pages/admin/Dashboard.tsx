import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/apiClient';

interface DashboardStats {
  stats: {
    totalUsers: number;
    totalActivities: number;
    totalGroups: number;
    totalEvents: number;
    totalChats: number;
  };
  recentUsers: any[];
  recentActivities: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ตรวจสอบว่า user เป็น admin หรือไม่
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchDashboardStats();
  }, [user, navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      // เรียก API dashboard ที่รวมข้อมูลทั้งหมด
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md">
          <p className="text-red-400 text-center">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-4 w-full btn-primary rounded-lg px-4 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { stats, recentUsers, recentActivities } = dashboardData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-primary-300 text-sm sm:text-base">Welcome back, {user?.email?.split('@')[0] || 'godmode'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDashboardStats} className="btn-ghost px-3 py-2 text-sm rounded-lg hover:bg-white/5">
            <i className="fas fa-sync-alt mr-2"></i>Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Users Card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4 sm:p-5 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
             onClick={() => navigate('/admin/users')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-300 text-xs sm:text-sm font-medium">Total Users</p>
            <div className="bg-blue-500/30 p-2 rounded-lg">
              <i className="fas fa-users text-blue-400 text-lg"></i>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalUsers}</p>
          <p className="text-blue-300/60 text-xs mt-1">Click to manage →</p>
        </div>

        {/* Total Activities Card */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4 sm:p-5 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
             onClick={() => navigate('/admin/activities')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-300 text-xs sm:text-sm font-medium">Activities</p>
            <div className="bg-green-500/30 p-2 rounded-lg">
              <i className="fas fa-clipboard-list text-green-400 text-lg"></i>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalActivities}</p>
          <p className="text-green-300/60 text-xs mt-1">Click to view →</p>
        </div>

        {/* Total Groups Card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4 sm:p-5 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
             onClick={() => navigate('/admin/groups')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-300 text-xs sm:text-sm font-medium">Groups</p>
            <div className="bg-purple-500/30 p-2 rounded-lg">
              <i className="fas fa-user-friends text-purple-400 text-lg"></i>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalGroups}</p>
          <p className="text-purple-300/60 text-xs mt-1">Click to view →</p>
        </div>

        {/* Total Events Card */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-4 sm:p-5 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
             onClick={() => navigate('/admin/events')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-yellow-300 text-xs sm:text-sm font-medium">Events</p>
            <div className="bg-yellow-500/30 p-2 rounded-lg">
              <i className="fas fa-calendar-alt text-yellow-400 text-lg"></i>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalEvents}</p>
          <p className="text-yellow-300/60 text-xs mt-1">Click to view →</p>
        </div>

        {/* Total Chats Card */}
        <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 rounded-xl p-4 sm:p-5 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
             onClick={() => navigate('/admin/chats')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-pink-300 text-xs sm:text-sm font-medium">Chats</p>
            <div className="bg-pink-500/30 p-2 rounded-lg">
              <i className="fas fa-comments text-pink-400 text-lg"></i>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalChats}</p>
          <p className="text-pink-300/60 text-xs mt-1">Click to view →</p>
        </div>
      </div>

      {/* Data Tables - Responsive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mt-6">
        {/* Recent Users Table */}
        <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">Recent Users</h2>
            <button onClick={() => navigate('/admin/users')} className="text-blue-400 hover:text-blue-300 text-sm">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-600/50">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Username</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Email</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Role</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length > 0 ? (
                  recentUsers.slice(0, 5).map((u: any) => (
                    <tr key={u._id} className="border-b border-primary-700/30 hover:bg-primary-700/30 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white text-xs sm:text-sm">{u.username || 'N/A'}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-primary-300 text-xs sm:text-sm truncate max-w-[150px]">{u.email}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-primary-400 text-sm">No recent users</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Table */}
        <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">Recent Activities</h2>
            <button onClick={() => navigate('/admin/activities')} className="text-green-400 hover:text-green-300 text-sm">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-600/50">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Title</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Category</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((act: any) => (
                    <tr key={act._id} className="border-b border-primary-700/30 hover:bg-primary-700/30 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white text-xs sm:text-sm truncate max-w-[150px]">{act.title}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-primary-300 text-xs sm:text-sm">{act.category}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${act.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-primary-400 text-sm">No recent activities</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}