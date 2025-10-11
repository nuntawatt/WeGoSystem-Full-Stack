import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';

interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  startDate: string;
  endDate?: string;
  maxParticipants: number;
  participants: string[];
  createdBy: { _id: string; email: string };
  status: string;
  createdAt: string;
}

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Using events API - same as activities but filter by date
      const response = await api.get('/events');
      const allActivities = response.data || [];
      // Filter activities that have startDate/endDate (events)
      const eventsOnly = allActivities.filter((a: any) => a.startDate);
      setEvents(eventsOnly);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await api.delete(`/events/${eventId}`);
      fetchEvents();
      if (selectedEvent?._id === eventId) {
        setShowModal(false);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Event Management</h1>
          <p className="text-primary-300 text-sm sm:text-base">Manage all events in the system</p>
        </div>
        <button onClick={fetchEvents} className="btn-ghost px-3 py-2 text-sm rounded-lg hover:bg-white/5">
          <i className="fas fa-sync-alt mr-2"></i>Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-yellow-300 text-xs font-medium mb-1">Total Events</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{filteredEvents.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-green-300 text-xs font-medium mb-1">Upcoming</p>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {filteredEvents.filter((e) => new Date(e.startDate) > new Date()).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-blue-300 text-xs font-medium mb-1">Past Events</p>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {filteredEvents.filter((e) => new Date(e.startDate) <= new Date()).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-3 sm:p-4">
          <p className="text-purple-300 text-xs font-medium mb-1">Total Participants</p>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {filteredEvents.reduce((sum, e) => sum + e.participants.length, 0)}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-primary-400"></i>
          <input
            type="text"
            placeholder="Search events by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-primary-700/50 text-white rounded-lg pl-10 pr-4 py-2.5 sm:py-3 border border-primary-600/50 focus:border-yellow-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-700/50">
              <tr>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Event</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Date & Time</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Location</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Participants</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm hidden md:table-cell">Creator</th>
                <th className="text-right py-3 sm:py-4 px-3 sm:px-6 text-primary-300 font-semibold text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
                  const isUpcoming = new Date(event.startDate) > new Date();
                  return (
                    <tr key={event._id} className="border-t border-primary-700/30 hover:bg-primary-700/30 transition-colors">
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <div className="min-w-0">
                          <p className="text-white font-medium text-xs sm:text-sm truncate">{event.title}</p>
                          <p className="text-primary-400 text-xs truncate max-w-[200px]">{event.description}</p>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <p className="text-white text-xs sm:text-sm">{new Date(event.startDate).toLocaleDateString()}</p>
                        <p className="text-primary-400 text-xs">{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-primary-300 text-xs sm:text-sm truncate max-w-[150px]">
                        {event.location || 'N/A'}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                          event.participants.length >= event.maxParticipants
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {event.participants.length}/{event.maxParticipants}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-primary-300 text-xs sm:text-sm hidden md:table-cell truncate max-w-[150px]">
                        {event.createdBy?.email || 'Unknown'}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            isUpcoming ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {isUpcoming ? 'Upcoming' : 'Past'}
                          </span>
                          <button
                            onClick={() => handleViewEvent(event)}
                            title="View event"
                            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all border border-blue-500/30"
                          >
                            <i className="fas fa-eye sm:mr-1"></i>
                            <span className="hidden sm:inline">View</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            title="Delete event"
                            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/30"
                          >
                            <i className="fas fa-trash sm:mr-1"></i>
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-primary-400">
                    <i className="fas fa-calendar-alt text-4xl mb-3 opacity-50"></i>
                    <p>No events found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-primary-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-primary-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-primary-800 border-b border-primary-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Event Details</h2>
              <button onClick={() => setShowModal(false)} className="text-primary-400 hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-primary-400 text-sm">Event Title</label>
                  <p className="text-white font-semibold text-lg">{selectedEvent.title}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-primary-400 text-sm">Description</label>
                  <p className="text-white">{selectedEvent.description}</p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Category</label>
                  <p className="text-white">
                    <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {selectedEvent.category}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Status</label>
                  <p className="text-white">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      new Date(selectedEvent.startDate) > new Date()
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {new Date(selectedEvent.startDate) > new Date() ? 'Upcoming' : 'Past'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-primary-400 text-sm">Start Date & Time</label>
                  <p className="text-white font-semibold">
                    {new Date(selectedEvent.startDate).toLocaleString()}
                  </p>
                </div>
                {selectedEvent.endDate && (
                  <div>
                    <label className="text-primary-400 text-sm">End Date & Time</label>
                    <p className="text-white font-semibold">
                      {new Date(selectedEvent.endDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Location & Participants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-primary-400 text-sm">Location</label>
                  <p className="text-white">{selectedEvent.location || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Participants</label>
                  <p className="text-white">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedEvent.participants.length >= selectedEvent.maxParticipants
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {selectedEvent.participants.length} / {selectedEvent.maxParticipants}
                    </span>
                  </p>
                </div>
              </div>

              {/* Creator & Created */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-primary-400 text-sm">Created By</label>
                  <p className="text-white">{selectedEvent.createdBy?.email || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm">Created On</label>
                  <p className="text-white">{new Date(selectedEvent.createdAt).toLocaleDateString()}</p>
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
                    if (confirm('Delete this event?')) {
                      handleDeleteEvent(selectedEvent._id);
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
