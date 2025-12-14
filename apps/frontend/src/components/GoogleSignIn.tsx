import React from 'react';

export default function GoogleSignIn() {
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';
  const redirect = (import.meta.env.VITE_GOOGLE_CALLBACK_URL as string) || window.location.origin + '/auth/google/callback';

  const handleRedirect = () => {
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set');
      return;
    }

    const scope = encodeURIComponent('openid email profile');
    const nonce = String(Math.random()).slice(2);
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&response_type=id_token&scope=${scope}&redirect_uri=${encodeURIComponent(redirect)}&nonce=${nonce}&prompt=select_account`;

    // redirect user to Google to pick account every time
    window.location.href = url;
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleRedirect}
        className="w-full inline-flex items-center justify-center gap-3 py-2.5 px-4 rounded-md border bg-white text-sm shadow-sm hover:shadow-md transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.4H272v95.4h147.1c-6.4 34.6-25.6 63.9-54.7 83.6v69.5h88.4c51.7-47.6 81.7-118 81.7-198.1z" fill="#4285f4"/>
          <path d="M272 544.3c73.7 0 135.6-24.5 180.8-66.9l-88.4-69.5c-25 17-57 27-92.4 27-71 0-131.1-47.9-152.6-112.3H27.5v70.9C72.5 486.4 166.5 544.3 272 544.3z" fill="#34a853"/>
          <path d="M119.4 323.7c-10.6-31.1-10.6-64.8 0-95.9V156.9H27.5c-39.9 79.7-39.9 174.6 0 254.3l91.9-87.5z" fill="#fbbc04"/>
          <path d="M272 107.7c39.8 0 75.5 13.7 103.7 40.6l77.8-77.8C408 24.8 346.1 0 272 0 166.5 0 72.5 57.9 27.5 156.9l91.9 70.9C140.9 155.6 201 107.7 272 107.7z" fill="#ea4335"/>
        </svg>
        Sign in with Google
      </button>
    </div>
  );
}
