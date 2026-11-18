import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { 
  Activity as ActivityIcon, 
  Search, 
  RefreshCw, 
  Eye, 
  Trash2, 
  X, 
  MapPin, 
  Users, 
  Calendar, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { confirmDelete, showError, showSuccess } from '../../lib/swal';

interface ActivityItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  location?: string | { address?: string; coordinates?: { lat: number; lng: number } };
  maxParticipants: number;
  participants: string[];
  createdBy: { _id: string; email: string; username?: string };
  status: string;
  createdAt: string;
  coverImage?: string;
  cover?: string;
  images?: string[];
}

export default function ActivityManagement() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [usingPublicApi, setUsingPublicApi] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      try {
        const response = await api.get('/admin/activities');
        setActivities(response.data.activities || []);
        setUsingPublicApi(false);
      } catch (adminError: any) {
        if (adminError.response?.status === 401 || adminError.response?.status === 403) {
          const response = await api.get('/activities');
          setActivities(response.data.activities || []);
          setUsingPublicApi(true);
        } else {
          throw adminError;
        }
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    const result = await confirmDelete('กิจกรรมนี้');
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admin/activities/${activityId}`);
      showSuccess('ลบกิจกรรมสำเร็จ', 'กิจกรรมถูกลบออกจากระบบแล้ว');
      fetchActivities(true);
      if (selectedActivity?._id === activityId) {
        setShowModal(false);
        setSelectedActivity(null);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      showError('ไม่สามารถลบกิจกรรมได้', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleViewActivity = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setShowModal(true);
  };

  const categories = ['all', 'sport', 'music', 'travel', 'food', 'study', 'other'];

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof activity.location === 'string' && activity.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof activity.location === 'object' && activity.location?.address?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getLocationString = (location?: string | { address?: string; coordinates?: { lat: number; lng: number } }): string => {
    if (!location) return 'Not specified';
    if (typeof location === 'string') return location;
    return location.address || 'Not specified';
  };

  const getActivityImage = (activity: ActivityItem): string | null => {
    if (activity.coverImage && !activity.coverImage.startsWith('blob:')) {
      return activity.coverImage;
    }
    if (activity.cover && !activity.cover.startsWith('blob:')) {
      return activity.cover;
    }
    if (activity.images && activity.images.length > 0) {
      const validImage = activity.images.find((img) => !img.startsWith('blob:'));
      if (validImage) return validImage;
    }
    return null;
  };

  const getCreatorDisplay = (activity: ActivityItem): string => {
    const cb: any = (activity as any).createdBy;
    if (!cb) return 'Unknown';
    if (typeof cb === 'string') return cb;
    return cb.username || (cb.email ? cb.email.split('@')[0] : 'Unknown');
  };

  const totalActivitiesCount = activities.length;
  const publishedCount = activities.filter((a) => a.status === 'published').length;
  const totalParticipantsSum = activities.reduce((sum, a) => sum + (a.participants?.length || 0), 0);
  const categoriesCount = new Set(activities.map((a) => a.category)).size;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-[#147D70] border-t-transparent animate-spin" />
        <span className="text-sm font-medium text-[#858B89]">Loading activity records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#E8EBE9] p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight">
            Activity Management Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#858B89] mt-1">
            Audit and moderate community activities, member limits, and room publication statuses.
          </p>
          {usingPublicApi && (
            <div className="mt-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] inline-flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Operating with public fallback access</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => fetchActivities(true)}
          disabled={refreshing}
          className="btn-secondary text-xs px-3.5 py-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#147D70] ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Activities'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#858B89]">Total Rooms</span>
            <div className="w-9 h-9 rounded-xl bg-[#E0F3F1] flex items-center justify-center text-[#147D70]">
              <ActivityIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#202124]">{totalActivitiesCount}</div>
          <span className="text-[11px] text-[#858B89] mt-1 block">Activity listings created</span>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#858B89]">Published</span>
            <div className="w-9 h-9 rounded-xl bg-[#EAF5D5] flex items-center justify-center text-[#11665C]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#202124]">{publishedCount}</div>
          <span className="text-[11px] text-[#147D70] font-semibold mt-1 block">Visible in Explore</span>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#858B89]">Participants</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3F5F4] flex items-center justify-center text-[#202124]">
              <Users className="w-4 h-4 text-[#147D70]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#202124]">{totalParticipantsSum}</div>
          <span className="text-[11px] text-[#858B89] mt-1 block">Total member registrations</span>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#858B89]">Categories</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3F5F4] flex items-center justify-center text-[#858B89]">
              <ImageIcon className="w-4 h-4 text-[#202124]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#202124]">{categoriesCount}</div>
          <span className="text-[11px] text-[#858B89] mt-1 block">Active topic classifications</span>
        </div>
      </div>

      {/* Filter and Category Pills */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#858B89]" />
          <input
            type="text"
            placeholder="Search activities by title, location, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 text-xs py-2.5"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 thin-scrollbar">
          <span className="text-xs font-semibold text-[#858B89] flex-shrink-0">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? 'bg-[#147D70] text-white shadow-xs'
                  : 'bg-[#F3F5F4] text-[#5F6664] hover:bg-[#E8EBE9]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F3F5F4] text-[#858B89] font-semibold uppercase tracking-wider border-b border-[#E8EBE9]">
              <tr>
                <th className="py-3.5 px-6">Activity Room</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Location</th>
                <th className="py-3.5 px-4">Attendance</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Organizer</th>
                <th className="py-3.5 px-4 hidden xl:table-cell">Date Created</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EBE9]">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => {
                  const imgUrl = getActivityImage(activity);
                  const fullImg = imgUrl && imgUrl.startsWith('http')
                    ? imgUrl
                    : imgUrl
                      ? `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${imgUrl}`
                      : null;

                  const participantPct = Math.min(
                    Math.round(((activity.participants?.length || 0) / (activity.maxParticipants || 1)) * 100),
                    100
                  );

                  return (
                    <tr key={activity._id} className="hover:bg-[#F3F5F4]/70 transition-colors group">
                      {/* Title & Cover */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          {fullImg ? (
                            <img
                              src={fullImg}
                              alt={activity.title}
                              className="w-11 h-11 rounded-xl object-cover ring-1 ring-[#E8EBE9] flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-[#E0F3F1] text-[#147D70] flex items-center justify-center flex-shrink-0">
                              <ActivityIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-[240px]">
                            <p className="font-bold text-xs text-[#202124] truncate group-hover:text-[#147D70] transition-colors">
                              {activity.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#11665C] bg-[#E0F3F1] px-1.5 py-0.2 rounded">
                                {activity.category || 'General'}
                              </span>
                              <span className={`text-[10px] font-medium ${
                                activity.status === 'published' ? 'text-[#147D70]' : 'text-[#858B89]'
                              }`}>
                                • {activity.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-[#5F6664] max-w-[140px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#147D70] flex-shrink-0" />
                          <span className="truncate">{getLocationString(activity.location)}</span>
                        </div>
                      </td>

                      {/* Attendance Bar */}
                      <td className="py-3.5 px-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[11px] font-semibold text-[#202124] mb-1">
                            <span>{activity.participants?.length || 0} / {activity.maxParticipants}</span>
                            <span className="text-[#858B89]">{participantPct}%</span>
                          </div>
                          <div className="w-full bg-[#E8EBE9] rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-[#147D70] h-full rounded-full transition-all duration-300"
                              style={{ width: `${participantPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Organizer */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-[#5F6664]">
                        <span className="truncate max-w-[120px] block">
                          {getCreatorDisplay(activity)}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 hidden xl:table-cell text-[#858B89]">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewActivity(activity)}
                            className="btn-secondary py-1 px-2.5 text-xs font-semibold"
                            title="Inspect Activity"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </button>

                          <button
                            onClick={() => handleDeleteActivity(activity._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                            title="Delete Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#858B89]">
                    <ActivityIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">No activities found</p>
                    <p className="text-xs text-[#BAC2BF] mt-0.5">Try adjusting your category filter or search query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Activity Detail Modal */}
      {showModal && selectedActivity && (
        <div 
          className="fixed inset-0 bg-[#202124]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8EBE9] shadow-2xl animate-fade-in" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#202124] text-white px-6 py-5 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ActivityIcon className="w-4 h-4 text-[#D9F36A]" />
                  Activity Details Inspection
                </h3>
                <p className="text-xs text-[#858B89]">ID: {selectedActivity._id}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Cover Image */}
              {getActivityImage(selectedActivity) && (
                <div className="rounded-xl overflow-hidden border border-[#E8EBE9] h-56 bg-[#F3F5F4]">
                  <img
                    src={getActivityImage(selectedActivity)!.startsWith('http') ? getActivityImage(selectedActivity)! : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${getActivityImage(selectedActivity)}`}
                    alt={selectedActivity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title & Category */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF5D5] text-[#11665C] border border-[#D9F36A]">
                    {selectedActivity.category}
                  </span>
                  <span className="text-xs text-[#858B89]">
                    Status: <strong className="text-[#202124] capitalize">{selectedActivity.status}</strong>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#202124]">
                  {selectedActivity.title}
                </h2>
              </div>

              {/* Description */}
              <div>
                <span className="label">Description</span>
                <p className="p-4 rounded-xl bg-[#F3F5F4] border border-[#E8EBE9] text-xs text-[#202124] leading-relaxed">
                  {selectedActivity.description}
                </p>
              </div>

              {/* Info Matrix Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F3F5F4] border border-[#E8EBE9] flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#147D70] flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[#858B89] block font-medium">Location</span>
                    <span className="font-semibold text-[#202124] truncate block">
                      {getLocationString(selectedActivity.location)}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F3F5F4] border border-[#E8EBE9] flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#147D70] flex-shrink-0" />
                  <div>
                    <span className="text-[#858B89] block font-medium">Participants</span>
                    <span className="font-semibold text-[#202124]">
                      {selectedActivity.participants?.length || 0} / {selectedActivity.maxParticipants} max
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F3F5F4] border border-[#E8EBE9] flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#147D70] flex-shrink-0" />
                  <div>
                    <span className="text-[#858B89] block font-medium">Created On</span>
                    <span className="font-semibold text-[#202124]">
                      {new Date(selectedActivity.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F3F5F4] border border-[#E8EBE9] flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#147D70] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {getCreatorDisplay(selectedActivity).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[#858B89] block font-medium">Organizer</span>
                    <span className="font-semibold text-[#202124] truncate block">
                      {getCreatorDisplay(selectedActivity)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#E8EBE9] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs flex-1"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteActivity(selectedActivity._id)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
