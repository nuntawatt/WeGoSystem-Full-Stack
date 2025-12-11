import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { showSuccess, showError } from '../lib/swal';
import { Edit3 } from 'lucide-react';

const BIO_MAX = 240;
const AVATAR_MAX_MB = 5;

async function compressImage(file: File, maxSide = 512, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: true })!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b as Blob), 'image/jpeg', quality)
  );
  return blob;
}

export default function Profile() {
  const { user } = useAuth();
  const { data, isLoading, updateProfile } = useProfile();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const bioRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load initial data
  useEffect(() => {
    if (data || user) {
      const emailPrefix = user?.email?.split('@')[0] || '';
      setName(data?.name || emailPrefix);
      setBio(data?.bio || '');
      setAvatar(data?.avatar || '');
    }
  }, [data, user]);

  // Cleanup blob URLs when component unmounts or avatar changes
  useEffect(() => {
    return () => {
      if (avatar && avatar.startsWith('blob:')) {
        URL.revokeObjectURL(avatar);
      }
    };
  }, [avatar]);

  const openFilePicker = () => fileInputRef.current?.click();

  const _apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '');

  const onSelectFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('ไฟล์ไม่ถูกต้อง', 'Please select an image file');
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > AVATAR_MAX_MB) {
      showError('ไฟล์ใหญ่เกินไป', `File too large (max ${AVATAR_MAX_MB} MB)`);
      return;
    }

    let blob: Blob;
    try {
      blob = await compressImage(file, 512, 0.82);
    } catch {
      blob = file;
    }

    let localUrl: string | null = null;
    try {
      // Cleanup previous URL if exists
      if (avatar && avatar.startsWith('blob:')) {
        URL.revokeObjectURL(avatar);
      }
      
      localUrl = URL.createObjectURL(blob);
      setAvatar(localUrl);
      setUploading(true);
      setProgress(0);

      // Create form data to send to server
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

  const response = await fetch(`${_apiBase}/api/profiles/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      
      // Set avatar to server URL first, then revoke local blob after DOM updates
      await updateProfile({ name, bio, avatar: data.avatarUrl });
      setAvatar(data.avatarUrl);
      setUploading(false);
      setProgress(100);
      showSuccess('รูปโปรไฟล์อัปเดตสำเร็จ!', 'รูปภาพของคุณถูกเปลี่ยนแล้ว');

      // Revoke local preview blob after a short delay so the DOM updates to the server URL
      if (localUrl) {
        const urlToRevoke: string = localUrl;
        setTimeout(() => {
          try {
            URL.revokeObjectURL(urlToRevoke);
          } catch (err) {
            // ignore
          }
        }, 300);
      }
    } catch (error: any) {
      // Cleanup blob URL on error
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
      setAvatar('');
      setUploading(false);
      setProgress(0);
      console.error('Upload error:', error);
      showError('อัปโหลดไม่สำเร็จ', 'Failed to upload image. Please try again.');
    }
  };

  const removeAvatar = async () => {
    try {
      // Cleanup blob URL if exists
      if (avatar && avatar.startsWith('blob:')) {
        URL.revokeObjectURL(avatar);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

  const response = await fetch(`${_apiBase}/api/profiles/avatar`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete avatar');
      }

      setAvatar('');
      await updateProfile({ name, bio, avatar: '' });
      showSuccess('ลบรูปโปรไฟล์สำเร็จ!', 'รูปโปรไฟล์ถูกลบแล้ว');
    } catch (error) {
      console.error('Remove avatar error:', error);
      showError('ลบไม่สำเร็จ', 'Failed to remove picture');
    }
  };

  const save = async () => {
    try {
      if (bio.length > BIO_MAX) {
        showError('ข้อมูลไม่ถูกต้อง', `Bio exceeds ${BIO_MAX} characters`);
        return;
      }
      await updateProfile({ name, bio, avatar });
      showSuccess('โปรไฟล์อัปเดตสำเร็จ! ✨', 'ข้อมูลของคุณถูกบันทึกแล้ว');
      setIsEditingName(false);
      setIsEditingBio(false);
    } catch (error) {
      console.error('Update profile error:', error);
      showError('อัปเดตไม่สำเร็จ', 'Failed to update profile');
    }
  };

  if (!user) {
    return (
      <section className="container-app py-8 bg-slate-50 dark:bg-slate-900">
        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-center">
          <p className="text-slate-500 dark:text-slate-400">Please sign in to view profile.</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="container-app py-8 bg-slate-50 dark:bg-slate-900">
        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-center">
          <p className="text-slate-500 dark:text-slate-400">Loading…</p>
        </div>
      </section>
    );
  }

  const firstChar = (name || user.email || '?').charAt(0).toUpperCase();

  return (
    <section className="min-h-screen py-8 bg-slate-50 dark:bg-slate-900">
      <div className="container-app">
        {/* Professional Header */}
        <header className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-slate-800 dark:text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Profile <span className="italic">Settings</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Manage your account information and preferences</p>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[320px,minmax(0,640px)] items-start justify-center">
        {/* Profile Picture Card */}
        <aside className="p-6 space-y-5 self-start bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm">
            <h3 className="text-lg font-medium text-slate-800 dark:text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Profile Picture
            </h3>
            
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0">
                {avatar ? (
                  <>
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                    />
                  </>
                ) : (
                  <div className="grid h-24 w-24 place-items-center rounded-full text-2xl font-medium text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 ring-2 ring-slate-200 dark:ring-slate-700">
                    {firstChar}
                  </div>
                )}
                {uploading && (
                  <div className="absolute -bottom-2 left-1/2 w-24 -translate-x-1/2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300 bg-teal-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={openFilePicker}
                  className="rounded-sm px-5 py-2.5 text-sm font-medium text-white bg-slate-800 dark:bg-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors duration-200 disabled:opacity-60"
                  disabled={uploading}
                >
                  {uploading ? 'กำลังอัปโหลด…' : 'Upload'}
                </button>
                {avatar && (
                  <button
                    onClick={removeAvatar}
                    className="rounded-sm px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    Remove
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">แนะนำไม่เกิน {AVATAR_MAX_MB}MB</p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Your account
              </div>
              <div className="space-y-2">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {name}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-500">
                  {user.email}
                </div>
              </div>
            </div>
        </aside>

        {/* Main Details Card */}
        <main className="p-8 space-y-6 self-start w-full max-w-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm">
            <h3 className="text-xl font-medium text-slate-800 dark:text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Your Information
            </h3>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="name">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <input
                  id="name"
                  ref={usernameRef}
                  className={`w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none pr-14 ${isEditingName ? 'border-teal-500 dark:border-teal-400' : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={!isEditingName}
                />
                <button
                  type="button"
                  aria-label="Edit name"
                  aria-pressed={isEditingName}
                  onClick={() => {
                    setIsEditingName((v: boolean) => !v);
                    setTimeout(() => usernameRef.current?.focus(), 0);
                  }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 rounded p-2 transition-colors duration-200 ${isEditingName ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                อีเมล
              </label>
              <input 
                id="email" 
                className="w-full px-4 py-3 rounded-sm text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                value={user?.email || ''} 
                readOnly 
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="bio">
                เกี่ยวกับคุณ
              </label>
              <div className="relative">
                <textarea
                  id="bio"
                  ref={bioRef}
                  className={`w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none resize-none h-32 pr-14 ${isEditingBio ? 'border-teal-500 dark:border-teal-400' : ''}`}
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                  readOnly={!isEditingBio}
                  placeholder="บอกอะไรเกี่ยวกับตัวคุณสักหน่อย..."
                />
                <button
                  type="button"
                  aria-label="Edit bio"
                  aria-pressed={isEditingBio}
                  onClick={() => {
                    setIsEditingBio((v: boolean) => !v);
                    setTimeout(() => bioRef.current?.focus(), 0);
                  }}
                  className={`absolute right-3 top-3 rounded p-2 transition-colors duration-200 ${isEditingBio ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
              <div className="text-right text-xs text-slate-400 dark:text-slate-500">{bio.length}/{BIO_MAX} ตัวอักษร</div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <button 
                className="px-8 py-3 text-sm font-medium text-white bg-slate-800 dark:bg-white dark:text-slate-900 rounded-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors duration-200 disabled:opacity-60" 
                onClick={save} 
                disabled={uploading}
              >
                Confirm changes
              </button>
            </div>
        </main>
        </div>
      </div>
    </section>
  );
}