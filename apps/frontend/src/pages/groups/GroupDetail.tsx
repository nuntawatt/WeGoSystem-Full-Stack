import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ChatPanel from '../../components/ChatPanel';
import AvailabilityPicker from '../../components/AvailabilityPicker';
import RatingDialog from '../../components/RatingDialog';
import MemberListDM from '../../components/MemberListDM';
import GroupReviews from '../../components/GroupReviews';
import ReportModal from '../../components/ReportModal';
import { useAuth } from '../../hooks/useAuth';
import { 
  MessageSquare, 
  AlertTriangle, 
  Calendar, 
  Star, 
  Users, 
  ArrowLeft,
  Clock,
  Sparkles
} from 'lucide-react';

export default function GroupDetail() {
  const { id } = useParams();
  const gid = id || '';
  const { user } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="min-h-screen py-8 bg-[#F3F5F4]">
      <div className="container-app space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#858B89] hover:text-[#202124] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explorer</span>
          </Link>

          <button
            onClick={() => setShowReportModal(true)}
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Activity</span>
          </button>
        </div>

        {/* Room Header Card */}
        <div className="card p-6 sm:p-8 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E0F3F1] text-[#11665C] border border-[#BFE7E2]">
                Collaboration Room
              </span>
              <span className="text-xs text-[#858B89]">ID: {gid.slice(-8)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight">
              Group Activity Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[#858B89] flex flex-wrap items-center gap-4 pt-1">
              <span className="flex items-center gap-1.5 font-medium text-[#202124]">
                <MessageSquare className="w-4 h-4 text-[#147D70]" /> Live Group Chat
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#202124]">
                <Clock className="w-4 h-4 text-[#147D70]" /> Synchronized Availability
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#202124]">
                <Star className="w-4 h-4 text-[#147D70]" /> Peer Ratings & Reviews
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              to={`/groups/${gid}/schedule`}
              className="btn-accent text-xs px-4 py-2.5 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Calendar className="w-4 h-4" />
              <span>Full Schedule Matrix</span>
            </Link>
          </div>
        </div>

        {/* Main Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Left Pane: Chat & Reviews */}
          <div className="lg:col-span-8 space-y-6">
            <ChatPanel groupId={gid} />

            <div className="card p-5 bg-white">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8EBE9]">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#147D70]" />
                  <h3 className="font-bold text-sm text-[#202124]">Member Reviews & Experiences</h3>
                </div>
              </div>
              <GroupReviews groupId={gid} currentUserId={user?._id} />
            </div>

            <RatingDialog />
          </div>

          {/* Right Sidebar: Availability Picker */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="card p-5 bg-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8EBE9]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#147D70]" />
                  <h3 className="font-bold text-sm text-[#202124]">Quick Time Availability</h3>
                </div>
              </div>
              <AvailabilityPicker />
            </div>
          </aside>
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
