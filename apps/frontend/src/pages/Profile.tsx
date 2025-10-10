import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/Toasts';
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

  const onSelectFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file');
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > AVATAR_MAX_MB) {
      toast(`File too large (max ${AVATAR_MAX_MB} MB)`);
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

      const response = await fetch('http://localhost:5000/api/profiles/avatar', {
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
      
      // Cleanup blob URL after successful upload
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
      
      await updateProfile({ name, bio, avatar: data.avatarUrl });
      setAvatar(data.avatarUrl);
      setUploading(false);
      setProgress(100);
      toast('Profile picture updated');
    } catch (error: any) {
      // Cleanup blob URL on error
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
      setAvatar('');
      setUploading(false);
      setProgress(0);
      console.error('Upload error:', error);
      toast('Failed to upload image. Please try again.');
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

      const response = await fetch('http://localhost:5000/api/profiles/avatar', {
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
      toast('Profile picture removed');
    } catch (error) {
      console.error('Remove avatar error:', error);
      toast('Failed to remove picture');
    }
  };

  const save = async () => {
    try {
      if (bio.length > BIO_MAX) {
        toast(`Bio exceeds ${BIO_MAX} characters`);
        return;
      }
      await updateProfile({ name, bio, avatar });
      toast('Profile updated');
      setIsEditingName(false);
      setIsEditingBio(false);
    } catch (error) {
      console.error('Update profile error:', error);
      toast('Failed to update profile');
    }
  };

  if (!user) {
    return (
      <section className="container-app py-8">
        <div className="card p-4">Please sign in to view profile.</div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="container-app py-8">
        <div className="card p-4">Loading…</div>
      </section>
    );
  }

  const firstChar = (name || user.email || '?').charAt(0).toUpperCase();

  return (
    <section className="container-app py-10">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Profile</h2>
        <p className="opacity-60 text-sm">Update your public profile and preferences</p>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[320px,minmax(0,640px)] items-start">
        <aside className="card p-4 space-y-4 self-start">
          <h3 className="text-lg font-semibold">Profile Picture</h3>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-white/20"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-full bg-white/10 text-2xl font-semibold ring-2 ring-white/20">
                  {firstChar}
                </div>
              )}
              {uploading && (
                <div className="absolute -bottom-2 left-1/2 w-24 -translate-x-1/2 rounded-full bg-white/10">
                  <div
                    className="h-1 rounded-full bg-gradient-to-r from-amber-400 to-pink-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={openFilePicker}
                className="rounded-full px-4 py-2 font-semibold text-white shadow-lg shadow-amber-500/10 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 transition disabled:opacity-60"
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Upload Picture'}
              </button>
              {avatar && (
                <button
                  onClick={removeAvatar}
                  className="rounded-full px-4 py-2 font-semibold border border-white/15 bg-white/5 hover:bg-white/10"
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
              <p className="text-xs text-white/60">Recommended {AVATAR_MAX_MB}MB</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="text-base font-medium">Account</div>
            <div className="text-sm opacity-80">{name}</div>
            <div className="text-sm opacity-80">{user.email}</div>
          </div>
        </aside>

        <main className="card p-5 space-y-5 self-start w-full max-w-2xl">
          <h3 className="text-lg font-semibold">Your Details</h3>

          <div>
            <label className="label" htmlFor="name">Name</label>
            <div className="relative">
              <input
                id="name"
                ref={usernameRef}
                className={`input pr-10 ${isEditingName ? 'ring-2 ring-amber-300/40' : ''}`}
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
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 ring-1 ring-white/15 ${
                  isEditingName ? 'bg-amber-500/80' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Edit3 className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" value={user?.email || ''} readOnly />
          </div>

          <div>
            <label className="label" htmlFor="bio">Bio</label>
            <div className="relative">
              <textarea
                id="bio"
                ref={bioRef}
                className={`input h-28 resize-y pr-10 ${isEditingBio ? 'ring-2 ring-amber-300/40' : ''}`}
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                readOnly={!isEditingBio}
              />
              <button
                type="button"
                aria-label="Edit bio"
                aria-pressed={isEditingBio}
                onClick={() => {
                  setIsEditingBio((v: boolean) => !v);
                  setTimeout(() => bioRef.current?.focus(), 0);
                }}
                className={`absolute right-2 top-2 rounded-full p-1 ring-1 ring-white/15 ${
                  isEditingBio ? 'bg-amber-500/80' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Edit3 className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="text-right text-xs opacity-70">{bio.length}/{BIO_MAX}</div>
          </div>

          <div className="pt-2">
            <button className="btn-primary w-auto" onClick={save} disabled={uploading}>
              Save changes
            </button>
          </div>
        </main>
      </div>
    </section>
  );
}