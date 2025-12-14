import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { toastSuccess } from '../../lib/swal';

function parseIdTokenFromHash(hash: string) {
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  return params.get('id_token');
}

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const idToken = parseIdTokenFromHash(window.location.hash || '');
        if (!idToken) {
          console.warn('No id_token in callback');
          navigate('/auth/signin');
          return;
        }

        const result = await api.post('/auth/google-login', { idToken });
        const token = result.data?.token;
        if (token) {
          localStorage.setItem('token', token);
          toastSuccess('Google Sign-in successful', 'Welcome to WeGo');
          setTimeout(() => navigate('/explore', { replace: true }), 200);
        } else {
          navigate('/auth/signin');
        }
      } catch (err) {
        // silent in prod; still navigates to signin
        navigate('/auth/signin');
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
