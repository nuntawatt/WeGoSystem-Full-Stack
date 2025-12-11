import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/apiClient';
import { Users, Activity, Flag, UserCheck, RefreshCw, ArrowRight } from 'lucide-react';

interface DashboardStats {
  stats: {
    totalUsers: number;
    totalActivities: number;
    totalGroups: number;
    totalEvents: number;
    totalChats: number;
    totalReports?: number;
    pendingReports?: number;
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

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto mb-4"></div>
          <div className="text-slate-700 dark:text-slate-200 text-xl">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-sm p-6 max-w-md shadow-sm">
          <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-4 w-full bg-teal-700 hover:bg-teal-600 text-white rounded-sm px-4 py-2 transition-colors"
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
          <h1 className="text-2xl sm:text-3xl font-light text-slate-800 dark:text-white mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Welcome back, {user?.email?.split('@')[0] || 'godmode'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDashboardStats} className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Users Card */}
        <div className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 sm:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
             onClick={() => navigate('/admin/users')}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider">Total Users</p>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-sm">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-semibold text-slate-800 dark:text-white mb-2">{stats.totalUsers}</p>
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs sm:text-sm">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <span className="font-medium">Manage users</span>
            </div>
          </div>
        </div>

        {/* Total Activities Card */}
        <div className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 sm:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
             onClick={() => navigate('/admin/activities')}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider">Activities</p>
              <div className="bg-teal-100 dark:bg-teal-900/30 p-2.5 rounded-sm">
                <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-semibold text-slate-800 dark:text-white mb-2">{stats.totalActivities}</p>
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs sm:text-sm">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <span className="font-medium">View activities</span>
            </div>
          </div>
        </div>

        {/* Total Groups Card - Info Only */}
        <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 sm:p-6 shadow-sm opacity-70">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider">Groups</p>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-sm">
                <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-semibold text-slate-800 dark:text-white mb-2">{stats.totalGroups}</p>
          </div>
        </div>

        {/* Reports Card */}
        <div className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 sm:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer col-span-2 md:col-span-1"
             onClick={() => navigate('/admin/reports')}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider">Reports</p>
              <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-sm">
                <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-semibold text-slate-800 dark:text-white mb-2">
              {stats.totalReports || 0}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs sm:text-sm">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                <span className="font-medium">Manage reports</span>
              </div>
              {stats.pendingReports && stats.pendingReports > 0 && (
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-sm text-xs text-amber-700 dark:text-amber-400">
                  {stats.pendingReports} pending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Tables - Responsive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mt-6">
        {/* Recent Users Table */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 sm:p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-medium text-slate-800 dark:text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Recent Users</h2>
            <button onClick={() => navigate('/admin/users')} className="text-teal-700 dark:text-teal-400 hover:text-teal-600 text-sm flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">Username</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">Email</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">Role</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length > 0 ? (
                  recentUsers.slice(0, 5).map((u: any) => (
                    <tr key={u._id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-800 dark:text-white text-xs sm:text-sm">{u.username || 'N/A'}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-500 dark:text-slate-400 text-xs sm:text-sm truncate max-w-[150px]">{u.email}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className={`px-2 py-0.5 rounded-sm text-xs ${u.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 text-sm">No recent users</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Table */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 sm:p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-medium text-slate-800 dark:text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Recent Activities</h2>
            <button onClick={() => navigate('/admin/activities')} className="text-teal-700 dark:text-teal-400 hover:text-teal-600 text-sm flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">Title</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">Category</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((act: any) => (
                    <tr key={act._id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-800 dark:text-white text-xs sm:text-sm truncate max-w-[150px]">{act.title}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{act.category}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className={`px-2 py-0.5 rounded-sm text-xs ${act.status === 'published' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 text-sm">No recent activities</td>
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