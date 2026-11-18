import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { showSuccess, showError } from '../../lib/swal';
import { 
  Flag, 
  Search, 
  RefreshCw, 
  Eye, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar, 
  FileText,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

type Report = {
  _id: string;
  targetType: 'group' | 'activity' | 'user';
  targetId: string;
  reportedBy: {
    _id: string;
    email: string;
    username?: string;
  };
  reason: string;
  details: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  adminNotes?: string;
  reviewedBy?: {
    _id: string;
    email: string;
    username?: string;
  };
  reviewedAt?: string;
  createdAt: string;
};

type ReportDetails = {
  report: Report;
  targetDetails: any;
};

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam or Advertising',
  inappropriate_content: 'Inappropriate Content',
  harassment: 'Harassment or Bullying',
  false_information: 'False Information',
  scam: 'Scam or Fraud',
  other: 'Other Violation'
};

export default function ReportManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<ReportDetails | null>(null);
  const [actionModal, setActionModal] = useState<{ show: boolean; action: string }>({ show: false, action: '' });
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filterStatus, filterType]);

  const fetchReports = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.targetType = filterType;

      const response = await api.get('/admin/reports', { params });
      setReports(response.data.reports || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      showError('โหลดรายงานไม่สำเร็จ', error?.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReportDetails = async (reportId: string) => {
    try {
      const response = await api.get(`/admin/reports/${reportId}`);
      setSelectedReport(response.data);
    } catch (error: any) {
      console.error('Error fetching report details:', error);
      showError('โหลดรายละเอียดไม่สำเร็จ', error?.response?.data?.error || 'Failed to load report details');
    }
  };

  const updateReportStatus = async (reportId: string, status: string, notes?: string) => {
    try {
      setProcessing(true);
      await api.put(`/admin/reports/${reportId}`, {
        status,
        adminNotes: notes
      });
      showSuccess('อัปเดตสถานะสำเร็จ!', 'สถานะรายงานได้รับการปรับปรุงแล้ว');
      fetchReports(true);
      if (selectedReport?.report._id === reportId) {
        fetchReportDetails(reportId);
      }
    } catch (error: any) {
      console.error('Error updating report:', error);
      showError('อัปเดตไม่สำเร็จ', error?.response?.data?.error || 'Failed to update report');
    } finally {
      setProcessing(false);
    }
  };

  const takeAction = async (reportId: string, action: string) => {
    try {
      setProcessing(true);
      await api.post(`/admin/reports/${reportId}/action`, {
        action,
        reason: actionReason
      });
      showSuccess('ดำเนินการสำเร็จ!', `ดำเนินการ "${action}" เรียบร้อยแล้ว`);
      setActionModal({ show: false, action: '' });
      setActionReason('');
      fetchReports(true);
      setSelectedReport(null);
    } catch (error: any) {
      console.error('Error taking action:', error);
      showError('ดำเนินการไม่สำเร็จ', error?.response?.data?.error || 'Failed to complete action');
    } finally {
      setProcessing(false);
    }
  };

  const renderTargetInfo = (targetDetails: any, targetType: string) => {
    if (!targetDetails) return <span className="text-[#858B89] italic">Content has been deleted or is unavailable</span>;

    switch (targetType) {
      case 'group':
        return (
          <div>
            <p className="font-bold text-sm text-[#202124]">{targetDetails.name || 'Unnamed Group'}</p>
            <p className="text-xs text-[#858B89]">{targetDetails.members?.length || 0} members</p>
          </div>
        );
      case 'activity':
        return (
          <div>
            <p className="font-bold text-sm text-[#202124]">{targetDetails.title || 'Untitled Activity'}</p>
            <p className="text-xs text-[#858B89]">Category: {targetDetails.category || 'General'}</p>
          </div>
        );
      case 'user':
        return (
          <div>
            <p className="font-bold text-sm text-[#202124]">{targetDetails.username || targetDetails.email}</p>
            <p className="text-xs text-[#858B89]">Role: {targetDetails.role}</p>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending
          </span>
        );
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F3F1] text-[#11665C] border border-[#BFE7E2] uppercase tracking-wider">
            Reviewing
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5D5] text-[#4D5810] border border-[#D9F36A] uppercase tracking-wider">
            Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F3F5F4] text-[#858B89] border border-[#E8EBE9] uppercase tracking-wider">
            Dismissed
          </span>
        );
      default:
        return <span className="text-xs text-[#858B89]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#E8EBE9] p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight">
            Moderation & Content Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#858B89] mt-1">
            Review community incident reports, enforce platform guidelines, and resolve reported targets.
          </p>
        </div>
        <button 
          onClick={() => fetchReports(true)}
          disabled={refreshing}
          className="btn-secondary text-xs px-3.5 py-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#147D70] ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Queue'}</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="card p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#858B89] uppercase tracking-wider block mb-1">
              Status Filter
            </label>
            <select
              className="px-3 py-1.5 rounded-xl border border-[#E8EBE9] text-xs font-semibold text-[#202124] bg-white focus:border-[#147D70] outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="reviewing">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#858B89] uppercase tracking-wider block mb-1">
              Target Type
            </label>
            <select
              className="px-3 py-1.5 rounded-xl border border-[#E8EBE9] text-xs font-semibold text-[#202124] bg-white focus:border-[#147D70] outline-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="activity">Activities</option>
              <option value="group">Groups</option>
              <option value="user">Users</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-[#858B89]">
          Showing <strong className="text-[#202124]">{reports.length}</strong> reports
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#147D70] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-[#858B89]">Loading moderation reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="card p-12 text-center text-[#858B89] space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-[#147D70] opacity-80" />
            <p className="font-bold text-base text-[#202124]">Moderation Queue Clear</p>
            <p className="text-xs text-[#858B89]">No reports match your current filtering criteria.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div 
              key={report._id} 
              onClick={() => fetchReportDetails(report._id)}
              className="card p-5 cursor-pointer hover:border-[#147D70] hover:shadow-md transition-all group"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(report.status)}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3F5F4] text-[#202124] border border-[#E8EBE9]">
                      Target: {report.targetType}
                    </span>
                    <span className="text-xs font-semibold text-[#147D70]">
                      {REASON_LABELS[report.reason] || report.reason}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#202124] line-clamp-2">
                    {report.details}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-[#858B89]">
                    <span>Reported by <strong className="text-[#5F6664]">{report.reportedBy?.username || report.reportedBy?.email || 'Anonymous'}</strong></span>
                    <span>•</span>
                    <span>{new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#147D70] group-hover:translate-x-1 transition-transform self-end sm:self-center">
                  <span>Inspect Report</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/50 backdrop-blur-sm"
          onClick={() => setSelectedReport(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8EBE9] shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#202124] text-white px-6 py-5 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#D9F36A]" />
                  Report Case Details
                </h3>
                <p className="text-xs text-[#858B89]">ID: {selectedReport.report._id}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Status Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8EBE9]">
                <div>
                  <span className="text-[11px] font-semibold text-[#858B89] uppercase tracking-wider block">Current Status</span>
                  <div className="mt-1">{getStatusBadge(selectedReport.report.status)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-[#858B89] uppercase tracking-wider block">Submitted</span>
                  <span className="text-xs font-medium text-[#202124]">
                    {new Date(selectedReport.report.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Target Details Box */}
              <div>
                <label className="label">Reported Subject ({selectedReport.report.targetType})</label>
                <div className="p-4 bg-[#F3F5F4] rounded-xl border border-[#E8EBE9]">
                  {renderTargetInfo(selectedReport.targetDetails, selectedReport.report.targetType)}
                </div>
              </div>

              {/* Reason & Details */}
              <div className="space-y-3">
                <div>
                  <label className="label">Violation Reason</label>
                  <p className="text-sm font-bold text-red-600">
                    {REASON_LABELS[selectedReport.report.reason] || selectedReport.report.reason}
                  </p>
                </div>

                <div>
                  <label className="label">User Explanation</label>
                  <p className="p-4 bg-[#F3F5F4] rounded-xl border border-[#E8EBE9] text-xs text-[#202124] leading-relaxed">
                    {selectedReport.report.details}
                  </p>
                </div>
              </div>

              {/* Reported By */}
              <div>
                <label className="label">Complainant Information</label>
                <p className="text-xs font-semibold text-[#202124]">
                  {selectedReport.report.reportedBy?.username || selectedReport.report.reportedBy?.email || 'Unknown User'}
                </p>
              </div>

              {/* Admin Notes */}
              {selectedReport.report.adminNotes && (
                <div>
                  <label className="label">Previous Moderator Notes</label>
                  <p className="p-3 bg-[#EAF5D5] border border-[#D9F36A] rounded-xl text-xs text-[#11665C]">
                    {selectedReport.report.adminNotes}
                  </p>
                </div>
              )}

              {/* Action Buttons Matrix */}
              <div className="pt-4 border-t border-[#E8EBE9] space-y-3">
                <span className="label">Moderation Actions</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => updateReportStatus(selectedReport.report._id, 'reviewing')}
                    disabled={processing}
                    className="btn-secondary text-xs"
                  >
                    Mark as Under Review
                  </button>
                  <button
                    onClick={() => setActionModal({ show: true, action: 'warn' })}
                    disabled={processing}
                    className="btn-secondary text-xs"
                  >
                    Send Official Warning
                  </button>
                  <button
                    onClick={() => setActionModal({ show: true, action: 'delete' })}
                    disabled={processing}
                    className="py-2 px-3 text-xs font-semibold rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    Delete Reported Content
                  </button>
                  <button
                    onClick={() => setActionModal({ show: true, action: 'block_user' })}
                    disabled={processing}
                    className="py-2 px-3 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Suspend / Block User
                  </button>
                  <button
                    onClick={() => setActionModal({ show: true, action: 'dismiss' })}
                    disabled={processing}
                    className="btn-secondary col-span-2 text-xs"
                  >
                    Dismiss Report (No Violation)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionModal.show && selectedReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#202124]/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#E8EBE9] animate-fade-in space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-[#202124]">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Confirm Action: {actionModal.action}</span>
            </div>
            
            <div>
              <label className="label">Reason / Administrative Record (Optional)</label>
              <textarea
                className="input min-h-[80px] text-xs resize-none"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Log the reason for this moderation enforcement..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setActionModal({ show: false, action: '' });
                  setActionReason('');
                }}
                className="btn-secondary flex-1 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => takeAction(selectedReport.report._id, actionModal.action)}
                disabled={processing}
                className="btn-primary flex-1 text-xs"
              >
                {processing ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
