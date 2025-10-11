import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';

interface Chat {
  _id: string;
  type: 'direct' | 'group';
  participants: any[];
  activity?: { _id: string; title: string };
  messages: any[];
  createdAt: string;
  updatedAt: string;
}

export default function ChatManagement() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'direct' | 'group'>('all');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chats');
      // Handle response - might be array or object with chats property
      const chatsData = Array.isArray(response.data) ? response.data : (response.data.chats || []);
      setChats(chatsData);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat? All messages will be lost.')) return;

    try {
      await api.delete(`/chats/${chatId}`);
      fetchChats();
      if (selectedChat?._id === chatId) {
        setShowModal(false);
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat');
    }
  };

  const handleViewChat = (chat: Chat) => {
    setSelectedChat(chat);
    setShowModal(true);
  };

  const filteredChats = chats.filter((chat) => {
    const matchesType = filterType === 'all' || chat.type === filterType;
    const matchesSearch = chat.activity?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.participants.some((p: any) => p.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Chat Management</h1>
          <p className="text-primary-300 text-sm sm:text-base">Monitor and manage all chats in the system</p>
        </div>
        <button onClick={fetchChats} className="btn-ghost px-3 py-2 text-sm rounded-lg hover:bg-white/5">
          <i className="fas fa-sync-alt mr-2"></i>Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-pink-300 text-xs font-medium mb-1">Total Chats</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{filteredChats.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-blue-300 text-xs font-medium mb-1">Direct Chats</p>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {filteredChats.filter((c) => c.type === 'direct').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-green-300 text-xs font-medium mb-1">Group Chats</p>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {filteredChats.filter((c) => c.type === 'group').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-purple-300 text-xs font-medium mb-1">Total Messages</p>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {filteredChats.reduce((sum, c) => sum + (c.messages?.length || 0), 0)}
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
              placeholder="Search chats by activity or participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-primary-700/50 text-white rounded-lg pl-10 pr-4 py-2.5 sm:py-3 border border-primary-600/50 focus:border-pink-400 focus:outline-none transition-colors"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-primary-700/50 text-white rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border border-primary-600/50 focus:border-pink-400 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="all">All Types</option>
            <option value="direct">Direct Only</option>
            <option value="group">Group Only</option>
          </select>
        </div>
      </div>

      {/* Chats Table */}
      <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-700/50">
              <tr>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Chat Info</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Type</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Participants</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Messages</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm hidden md:table-cell">Last Activity</th>
                <th className="text-right py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <tr key={chat._id} className="border-t border-primary-700/30 hover:bg-primary-700/30 transition-colors">
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${
                          chat.type === 'direct'
                            ? 'bg-gradient-to-br from-blue-400/20 to-purple-500/20'
                            : 'bg-gradient-to-br from-green-400/20 to-emerald-500/20'
                        } flex items-center justify-center flex-shrink-0`}>
                          <i className={`fas ${chat.type === 'direct' ? 'fa-user' : 'fa-users'} text-${chat.type === 'direct' ? 'blue' : 'green'}-400 text-lg`}></i>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-xs sm:text-sm truncate">
                            {chat.activity?.title || `${chat.type === 'direct' ? 'Direct' : 'Group'} Chat`}
                          </p>
                          <p className="text-primary-400 text-xs">
                            {chat.type === 'direct' ? '1-on-1 conversation' : 'Activity group chat'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                        chat.type === 'direct'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {chat.type}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-white text-xs sm:text-sm">
                      {chat.participants.length} users
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleViewChat(chat)}
                          title="View chat"
                          className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all border border-blue-500/30"
                        >
                          <i className="fas fa-eye sm:mr-1"></i>
                          <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                          onClick={() => handleDeleteChat(chat._id)}
                          title="Delete chat"
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
                    <i className="fas fa-comments text-4xl mb-3 opacity-50"></i>
                    <p>No chats found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showModal && selectedChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-primary-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-primary-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-primary-800 border-b border-primary-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Chat Details</h2>
              <button onClick={() => setShowModal(false)} className="text-primary-400 hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Chat Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-primary-400 text-sm">Chat Type</label>
                  <p className="text-white">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedChat.type === 'direct'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {selectedChat.type === 'direct' ? 'Direct Message' : 'Group Chat'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Participants</label>
                  <p className="text-white font-semibold">{selectedChat.participants.length} users</p>
                </div>
                {selectedChat.activity && (
                  <div className="md:col-span-2">
                    <label className="text-primary-400 text-sm">Related Activity</label>
                    <p className="text-white font-semibold">{selectedChat.activity.title}</p>
                  </div>
                )}
                <div>
                  <label className="text-primary-400 text-sm">Created</label>
                  <p className="text-white">{new Date(selectedChat.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Last Activity</label>
                  <p className="text-white">{new Date(selectedChat.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Participants List */}
              <div>
                <label className="text-primary-400 text-sm mb-2 block">Participants ({selectedChat.participants.length})</label>
                <div className="bg-primary-700/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    {selectedChat.participants.map((participant: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 text-white text-sm">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-400 font-bold text-xs">
                            {participant.email?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <span>{participant.email || 'Unknown'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div>
                <label className="text-primary-400 text-sm mb-2 block">
                  Messages ({selectedChat.messages?.length || 0})
                </label>
                <div className="bg-primary-700/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {selectedChat.messages && selectedChat.messages.length > 0 ? (
                    <div className="space-y-3">
                      {selectedChat.messages.slice(-20).map((message: any, idx: number) => (
                        <div key={idx} className="bg-primary-600/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-blue-400 font-semibold text-sm">
                              {message.sender?.email || 'Unknown'}
                            </span>
                            <span className="text-primary-400 text-xs">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-white text-sm">{message.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-primary-400 py-8">No messages yet</p>
                  )}
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
                    if (confirm('Delete this chat and all its messages?')) {
                      handleDeleteChat(selectedChat._id);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/30"
                >
                  <i className="fas fa-trash mr-2"></i>Delete Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
