import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';

interface Group {
  _id: string;
  name: string;
  description?: string;
  members: any[];
  admin: { _id: string; email: string };
  createdAt: string;
}

export default function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      // Groups might not have a list endpoint, so we'll show empty for now
      // You can add backend endpoint later if needed
      setGroups([]);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      await api.delete(`/groups/${groupId}`);
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    }
  };

  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Group Management</h1>
          <p className="text-primary-300 text-sm sm:text-base">Manage all groups in the system</p>
        </div>
        <button onClick={fetchGroups} className="btn-ghost px-3 py-2 text-sm rounded-lg hover:bg-white/5">
          <i className="fas fa-sync-alt mr-2"></i>Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-purple-300 text-xs font-medium mb-1">Total Groups</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{filteredGroups.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-blue-300 text-xs font-medium mb-1">Total Members</p>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {filteredGroups.reduce((sum, g) => sum + g.members.length, 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-green-300 text-xs font-medium mb-1">Avg Members</p>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {filteredGroups.length > 0
              ? Math.round(filteredGroups.reduce((sum, g) => sum + g.members.length, 0) / filteredGroups.length)
              : 0}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-primary-400"></i>
          <input
            type="text"
            placeholder="Search groups by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-primary-700/50 text-white rounded-lg pl-10 pr-4 py-2.5 sm:py-3 border border-primary-600/50 focus:border-purple-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-700/50">
              <tr>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Group</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Members</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Admin</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm hidden md:table-cell">Created</th>
                <th className="text-right py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <tr key={group._id} className="border-t border-primary-700/30 hover:bg-primary-700/30 transition-colors">
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-400/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-users text-purple-400 text-lg"></i>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-xs sm:text-sm truncate">{group.name}</p>
                          <p className="text-primary-400 text-xs truncate max-w-[200px]">{group.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {group.members.length} members
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-primary-300 text-xs sm:text-sm truncate max-w-[150px]">
                      {group.admin?.email || 'Unknown'}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-primary-300 text-xs sm:text-sm hidden md:table-cell">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => window.open(`/groups/${group._id}`, '_blank')}
                          title="View group"
                          className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all border border-blue-500/30"
                        >
                          <i className="fas fa-eye sm:mr-1"></i>
                          <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group._id)}
                          title="Delete group"
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
                  <td colSpan={5} className="py-12 text-center text-primary-400">
                    <i className="fas fa-user-friends text-4xl mb-3 opacity-50"></i>
                    <p>No groups found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
