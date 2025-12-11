import { useEffect, useRef } from 'react';
import { api } from '../lib/apiClient';

export default function GoogleSignIn() {
  const btnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set');
      return;
    }

    const existing = document.getElementById('google-identity-script');
    const initGoogle = () => {
      // @ts-ignore
      if (!window.google || !window.google.accounts || !window.google.accounts.id) return;

      // initialize the Google Identity Services
      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: any) => {
          try {
            const idToken = resp?.credential;
            if (!idToken) throw new Error('Missing Google credential');

            const result = await api.post('/auth/google-login', { idToken });
            const token = result.data?.token;
            if (token) {
              localStorage.setItem('token', token);
              window.location.href = '/explore';
            }
          } catch (err) {
            console.error('Google sign-in error', err);
          }
        }
      });

      // render the button into our div
      try {
        // @ts-ignore
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%'
        });
      } catch (e) {
        console.warn('Failed to render Google button', e);
      }
    };

    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.id = 'google-identity-script';
      s.async = true;
      s.defer = true;
      s.onload = initGoogle;
      document.body.appendChild(s);
    } else {
      initGoogle();
    }
  }, []);

  return (
    <div className="mt-4">
      <div ref={btnRef} />
    </div>
  );
}
