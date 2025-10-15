// apps/frontend/src/pages/groups/GroupDetail.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatPanel from '../../components/ChatPanel';
import AvailabilityPicker from '../../components/AvailabilityPicker';
import RatingDialog from '../../components/RatingDialog';
import MemberListDM from '../../components/MemberListDM';

export default function GroupDetail() {
  const { id } = useParams();
  const gid = id || '';

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
        </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <ChatPanel groupId={gid} />
        <RatingDialog />
      </div>
      <div className="space-y-6">
        <AvailabilityPicker />
      </div>
      </div>
      </div>
    </section>
  );
}
