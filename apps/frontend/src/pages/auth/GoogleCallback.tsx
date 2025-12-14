import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { showError, showSuccess } from '../../lib/swal';

function parseOAuthParams() {
  const searchParams = new URLSearchParams(window.location.search || '');

  const hash = window.location.hash || '';
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

  const idToken = hashParams.get('id_token') || searchParams.get('id_token');
  const error = hashParams.get('error') || searchParams.get('error');
  const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

  return { idToken, error, errorDescription };
}

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { idToken, error, errorDescription } = parseOAuthParams();
        if (!idToken) {
          const msg = errorDescription || error || 'ไม่พบ token จาก Google (id_token)';
          await showError('Google Sign-in ไม่สำเร็จ', msg);
          navigate('/auth/signin', { replace: true });
          return;
        }

        const result = await api.post('/auth/google-login', { idToken });
        const token = result.data?.token;
        if (token) {
          localStorage.setItem('token', token);
          // NOTE: AuthProvider reads token only on initial mount.
          // Use a full reload after success so the app rehydrates auth state reliably.
          await showSuccess('Google Sign-in สำเร็จ', 'ยินดีต้อนรับเข้าสู่ WeGo');
          window.location.assign('/explore');
        } else {
          await showError('Google Sign-in ไม่สำเร็จ', 'ไม่พบ token จากระบบ');
          navigate('/auth/signin', { replace: true });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google';
        await showError('Google Sign-in ไม่สำเร็จ', message);
        navigate('/auth/signin', { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900">
      <div className="container-app py-10 md:py-14">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 border border-teal-600/20">
              <svg className="h-5 w-5 animate-spin text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900 dark:text-white">Signing you in…</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Connecting to Google</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
