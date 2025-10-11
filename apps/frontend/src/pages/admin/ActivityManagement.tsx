import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';

interface Activity {
  _id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  maxParticipants: number;
  participants: string[];
  createdBy: { _id: string; email: string };
  status: string;
  createdAt: string;
  coverImage?: string;
}

export default function ActivityManagement() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      setActivities(response.data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      await api.delete(`/events/${activityId}`);
      fetchActivities();
      if (selectedActivity?._id === activityId) {
        setShowModal(false);
        setSelectedActivity(null);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity');
    }
  };

  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowModal(true);
  };

  const categories = ['all', 'sport', 'music', 'travel', 'food', 'study', 'other'];

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Activity Management</h1>
          <p className="text-primary-300 text-sm sm:text-base">Manage all activities in the system</p>
        </div>
        <button onClick={fetchActivities} className="btn-ghost px-3 py-2 text-sm rounded-lg hover:bg-white/5">
          <i className="fas fa-sync-alt mr-2"></i>Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-green-300 text-xs font-medium mb-1">Total Activities</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{filteredActivities.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-blue-300 text-xs font-medium mb-1">Published</p>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {filteredActivities.filter((a) => a.status === 'published').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-yellow-300 text-xs font-medium mb-1">Total Participants</p>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {filteredActivities.reduce((sum, a) => sum + a.participants.length, 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-purple-300 text-xs font-medium mb-1">Categories</p>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {new Set(filteredActivities.map((a) => a.category)).size}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-primary-400"></i>
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-primary-700/50 text-white rounded-lg pl-10 pr-4 py-2.5 sm:py-3 border border-primary-600/50 focus:border-green-400 focus:outline-none transition-colors"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-primary-700/50 text-white rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border border-primary-600/50 focus:border-green-400 focus:outline-none cursor-pointer transition-colors"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-700/50">
              <tr>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Activity</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Category</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Participants</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <tr key={activity._id} className="border-t border-primary-700/30 hover:bg-primary-700/30 transition-colors">
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {activity.coverImage ? (
                          <img
                            src={activity.coverImage.startsWith('http') ? activity.coverImage : `http://localhost:3000${activity.coverImage}`}
                            alt={activity.title}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-green-400/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-image text-green-400"></i>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-white font-medium text-xs sm:text-sm truncate">{activity.title}</p>
                          <p className="text-primary-400 text-xs truncate max-w-[150px]">{activity.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {activity.category}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-white text-xs sm:text-sm">
                      {activity.participants?.length || 0} participants
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-primary-400">
                    <i className="fas fa-clipboard-list text-4xl mb-3 opacity-50"></i>
                    <p>No activities found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-primary-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-primary-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-primary-800 border-b border-primary-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Activity Details</h2>
              <button onClick={() => setShowModal(false)} className="text-primary-400 hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Cover Image */}
              {selectedActivity.coverImage && (
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={selectedActivity.coverImage.startsWith('http') ? selectedActivity.coverImage : `http://localhost:3000${selectedActivity.coverImage}`}
                    alt={selectedActivity.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-primary-400 text-sm">Title</label>
                  <p className="text-white font-semibold text-lg">{selectedActivity.title}</p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Category</label>
                  <p className="text-white">
                    <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {selectedActivity.category}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-primary-400 text-sm">Description</label>
                <p className="text-white">{selectedActivity.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-primary-400 text-sm">Location</label>
                  <p className="text-white">{selectedActivity.location || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Status</label>
                  <p className="text-white">
                    <span className={`px-3 py-1 rounded-full text-sm ${selectedActivity.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {selectedActivity.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-primary-400 text-sm">Max Participants</label>
                  <p className="text-white font-semibold">{selectedActivity.maxParticipants}</p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Current Participants</label>
                  <p className="text-white font-semibold">{selectedActivity.participants.length}</p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Created</label>
                  <p className="text-white">{new Date(selectedActivity.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <label className="text-primary-400 text-sm">Created By</label>
                <p className="text-white">{selectedActivity.createdBy?.email || 'Unknown'}</p>
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
                    if (confirm('Delete this activity?')) {
                      handleDeleteActivity(selectedActivity._id);
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
