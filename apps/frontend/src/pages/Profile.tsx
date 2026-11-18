import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { showSuccess, showError } from '../lib/swal';
import { 
  User, 
  Mail, 
  Edit3, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Save,
  Clock
} from 'lucide-react';

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (data || user) {
      const emailPrefix = user?.email?.split('@')[0] || '';
      setName(data?.name || emailPrefix);
      setBio(data?.bio || '');
      setAvatar(data?.avatar || '');
    }
  }, [data, user]);

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
      if (avatar && avatar.startsWith('blob:')) {
        URL.revokeObjectURL(avatar);
      }
      
      localUrl = URL.createObjectURL(blob);
      setAvatar(localUrl);
      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${_apiBase}/api/profiles/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) throw new Error('Failed to upload avatar');

      const resData = await response.json();
      await updateProfile({ name, bio, avatar: resData.avatarUrl });
      setAvatar(resData.avatarUrl);
      setUploading(false);
      setProgress(100);
      showSuccess('รูปโปรไฟล์อัปเดตสำเร็จ!', 'รูปภาพของคุณถูกเปลี่ยนแล้ว');

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
      if (localUrl) URL.revokeObjectURL(localUrl);
      setAvatar('');
      setUploading(false);
      setProgress(0);
      console.error('Upload error:', error);
      showError('อัปโหลดไม่สำเร็จ', 'Failed to upload image. Please try again.');
    }
  };

  const removeAvatar = async () => {
    try {
      if (avatar && avatar.startsWith('blob:')) {
        URL.revokeObjectURL(avatar);
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${_apiBase}/api/profiles/avatar`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete avatar');

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
      <section className="container-app py-16 text-center">
        <div className="card p-12 max-w-md mx-auto space-y-3">
          <User className="w-10 h-10 text-[#858B89] mx-auto" />
          <h2 className="text-base font-bold text-[#202124]">Please Sign In</h2>
          <p className="text-xs text-[#858B89]">You must be signed in to access account profile settings.</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="container-app py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-[#147D70] border-t-transparent animate-spin" />
        <span className="text-xs text-[#858B89]">Loading account settings...</span>
      </section>
    );
  }

  const firstChar = (name || user.email || '?').charAt(0).toUpperCase();

  return (
    <section className="min-h-screen py-10 bg-[#F3F5F4]">
      <div className="container-app max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#E8EBE9] p-6 rounded-2xl shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight">
                Account & Profile Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF5D5] text-[#11665C] border border-[#D9F36A]">
                {user.role === 'admin' ? 'Administrator' : 'Standard Member'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#858B89] mt-1">
              Customize how other members see your profile in activity rooms and chats.
            </p>
          </div>

          <button
            onClick={save}
            disabled={uploading}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-[#D9F36A]" />
            <span>Save Profile</span>
          </button>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Avatar & Account Details */}
          <div className="md:col-span-5 card p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#858B89]">
              Profile Photo
            </h3>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-[#E0F3F1] bg-[#F3F5F4] flex items-center justify-center">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-extrabold text-[#147D70]">
                      {firstChar}
                    </span>
                  )}
                </div>

                {uploading && (
                  <div className="absolute inset-0 bg-[#202124]/60 backdrop-blur-xs rounded-2xl flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-[#D9F36A] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={uploading}
                  className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-[#147D70]" />
                  <span>Upload Photo</span>
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
                    title="Remove avatar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
                />
              </div>

              <p className="text-[11px] text-[#858B89]">
                Supports PNG, JPG or WebP up to {AVATAR_MAX_MB}MB.
              </p>
            </div>

            {/* Quick Metadata Box */}
            <div className="pt-4 border-t border-[#E8EBE9] space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#858B89]">Account Role</span>
                <span className="font-semibold text-[#202124] capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#858B89]">User ID</span>
                <span className="font-mono text-[11px] text-[#5F6664]">{user._id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#858B89]">Profile Status</span>
                <span className="inline-flex items-center gap-1 text-[#147D70] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Identity & Bio Form */}
          <div className="md:col-span-7 card p-6 sm:p-8 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#858B89]">
              Personal Information
            </h3>

            {/* Name Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="name" className="label mb-0">Display Name</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName((v) => !v);
                    setTimeout(() => usernameRef.current?.focus(), 0);
                  }}
                  className="text-xs font-semibold text-[#147D70] hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingName ? 'Done' : 'Edit'}</span>
                </button>
              </div>
              <input
                id="name"
                ref={usernameRef}
                className={`input ${isEditingName ? 'border-[#147D70] ring-2 ring-[#147D70]/15' : 'bg-[#F3F5F4]'}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={!isEditingName}
              />
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label htmlFor="email" className="label">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#858B89]" />
                <input
                  id="email"
                  className="input pl-10 bg-[#F3F5F4] text-[#858B89] cursor-not-allowed"
                  value={user?.email || ''}
                  readOnly
                />
              </div>
              <span className="text-[11px] text-[#858B89] mt-1 block">
                Email address is tied to authentication and cannot be changed directly.
              </span>
            </div>

            {/* Bio Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="bio" className="label mb-0">Bio & Interests</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingBio((v) => !v);
                    setTimeout(() => bioRef.current?.focus(), 0);
                  }}
                  className="text-xs font-semibold text-[#147D70] hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingBio ? 'Done' : 'Edit'}</span>
                </button>
              </div>
              <textarea
                id="bio"
                ref={bioRef}
                className={`input min-h-[7rem] resize-none ${isEditingBio ? 'border-[#147D70] ring-2 ring-[#147D70]/15' : 'bg-[#F3F5F4]'}`}
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                readOnly={!isEditingBio}
                placeholder="Share a short bio, your academic focus, or favorite hobbies..."
              />
              <div className="text-right text-[11px] text-[#858B89] mt-1">
                {bio.length}/{BIO_MAX} characters
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#E8EBE9] flex justify-end gap-3">
              <button
                type="button"
                onClick={save}
                disabled={uploading}
                className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-[#D9F36A]" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
