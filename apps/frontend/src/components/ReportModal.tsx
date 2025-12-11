import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { toast } from './Toasts';
import { useAuth } from '../hooks/useAuth';

type ReportReason =
  | 'spam'
  | 'inappropriate_content'
  | 'harassment'
  | 'false_information'
  | 'scam'
  | 'other';

const REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  inappropriate_content: 'Inappropriate',
  harassment: 'Harassment / Abuse',
  false_information: 'False information',
  scam: 'Scam',
  other: 'Other'
};

const MAX_CHARS = 240;
const countWords = (text: string) => (text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length);

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
          console.debug('[ReportModal] found activity by direct id', activity?._id);
        } catch (err: any) {
          console.debug('[ReportModal] direct activity fetch failed:', (err?.message || err));
        }

        if (!activity) {
          try {
            const res2 = await api.get(`/activities/by-chat/${targetId}`);
            activity = res2.data?.activity || res2.data;
            console.debug('[ReportModal] found activity by /by-chat', activity?._id);
          } catch (err: any) {
            console.debug('[ReportModal] /by-chat fetch failed:', (err?.message || err));
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
              console.debug('[ReportModal] found activity from chat.groupInfo.relatedActivity', activity?._id);
            }
          } catch (err: any) {
            console.debug('[ReportModal] chat->relatedActivity fetch failed:', (err?.message || err));
          }
        }

        if (!activity) {
          try {
            const acts = await api.get('/activities');
            const activities = acts.data?.activities || acts.data || [];
            const matched = Array.isArray(activities) ? activities.find((a: any) => String(a?.chat?._id || a?.chat) === String(targetId)) : null;
            if (matched) {
              activity = matched;
              console.debug('[ReportModal] found activity by scanning /activities', activity?._id);
            }
          } catch (err: any) {
            console.debug('[ReportModal] activities scan failed:', (err?.message || err));
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
          console.debug('[ReportModal] /has-reported check failed, falling back to embedded check', (e as any)?.message || e);
        }

        const reports = activity.reports || [];
        const found = Array.isArray(reports) && !!reports.find((r: any) => String((r.user?._id || r.user)) === String(user._id));
        setAlreadyReported(Boolean(found));
      } catch (e) {
        console.debug('[ReportModal] failed duplicate check', (e as any)?.message || e);
      }
    })();

    return () => { active = false; };
  }, [isOpen, targetId, targetType, user]);

  const words = countWords(details);
  const chars = details.trim().length;

  const submitReportTo = async (path: string, payload: any) => api.post(path, payload);

  const resolveAndPostActivity = async (id: string, payload: any) => {
    try {
      console.debug('[Report] trying direct activity id:', id);
      const path = `/activities/${id}/report`;
      toast(`Posting report to ${path}`, 'info');
      return await submitReportTo(path, payload);
    } catch (err: any) {
      console.debug('[Report] direct activity POST failed:', id, err?.response?.status, err?.message || err);
      const is404 = err?.response?.status === 404 || String(err?.message || '').includes('ไม่พบข้อมูล') || String(err).includes('Not Found');
      if (is404) {
        try {
          const chatRes = await api.get(`/chats/${id}`);
          const chat = chatRes.data?.chat || chatRes.data;
          const relatedActivity = chat?.groupInfo?.relatedActivity;
          if (relatedActivity) {
            const relId = typeof relatedActivity === 'string' ? relatedActivity : (relatedActivity._id || relatedActivity.toString());
            console.debug('[Report] resolved relatedActivity from chat:', relId);
            if (relId) {
              const path = `/activities/${relId}/report`;
              toast(`Posting report to ${path}`, 'info');
              return await submitReportTo(path, payload);
            }
          }
        } catch (e) {
          const _e: any = e;
          console.debug('[Report] chat resolution failed:', _e?.message || _e);
        }

        // try backend helper
        try {
          console.debug('[Report] trying helper /activities/by-chat for chatId:', id);
          const res = await api.get(`/activities/by-chat/${id}`);
          const activity = res.data?.activity || res.data;
          const aid = activity?._id || activity?.id || activity;
          console.debug('[Report] /by-chat returned activity id:', aid);
          if (aid) {
            const path = `/activities/${aid}/report`;
            toast(`Posting report to ${path}`, 'info');
            return await submitReportTo(path, payload);
          }
        } catch (e) {
          console.debug('[Report] /by-chat helper failed:', (e as any)?.message || e);
        }

        try {
          console.debug('[Report] falling back to scanning /activities for chat._id ==', id);
          const acts = await api.get('/activities');
          const activities = acts.data?.activities || acts.data || [];
          const matched = Array.isArray(activities) ? activities.find((a: any) => String(a?.chat?._id || a?.chat) === String(id)) : null;
          console.debug('[Report] scan matched activity:', matched?._id);
          if (matched && matched._id) {
            const path = `/activities/${matched._id}/report`;
            toast(`Posting report to ${path}`, 'info');
            return await submitReportTo(path, payload);
          }
        } catch (e) {
          console.debug('[Report] activities scan failed:', (e as any)?.message || e);
        }
      }
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (chars < 10) {
      toast('Please provide detailed description (at least 10 characters)');
      return;
    }
    if (chars > MAX_CHARS) {
      toast(`Please limit your report to ${MAX_CHARS} characters or fewer`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = { reason, details: details.trim() };
      console.debug('[Report] submitting payload', { payload, targetType, targetId });

      if (targetType === 'activity') {
        await resolveAndPostActivity(targetId, payload);
      } else if (targetType === 'group') {
        const path = `/groups/${targetId}/report`;
        toast(`Posting report to ${path}`, 'info');
        await submitReportTo(path, payload);
      } else {
        const path = `/users/${targetId}/report`;
        toast(`Posting report to ${path}`, 'info');
        await submitReportTo(path, payload);
      }

      toast('Report submitted. Our moderation team will review it.');
      setReason('spam');
      setDetails('');
      onClose();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      const status = error?.response?.status;
      const serverError = error?.response?.data?.error || error?.message;

      if (status === 404) {
        toast('Activity not found. It may have been deleted.');
      } else if (status === 409) {
        toast('You have already reported this activity.');
      } else if (status === 400) {
        toast(serverError || 'Invalid report. Please check your input.');
      } else {
        toast(serverError || 'Failed to submit report. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-sm shadow-xl max-w-md sm:max-w-lg md:max-w-xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Report {targetType}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-auto pb-24">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Reason</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
            >
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Details <span className="text-red-500">*</span></label>
            <textarea
              value={details}
              onChange={(e) => { if (!isComposing) setDetails(e.target.value); else setDetails(e.target.value); }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(e) => { setIsComposing(false); setDetails((e.target as HTMLTextAreaElement).value); }}
              placeholder="Describe the issue..."
              rows={5}
              className="w-full min-h-[140px] px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none"
            />
            <div className="flex justify-end text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>{chars}/{MAX_CHARS} characters</span>
            </div>
            {chars > 0 && chars < 10 && (
              <div className="text-red-500 text-xs mt-1">Please type at least 10 characters.</div>
            )}
            {chars > MAX_CHARS && (
              <div className="text-red-500 text-xs mt-1">Please limit your report to {MAX_CHARS} characters or fewer.</div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm py-4">
            <div className="flex justify-center px-4">
              <button
                type="submit"
                disabled={submitting || details.trim().length < 10 || details.trim().length > MAX_CHARS || (alreadyReported && !DEV_ALLOW_DUPLICATE)}
                className="w-full max-w-sm px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium rounded-sm transition-colors"
              >
                {submitting ? 'Submitting...' : (alreadyReported && !DEV_ALLOW_DUPLICATE) ? 'Already Reported' : 'Submit Report'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
