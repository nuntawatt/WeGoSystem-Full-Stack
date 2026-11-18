import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { showSuccess, showError, showWarning } from '../lib/swal';
import { useAuth } from '../hooks/useAuth';
import { Flag, X, AlertTriangle, ShieldAlert } from 'lucide-react';

type ReportReason =
  | 'spam'
  | 'inappropriate_content'
  | 'harassment'
  | 'false_information'
  | 'scam'
  | 'other';

const REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam or Advertising',
  inappropriate_content: 'Inappropriate Content',
  harassment: 'Harassment or Abuse',
  false_information: 'False Information',
  scam: 'Scam or Fraud',
  other: 'Other Violation'
};

const MAX_CHARS = 240;

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId
}: {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'group' | 'activity' | 'user' | string;
  targetId: string;
}) {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const { user } = useAuth();
  const [isComposing, setIsComposing] = useState(false);
  const DEV_ALLOW_DUPLICATE = false;

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    (async () => {
      try {
        if (!user) return;

        let activity: any = null;

        try {
          const res = await api.get(`/activities/${targetId}`);
          activity = res.data?.activity || res.data;
        } catch (err: any) {
          // ignore error
        }

        if (!activity) {
          try {
            const res2 = await api.get(`/activities/by-chat/${targetId}`);
            activity = res2.data?.activity || res2.data;
          } catch (err: any) {
            // ignore error
          }
        }

        if (!activity) {
          try {
            const chatRes = await api.get(`/chats/${targetId}`);
            const chat = chatRes.data?.chat || chatRes.data;
            const related = chat?.groupInfo?.relatedActivity;
            if (related) {
              const relId = typeof related === 'string' ? related : (related._id || related.toString());
              const ares = await api.get(`/activities/${relId}`);
              activity = ares.data?.activity || ares.data;
            }
          } catch (err: any) {
            // ignore error
          }
        }

        if (!activity) {
          try {
            const acts = await api.get('/activities');
            const activities = acts.data?.activities || acts.data || [];
            const matched = Array.isArray(activities) ? activities.find((a: any) => String(a?.chat?._id || a?.chat) === String(targetId)) : null;
            if (matched) {
              activity = matched;
            }
          } catch (err: any) {
            // ignore error
          }
        }

        if (!active) return;
        if (!activity) return;

        try {
          const checkRes = await api.get(`/activities/${activity._id || activity}/has-reported`);
          if (checkRes.data && typeof checkRes.data.reported === 'boolean') {
            setAlreadyReported(Boolean(checkRes.data.reported));
            return;
          }
        } catch (e) {
          // fallback
        }

        const reports = activity.reports || [];
        const found = Array.isArray(reports) && !!reports.find((r: any) => String((r.user?._id || r.user)) === String(user._id));
        setAlreadyReported(Boolean(found));
      } catch (e) {
        console.debug('[ReportModal] failed duplicate check', e);
      }
    })();

    return () => { active = false; };
  }, [isOpen, targetId, targetType, user]);

  const chars = details.trim().length;

  const submitReportTo = async (path: string, payload: any) => api.post(path, payload);

  const resolveAndPostActivity = async (id: string, payload: any) => {
    try {
      const path = `/activities/${id}/report`;
      return await submitReportTo(path, payload);
    } catch (err: any) {
      const is404 = err?.response?.status === 404 || String(err?.message || '').includes('ไม่พบข้อมูล') || String(err).includes('Not Found');
      if (is404) {
        try {
          const chatRes = await api.get(`/chats/${id}`);
          const chat = chatRes.data?.chat || chatRes.data;
          const relatedActivity = chat?.groupInfo?.relatedActivity;
          if (relatedActivity) {
            const relId = typeof relatedActivity === 'string' ? relatedActivity : (relatedActivity._id || relatedActivity.toString());
            if (relId) {
              return await submitReportTo(`/activities/${relId}/report`, payload);
            }
          }
        } catch (e) {
          // ignore
        }

        try {
          const res = await api.get(`/activities/by-chat/${id}`);
          const activity = res.data?.activity || res.data;
          const aid = activity?._id || activity?.id || activity;
          if (aid) {
            return await submitReportTo(`/activities/${aid}/report`, payload);
          }
        } catch (e) {
          // ignore
        }

        try {
          const acts = await api.get('/activities');
          const activities = acts.data?.activities || acts.data || [];
          const matched = Array.isArray(activities) ? activities.find((a: any) => String(a?.chat?._id || a?.chat) === String(id)) : null;
          if (matched && matched._id) {
            return await submitReportTo(`/activities/${matched._id}/report`, payload);
          }
        } catch (e) {
          // ignore
        }
      }
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (chars < 10) {
      showWarning('กรุณาใส่รายละเอียด', 'Please provide a detailed description (at least 10 characters)');
      return;
    }
    if (chars > MAX_CHARS) {
      showWarning('ข้อความยาวเกินไป', `Please limit your report to ${MAX_CHARS} characters or fewer`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = { reason, details: details.trim() };

      if (targetType === 'activity') {
        await resolveAndPostActivity(targetId, payload);
      } else if (targetType === 'group') {
        await submitReportTo(`/groups/${targetId}/report`, payload);
      } else {
        await submitReportTo(`/users/${targetId}/report`, payload);
      }

      showSuccess('ส่งรายงานสำเร็จ!', 'Report submitted. Our moderation team will review it.');
      setReason('spam');
      setDetails('');
      onClose();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      const status = error?.response?.status;
      const serverError = error?.response?.data?.error || error?.message;

      if (status === 404) {
        showError('ไม่พบข้อมูล', 'Resource not found. It may have been removed.');
      } else if (status === 409) {
        showWarning('รายงานแล้ว', 'You have already reported this item.');
      } else if (status === 400) {
        showError('รายงานไม่ถูกต้อง', serverError || 'Invalid report. Please check your input.');
      } else {
        showError('ส่งรายงานไม่สำเร็จ', serverError || 'Failed to submit report. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-[#E8EBE9] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8EBE9]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#202124]">Report {targetType}</h3>
              <p className="text-xs text-[#858B89]">Help keep the WegoSystem community safe and respectful.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#858B89] hover:text-[#202124] hover:bg-[#F3F5F4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {alreadyReported && !DEV_ALLOW_DUPLICATE && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>You have already submitted a report for this {targetType}.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#858B89] mb-2">
              Reason for report
            </label>
            <select
              className="w-full px-4 py-3 bg-[#F3F5F4] border border-[#E8EBE9] rounded-xl text-[#202124] text-sm focus:ring-2 focus:ring-[#147D70] focus:border-transparent focus:outline-none transition-all"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
            >
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#858B89]">
                Details <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${chars > MAX_CHARS ? 'text-red-500 font-semibold' : 'text-[#858B89]'}`}>
                {chars}/{MAX_CHARS}
              </span>
            </div>
            <textarea
              value={details}
              onChange={(e) => { if (!isComposing) setDetails(e.target.value); else setDetails(e.target.value); }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(e) => { setIsComposing(false); setDetails((e.target as HTMLTextAreaElement).value); }}
              placeholder="Please provide details about this issue so our moderation team can review it accurately..."
              rows={4}
              className="w-full px-4 py-3 bg-[#F3F5F4] border border-[#E8EBE9] rounded-xl text-[#202124] placeholder-[#858B89]/60 text-sm resize-none focus:ring-2 focus:ring-[#147D70] focus:border-transparent focus:outline-none transition-all"
            />
            {chars > 0 && chars < 10 && (
              <p className="text-red-500 text-xs mt-1.5">Please type at least 10 characters.</p>
            )}
            {chars > MAX_CHARS && (
              <p className="text-red-500 text-xs mt-1.5">Please limit your report to {MAX_CHARS} characters.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8EBE9]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#E8EBE9] bg-white text-sm font-semibold text-[#858B89] hover:text-[#202124] hover:bg-[#F3F5F4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || details.trim().length < 10 || details.trim().length > MAX_CHARS || (alreadyReported && !DEV_ALLOW_DUPLICATE)}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
            >
              <Flag className="w-4 h-4" />
              {submitting ? 'Submitting...' : (alreadyReported && !DEV_ALLOW_DUPLICATE) ? 'Already Reported' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
