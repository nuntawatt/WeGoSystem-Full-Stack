import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/apiClient';

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
          window.location.href = '/explore';
        } else {
          navigate('/auth/signin');
        }
      } catch (err) {
        console.error('Google callback error', err);
        navigate('/auth/signin');
      }
    })();
  }, [navigate]);

  return <div className="min-h-[40vh] flex items-center justify-center">Signing in with Google...</div>;
}
