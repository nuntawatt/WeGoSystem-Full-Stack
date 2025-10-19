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
    <section className="min-h-screen py-8">
      <div className="container-app">
        {/* Header with Icon */}
        <header className="mb-6 text-center">
          <div className="inline-block p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl mb-4 shadow-lg shadow-cyan-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-pink-300 to-amber-400 bg-clip-text text-transparent font-['Poppins']">
            Group Details
          </h2>
          <p className="text-slate-400">Chat, plan schedules, and rate members</p>
          
          {/* Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Report Group
          </button>
        </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <ChatPanel groupId={gid} />
        <GroupReviews groupId={gid} currentUserId={user?._id} />
        <RatingDialog />
      </div>
      <div className="space-y-6">
        <AvailabilityPicker />
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
