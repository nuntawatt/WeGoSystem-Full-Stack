import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/apiClient';
import { 
  Users, 
  Activity, 
  Flag, 
  UserCheck, 
  RefreshCw, 
  ArrowRight, 
  Calendar,
  MessageSquare,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  Clock,
  Heart,
  Zap,
  Search,
  Bell,
  MoreVertical,
  Percent,
  ChevronDown,
  Moon
} from 'lucide-react';

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchDashboardStats();
  }, [user, navigate]);

  const fetchDashboardStats = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-[#147D70] border-t-transparent animate-spin" />
        <span className="text-sm font-medium text-[#858B89]">Loading operational dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-white border border-red-200 rounded-2xl p-6 max-w-md w-full shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#202124]">Connection Error</h3>
            <p className="text-xs text-[#858B89] mt-1">{error}</p>
          </div>
          <button
            onClick={() => fetchDashboardStats(false)}
            className="btn-primary w-full text-xs"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { stats, recentUsers, recentActivities } = dashboardData;
  const pendingReportsCount = stats.pendingReports || 0;
  const activeMembersOnline = Math.max(1, Math.floor(stats.totalUsers * 0.75));
  const totalEngagementScore = (stats.totalActivities * 180 + stats.totalUsers * 45 + stats.totalChats * 30);

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-8">
      {/* Top Header Row — Reference 1 (Lucas Bennett / Health Overview Layout) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-1">
        <div className="space-y-3">
          {/* User Profile Chip */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#147D70] text-white font-bold flex items-center justify-center overflow-hidden border-2 border-white shadow-xs">
              {(user as any)?.avatar ? (
                <img src={(user as any).avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.username ? user.username.charAt(0).toUpperCase() : 'A'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-[#202124]">
                <span>{user?.username || user?.email?.split('@')[0] || 'Lucas Bennett'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#858B89]" />
              </div>
              <p className="text-xs text-[#858B89]">{user?.email || 'admin@wego.app'}</p>
            </div>
          </div>

          {/* Large Page Heading & Subtitle */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#202124]">
              Activity Overview
            </h1>
            <p className="text-xs sm:text-sm text-[#858B89] mt-0.5">
              Take control of your activities and community today!
            </p>
          </div>
        </div>

        {/* Right Search, Notification & Date Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Pill */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#858B89] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2.5 bg-white border border-[#E8EBE9] rounded-full text-xs text-[#202124] placeholder-[#858B89] focus:outline-none focus:ring-2 focus:ring-[#147D70]/20 shadow-xs w-48 sm:w-56"
            />
          </div>

          {/* Notification Bell with Lime Green Badge */}
          <div className="relative">
            <button 
              onClick={() => navigate('/admin/reports')}
              className="w-10 h-10 rounded-full bg-white border border-[#E8EBE9] text-[#202124] hover:border-[#147D70] transition-colors flex items-center justify-center shadow-xs"
              title="Moderation & Reports"
            >
              <Bell className="w-4 h-4" />
            </button>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D9F36A] text-[#202124] border-2 border-white text-[10px] font-black flex items-center justify-center shadow-xs">
              {pendingReportsCount || 2}
            </span>
          </div>

          {/* Date & Today Pill */}
          <div className="flex items-center gap-2">
            <div className="px-4 py-2.5 rounded-full bg-white border border-[#E8EBE9] text-xs font-semibold text-[#858B89] shadow-xs">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div 
              onClick={() => fetchDashboardStats(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-[#E8EBE9] text-xs font-bold text-[#202124] shadow-xs cursor-pointer hover:border-[#147D70] transition-colors"
            >
              <span>Today</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#858B89]" />
            </div>
          </div>
        </div>
      </div>

      {/* 5-Card Grid Blueprint — Direct match to Reference 1 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* CARD 1: Energy Used / Activity Energy (Left Column, 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#E8EBE9] shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#EAF5D5] text-[#147D70]">
                  <Zap className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-[#202124]">Activity Energy</h3>
              </div>
              <button className="text-[#858B89] hover:text-[#202124]">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-extrabold text-[#202124]">
                {(totalEngagementScore / 1000).toFixed(1)}k
              </span>
              <span className="text-xs font-bold text-[#147D70] bg-[#D9F36A] px-2 py-0.5 rounded-full text-[#202124]">
                +12% today
              </span>
            </div>
          </div>

          {/* 3 Circular Overlapping Bubbles Graphic */}
          <div className="relative h-44 flex items-center justify-center my-3 select-none">
            {/* 1. Large Lavender Circle */}
            <div className="w-32 h-32 rounded-full bg-[#C4B5FD] border-2 border-white shadow-md flex flex-col items-center justify-center text-[#202124] absolute left-6 sm:left-12">
              <span className="text-2xl font-black">{stats.totalActivities || 26}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Rooms</span>
            </div>

            {/* 2. Dark Charcoal Circle */}
            <div className="w-28 h-28 rounded-full bg-[#202124] border-2 border-white shadow-lg flex flex-col items-center justify-center text-white absolute right-6 sm:right-12 z-10">
              <span className="text-xl font-black">{stats.totalGroups || 12}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#BAC2BF]">Groups</span>
            </div>

            {/* 3. Lime Green Highlight Circle */}
            <div className="w-20 h-20 rounded-full bg-[#D9F36A] border-2 border-white shadow-lg flex flex-col items-center justify-center text-[#202124] absolute bottom-0 left-28 sm:left-36 z-20">
              <span className="text-base font-black">{stats.totalEvents || 8}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider">Sessions</span>
            </div>
          </div>

          {/* Breakdown Progress Bars below bubbles */}
          <div className="space-y-3 pt-3 border-t border-[#E8EBE9]">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-[#202124]">
                <span>45%</span>
                <span className="text-[#858B89] font-medium text-[11px] flex items-center gap-1.5">
                  Academic & Study
                  <span className="w-2 h-2 rounded-full bg-[#C4B5FD]" />
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#F3F5F4] rounded-full overflow-hidden">
                <div className="h-full bg-[#C4B5FD] rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-[#202124]">
                <span>30%</span>
                <span className="text-[#858B89] font-medium text-[11px] flex items-center gap-1.5">
                  Coding & Tech
                  <span className="w-2 h-2 rounded-full bg-[#202124]" />
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#F3F5F4] rounded-full overflow-hidden">
                <div className="h-full bg-[#202124] rounded-full" style={{ width: '30%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-[#202124]">
                <span>25%</span>
                <span className="text-[#858B89] font-medium text-[11px] flex items-center gap-1.5">
                  Community & Meetups
                  <span className="w-2 h-2 rounded-full bg-[#D9F36A]" />
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#F3F5F4] rounded-full overflow-hidden">
                <div className="h-full bg-[#D9F36A] rounded-full" style={{ width: '25%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION (7 cols): Top 3 Sub-Cards + Bottom Dark Charcoal Card */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* Top Sub-Row: 3 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* CARD 2: Active Members (Heart Rate style) */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8EBE9] shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  <span className="text-xs font-bold text-[#202124]">Active Members</span>
                </div>
                <MoreVertical className="w-3.5 h-3.5 text-[#858B89]" />
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#202124]">
                  {stats.totalUsers}
                </span>
                <span className="text-xs text-[#858B89] ml-1">users</span>
              </div>

              <div className="pt-2 border-t border-[#E8EBE9] text-[11px] text-[#858B89] flex items-center justify-between">
                <span>Active</span>
                <span className="font-bold text-[#147D70]">{activeMembersOnline} Online</span>
              </div>
            </div>

            {/* CARD 3: Scheduled Activities (Activity style) */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8EBE9] shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#147D70]" />
                  <span className="text-xs font-bold text-[#202124]">Activity</span>
                </div>
                <MoreVertical className="w-3.5 h-3.5 text-[#858B89]" />
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#202124]">
                  {stats.totalActivities}
                </span>
                <span className="text-xs text-[#858B89] ml-1">rooms</span>
              </div>

              <div className="pt-2 border-t border-[#E8EBE9] text-[11px] text-[#858B89] flex items-center justify-between">
                <span>Active</span>
                <span className="font-bold text-[#202124]">{stats.totalEvents} Sessions</span>
              </div>
            </div>

            {/* CARD 4: Wellness / Safety Index (Wellness Index style with Dot Matrix) */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8EBE9] shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-[#147D70]" />
                  <span className="text-xs font-bold text-[#202124]">Safety Index</span>
                </div>
                <MoreVertical className="w-3.5 h-3.5 text-[#858B89]" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#202124]">
                  98<span className="text-sm font-semibold">%</span>
                </span>
                <span className="text-[10px] font-bold text-[#202124] bg-[#D9F36A] px-1.5 py-0.2 rounded-full">
                  +10%
                </span>
              </div>

              {/* Dot Matrix Visualization (5 rows x 11 cols) */}
              <div className="pt-2 border-t border-[#E8EBE9] grid grid-cols-11 gap-1">
                {Array.from({ length: 33 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i % 3 === 0 
                        ? 'bg-[#C4B5FD]' 
                        : i % 4 === 0 
                          ? 'bg-[#147D70]' 
                          : 'bg-[#C4B5FD]/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CARD 5: Dark Charcoal Card (Sleep Analysis style) */}
          <div className="bg-[#202124] text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-[#D9F36A]">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Session Analysis</h3>
                  <p className="text-xs text-[#BAC2BF]">Participant attendance and activity duration</p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white font-medium cursor-pointer hover:bg-white/15 transition-colors">
                Monthly ▾
              </div>
            </div>

            {/* Highlights with Vertical Color Indicator Bars */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-9 bg-[#D9F36A] rounded-full" />
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-white">85<span className="text-lg font-normal">%</span></span>
                  <p className="text-xs text-[#BAC2BF]">Attendance Rate</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-1.5 h-9 bg-[#C4B5FD] rounded-full" />
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-white">7h 15m</span>
                  <p className="text-xs text-[#BAC2BF]">Avg Session Time</p>
                </div>
              </div>
            </div>

            {/* Bar Chart Visualization (7 Months, Sept Active) */}
            <div className="pt-4 border-t border-white/10">
              <div className="grid grid-cols-7 gap-3 items-end h-32 px-1">
                {/* Jun */}
                <div className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full bg-white/10 rounded-lg h-[40%] hover:bg-white/20 transition-all" />
                  <span className="text-[11px] text-[#858B89]">Jun</span>
                </div>

                {/* Jul */}
                <div className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full bg-white/10 rounded-lg h-[55%] hover:bg-white/20 transition-all" />
                  <span className="text-[11px] text-[#858B89]">Jul</span>
                </div>

                {/* Aug */}
                <div className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full bg-white/10 rounded-lg h-[65%] hover:bg-white/20 transition-all" />
                  <span className="text-[11px] text-[#858B89]">Aug</span>
                </div>

                {/* Sept - Active Peak (Lime & Lavender) */}
                <div className="flex flex-col items-center gap-2 h-full justify-end relative">
                  <div className="w-full flex gap-1 h-[95%] items-end">
                    <div className="w-1/2 bg-[#D9F36A] rounded-md h-full shadow-lg shadow-[#D9F36A]/20" />
                    <div className="w-1/2 bg-[#C4B5FD] rounded-md h-[72%]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#D9F36A]">Sept ↗</span>
                </div>

                {/* Oct */}
                <div className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full bg-white/10 rounded-lg h-[60%] hover:bg-white/20 transition-all" />
                  <span className="text-[11px] text-[#858B89]">Oct</span>
                </div>

                {/* Nov */}
                <div className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full bg-white/10 rounded-lg h-[50%] hover:bg-white/20 transition-all" />
                  <span className="text-[11px] text-[#858B89]">Nov</span>
                </div>

                {/* Dec */}
                <div className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full bg-white/10 rounded-lg h-[45%] hover:bg-white/20 transition-all" />
                  <span className="text-[11px] text-[#858B89]">Dec</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* System Data Tables: Recent Users & Recent Activities (Real System Data) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
        {/* Recent Users Table */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-[#E8EBE9] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E0F3F1] text-[#147D70] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#202124]">Recently Registered Users</h2>
                <p className="text-xs text-[#858B89]">Latest accounts joined to WegoSystem</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-xs font-semibold text-[#147D70] hover:text-[#11665C] flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F5F4] text-[#858B89] font-semibold uppercase tracking-wider border-b border-[#E8EBE9]">
                <tr>
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBE9]">
                {recentUsers && recentUsers.length > 0 ? (
                  recentUsers.slice(0, 6).map((u: any) => (
                    <tr key={u._id} className="hover:bg-[#F3F5F4]/70 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#147D70] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {u.email?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#202124] truncate">
                              {u.username || u.email?.split('@')[0]}
                            </p>
                            <p className="text-[#858B89] text-[11px] truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-[#202124] text-white'
                            : 'bg-[#F3F5F4] text-[#5F6664] border border-[#E8EBE9]'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            u.isBlocked 
                              ? 'bg-red-500' 
                              : u.isOnline 
                                ? 'bg-[#147D70]' 
                                : 'bg-[#BAC2BF]'
                          }`} />
                          <span className="text-[11px] text-[#5F6664]">
                            {u.isBlocked ? 'Blocked' : u.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right text-[#858B89] text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#858B89] text-xs">
                      No recent users recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Table */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-[#E8EBE9] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EAF5D5] text-[#11665C] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#202124]">Recent Activities</h2>
                <p className="text-xs text-[#858B89]">Community rooms & study sessions</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/activities')}
              className="text-xs font-semibold text-[#147D70] hover:text-[#11665C] flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F5F4] text-[#858B89] font-semibold uppercase tracking-wider border-b border-[#E8EBE9]">
                <tr>
                  <th className="py-3 px-5">Activity</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBE9]">
                {recentActivities && recentActivities.length > 0 ? (
                  recentActivities.slice(0, 6).map((act: any) => (
                    <tr key={act._id} className="hover:bg-[#F3F5F4]/70 transition-colors">
                      <td className="py-3 px-5">
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-semibold text-[#202124] truncate">{act.title}</p>
                          <p className="text-[#858B89] text-[11px] truncate">
                            {act.participants?.length || 0} participants
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E0F3F1] text-[#11665C] border border-[#BFE7E2] capitalize">
                          {act.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          act.status === 'published'
                            ? 'bg-[#EAF5D5] text-[#4D5810] border border-[#D9F36A]'
                            : 'bg-[#F3F5F4] text-[#5F6664] border border-[#E8EBE9]'
                        }`}>
                          {act.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right text-[#858B89] text-[11px]">
                        {new Date(act.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#858B89] text-xs">
                      No activities found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Footer */}
      <div className="bg-[#202124] rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D9F36A]" />
            <h3 className="font-bold text-base text-white">Administrator Quick Actions</h3>
          </div>
          <p className="text-xs text-[#858B89]">
            Frequently accessed functions to coordinate the platform.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate('/create')}
            className="btn-accent text-xs"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Create Activity
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            Manage Users
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            Review Reports
          </button>
          <button
            onClick={() => navigate('/explore')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Public View
          </button>
        </div>
      </div>
    </div>
  );
}
