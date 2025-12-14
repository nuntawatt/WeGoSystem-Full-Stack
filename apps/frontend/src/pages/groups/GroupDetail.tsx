// apps/frontend/src/pages/groups/GroupDetail.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatPanel from '../../components/ChatPanel';
import AvailabilityPicker from '../../components/AvailabilityPicker';
import RatingDialog from '../../components/RatingDialog';
import MemberListDM from '../../components/MemberListDM';
import GroupReviews from '../../components/GroupReviews';
import ReportModal from '../../components/ReportModal';
import { useAuth } from '../../hooks/useAuth';
import { MessageSquare, AlertTriangle, Calendar, Star } from 'lucide-react';

export default function GroupDetail() {
  const { id } = useParams();
  const gid = id || '';
  const { user } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="min-h-screen py-10 bg-slate-50 dark:bg-slate-900">
      <div className="container-app">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 dark:bg-slate-800 dark:border-slate-700">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-block p-3 bg-teal-700 rounded-sm mb-4">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold mb-3 text-slate-800 dark:text-slate-100" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Group Details
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg flex items-center justify-center gap-4">
            <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Chat</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Plan schedules</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4" /> Rate members</span>
          </p>
          
          {/* Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="mt-4 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-500 transition-colors flex items-center gap-2 mx-auto rounded-sm border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <AlertTriangle className="w-4 h-4" />
            Report Group
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ChatPanel groupId={gid} />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 dark:bg-slate-800 dark:border-slate-700">
              <GroupReviews groupId={gid} currentUserId={user?._id} />
            </div>

            <RatingDialog />
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 dark:bg-slate-800 dark:border-slate-700">
              <AvailabilityPicker />
            </div>
          </aside>
        </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="group"
        targetId={gid}
      />
    </section>
  );
}
