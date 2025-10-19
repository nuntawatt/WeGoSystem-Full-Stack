import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { toast } from './Toasts';

type Review = {
  _id: string;
  userId: {
    _id: string;
    email: string;
    username?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

type ReviewsData = {
  reviews: Review[];
  averageRating: string;
  totalReviews: number;
};

export default function GroupReviews({ groupId, currentUserId, type = 'group' }: { groupId: string; currentUserId?: string; type?: 'group' | 'activity' }) {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [resolvedType, setResolvedType] = useState<'group' | 'activity' | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const triedFallbackRef = useRef(false);

  const fetchReviews = async (overrideType?: 'group' | 'activity', overrideId?: string) => {
    const useType = overrideType || resolvedType || type;
    const useId = overrideId || resolvedId || groupId;
    const normalizeAndSet = (d: any) => {
      if (d && Array.isArray(d.reviews)) {
        const normalized = d.reviews.map((r: any) => ({
          _id: r._id || r.id || `${r.user?._id || r.user || r.userId?._id || Math.random()}`,
          userId: r.userId || r.user || { _id: r.user?._id || r.userId?._id, email: r.user?.email || r.userId?.email, username: r.user?.username || r.userId?.username },
          rating: r.rating,
          comment: r.comment || r.review || '',
          createdAt: r.createdAt || new Date().toISOString(),
          updatedAt: r.updatedAt || new Date().toISOString()
        }));
        setReviewsData({ reviews: normalized, averageRating: d.averageRating, totalReviews: d.totalReviews });
      } else {
        setReviewsData(d);
      }
    };

    try {
      setLoading(true);
      const endpoint = useType === 'group' ? `/groups/${useId}/reviews` : `/activities/${useId}/reviews`;
      const response = await api.get(endpoint);
      const data = response.data;
      normalizeAndSet(data);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      const msg = error?.response?.data?.error || 'Failed to load reviews';
      // If 404, show inline message instead of toast
      if (error?.response?.status === 404) {
        // If group endpoint not found, maybe groupId is actually a chatId (DirectChat passes uid)
        if (useType === 'group') {
          try {
            const chatRes = await api.get(`/chats/${groupId}`);
            const chat = chatRes.data.chat || chatRes.data;
            const relatedActivity = chat?.groupInfo?.relatedActivity;
            if (relatedActivity) {
              const resp2 = await api.get(`/activities/${relatedActivity}/reviews`);
              normalizeAndSet(resp2.data);
              return;
            }
            // If chat has no relatedActivity, try scanning activities for a matching chat id
            console.warn('fetchReviews fallback: chat has no relatedActivity, searching activities by chat id');
            try {
              const actsRes = await api.get('/activities');
              const activities = actsRes.data.activities || actsRes.data;
              const matched = Array.isArray(activities)
                ? activities.find((a: any) => {
                    const cid = a?.chat?._id || a?.chat;
                    return String(cid) === String(groupId);
                  })
                : null;
              if (matched && matched._id) {
                const resp3 = await api.get(`/activities/${matched._id}/reviews`);
                normalizeAndSet(resp3.data);
                return;
              }
            } catch (actsErr) {
              console.warn('fetchReviews activity list lookup failed:', actsErr);
            }
          } catch (innerErr) {
            console.warn('Fallback chat lookup failed:', innerErr);
          }
        }

        setReviewsData({ reviews: [], averageRating: '0.0', totalReviews: 0 });
        toast(`❌ ${msg}`);
      } else {
        toast(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      // resolve actual target (group vs activity) before fetching/submitting
      (async function resolveTarget() {
        let chatFound = false;
        try {
          // try chat first (DirectChat passes chat id commonly) to avoid 404 on groups
          const chatRes = await api.get(`/chats/${groupId}`);
          chatFound = true;
          const chat = chatRes.data.chat || chatRes.data;
          const relatedActivity = chat?.groupInfo?.relatedActivity;
            if (relatedActivity) {
              setResolvedType('activity');
              setResolvedId(relatedActivity);
              await fetchReviews('activity', relatedActivity);
              return;
            }
          // if chat exists but no relatedActivity, try scanning activities by chat id (do NOT call groups)
          try {
            const actsRes = await api.get('/activities');
            const activities = actsRes.data.activities || actsRes.data;
            const matched = Array.isArray(activities)
              ? activities.find((a: any) => {
                  const cid = a?.chat?._id || a?.chat;
                  return String(cid) === String(groupId);
                })
              : null;
            if (matched && matched._id) {
              setResolvedType('activity');
              setResolvedId(matched._id);
              await fetchReviews('activity', matched._id);
              return;
            }
          } catch (actsErr) {
            console.warn('fetchReviews activity list lookup during resolve failed:', actsErr);
          }
        } catch (e) {
          // not a chat, continue to check groups
        }

        // Only try groups if chat was not found
        if (!chatFound) {
          try {
            const gRes = await api.get(`/groups/${groupId}`);
            if (gRes?.data) {
              setResolvedType('group');
              setResolvedId(groupId);
              await fetchReviews('group', groupId);
              return;
            }
          } catch (e) {
            // not a group, continue
          }
        }

        try {
          // final fallback: search activities by chat id
          const actsRes = await api.get('/activities');
          const activities = actsRes.data.activities || actsRes.data;
          const matched = Array.isArray(activities)
            ? activities.find((a: any) => {
                const cid = a?.chat?._id || a?.chat;
                return String(cid) === String(groupId);
              })
            : null;
          if (matched && matched._id) {
            setResolvedType('activity');
            setResolvedId(matched._id);
            fetchReviews();
            return;
          }
        } catch (e) {
          // give up
        }

        // default: treat as group but will likely 404 on server
        setResolvedType('group');
        setResolvedId(groupId);
        fetchReviews();
      })();
    }
  }, [groupId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating || rating < 1 || rating > 5) {
      toast('Please select a rating between 1 and 5');
      return;
    }

    try {
      setSubmitting(true);
      // prefer resolved target when available to avoid 404s
      const useType = resolvedType || type;
      const useId = resolvedId || groupId;
      const endpoint = useType === 'group' ? `/groups/${useId}/reviews` : `/activities/${useId}/reviews`;
      console.log('Submitting review to:', endpoint);
      await api.post(endpoint, {
        rating,
        comment: comment.trim()
      });
      
      toast('✨ Review submitted successfully!');
      setShowReviewForm(false);
      setRating(5);
      setComment('');
      fetchReviews(); // Refresh reviews
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to submit review';
      toast(`❌ ${errorMsg}`);

      // Fallback: for group type, always try to resolve chat -> relatedActivity and post there once
      if (type === 'group') {
        try {
          // prevent retry loops
          if ((triedFallbackRef as any).current) {
            console.warn('Already attempted fallback, aborting.');
          } else {
            (triedFallbackRef as any).current = true;
            console.log('Attempting fallback: fetch chat for relatedActivity');
            const chatRes = await api.get(`/chats/${groupId}`);
            const chat = chatRes.data.chat || chatRes.data;
            const relatedActivity = chat?.groupInfo?.relatedActivity;
            if (relatedActivity) {
              console.log('Posting review to activity fallback:', relatedActivity);
              await api.post(`/activities/${relatedActivity}/reviews`, { rating, comment: comment.trim() });
              toast('✨ Review submitted successfully (activity fallback)');
              setShowReviewForm(false);
              setRating(5);
              setComment('');
              fetchReviews();
              return;
            } else {
              console.warn('Fallback: chat has no relatedActivity — searching activities for matching chat id');
              // Try alternate fallback: fetch activities and find one whose chat._id matches this chat id
              try {
                const actsRes = await api.get('/activities');
                const activities = actsRes.data.activities || actsRes.data;
                const matched = Array.isArray(activities)
                  ? activities.find((a: any) => {
                      const cid = a?.chat?._id || a?.chat;
                      return String(cid) === String(groupId);
                    })
                  : null;
                if (matched && matched._id) {
                  console.log('Found activity by chat lookup:', matched._id);
                  console.log('Posting review to activity-by-chat fallback:', `/activities/${matched._id}/reviews`, { rating, comment: comment.trim() });
                  const postRes = await api.post(`/activities/${matched._id}/reviews`, { rating, comment: comment.trim() });
                  console.log('Activity fallback post response:', postRes);
                  toast('✨ Review submitted successfully (activity-by-chat fallback)');
                  setShowReviewForm(false);
                  setRating(5);
                  setComment('');
                  fetchReviews();
                  return;
                } else {
                  console.warn('No activity found with matching chat id');
                  toast('💡 This chat is not linked to an activity. Cannot fallback.');
                }
              } catch (actsErr) {
                console.warn('Activity list lookup failed during fallback:', actsErr);
                const ae = actsErr as any;
                const aMsg = ae?.response?.data?.error || ae?.message;
                if (aMsg) toast(`❌ ${aMsg}`);
              }
            }
          }
        } catch (innerErr) {
          console.warn('Fallback submit failed:', innerErr);
          // show inner error if available (cast to any for safety)
          const ie = innerErr as any;
          const innerMsg = ie?.response?.data?.error || ie?.message;
          if (innerMsg) toast(`❌ ${innerMsg}`);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive: boolean = false, onSelect?: (n: number) => void) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onSelect && onSelect(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-125 active:scale-110' : ''} transition-transform duration-150`}
          >
            <svg
              className={`w-4 h-4 ${
                star <= count ? 'text-amber-400 fill-amber-400' : 'text-slate-600 fill-slate-600'
              } ${interactive ? 'drop-shadow-sm' : ''}`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const userHasReviewed = reviewsData?.reviews.some(r => r.userId._id === currentUserId);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-3 bg-white/10 rounded w-1/3"></div>
        <div className="h-12 bg-white/10 rounded"></div>
        <div className="h-12 bg-white/10 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact Header with Average Rating */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {reviewsData && reviewsData.totalReviews > 0 ? (
            <>
              <div className="flex items-center gap-1">
                {renderStars(Math.round(parseFloat(reviewsData.averageRating)))}
              </div>
              <span className="text-sm font-medium text-slate-300">
                {reviewsData.averageRating}
              </span>
              <span className="text-xs text-slate-500">
                ({reviewsData.totalReviews} {reviewsData.totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-400">No reviews yet</span>
          )}
        </div>
        
        {currentUserId && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-3 py-1.5 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {userHasReviewed ? '✏️ Edit' : '✨ Write'}
          </button>
        )}
      </div>

      {/* Compact Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="p-3 bg-white/5 rounded-lg border border-amber-500/20 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-400">Your Rating</label>
            <div className="flex gap-1">
              {renderStars(rating, true, setRating)}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-400">Comment (Optional)</label>
            <textarea
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-colors resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-slate-500 mt-1">{comment.length}/500</div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-3 py-1.5 text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white rounded-lg transition-colors"
            >
              {submitting ? '⏳ Submitting...' : '✅ Submit'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReviewForm(false);
                setRating(5);
                setComment('');
              }}
              className="px-4 py-1.5 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            >
              ✖️
            </button>
          </div>
        </form>
      )}

      {/* Compact Reviews List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {reviewsData && reviewsData.reviews.length > 0 ? (
          reviewsData.reviews.map((review) => (
            <div key={review._id} className="p-3 bg-white/5 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">
                    {review.userId.username || review.userId.email.split('@')[0]}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{review.comment}</p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-500">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-xs">No reviews yet ✨</p>
            <p className="text-xs mt-0.5">Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  );
}
