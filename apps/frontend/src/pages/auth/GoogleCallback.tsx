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
          await showSuccess('Google Sign-in สำเร็จ', 'ยินดีต้อนรับเข้าสู่ WegoSystem');
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
    <section className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-12 px-4 bg-[#F3F5F4]">
      <div className="card p-8 max-w-md w-full text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#147D70] border-t-transparent rounded-full animate-spin mx-auto" />
        <div>
          <div className="text-base font-bold text-[#202124]">Authenticating via Google…</div>
          <div className="text-xs text-[#858B89] mt-0.5">Finalizing your secure session</div>
        </div>
      </div>
    </section>
  );
}
