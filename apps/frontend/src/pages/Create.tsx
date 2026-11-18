import { useMemo, useState, useRef, useEffect } from 'react';
import { CreateActivitySchema } from '../lib/validators';
import { showSuccess, showError, showWarning } from '../lib/swal';
import TagSelector from '../components/TagSelector';
import { useEvents } from '../hooks/useEvents';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Image as ImageIcon, 
  Sparkles, 
  PlusCircle, 
  X,
  UploadCloud,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  tags: string[];
  maxParticipants: number;
  coverImage?: File;
}

export default function Create() {
  const { user } = useAuth();
  const { data } = useProfile();
  const { createEvent, isLoading } = useEvents();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    tags: [],
    maxParticipants: 4,
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: name === 'maxParticipants' ? parseInt(value) || 2 : value
    }));
  };

  const userName = useMemo(
    () =>
      (data?.name?.trim() ||
        user?.email?.split('@')[0] ||
        'You') as string,
    [data?.name, user?.email]
  );

  const handleImageSelect = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('ไฟล์ไม่ถูกต้อง', 'Please select an image file');
      return;
    }

    const maxSize = 5;
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxSize) {
      showError('ไฟล์ใหญ่เกินไป', `File too large (max ${maxSize} MB)`);
      return;
    }

    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewImage(localUrl);

    setFormData((prev: FormData) => ({
      ...prev,
      coverImage: file
    }));
  };

  const removeImage = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage('');
    setFormData((prev: FormData) => ({
      ...prev,
      coverImage: undefined
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.location ||
      !formData.date || !formData.time) {
      showError('กรุณากรอกข้อมูล', 'Please fill in all required fields');
      return;
    }

    if (formData.maxParticipants < 2) {
      showError('ข้อมูลไม่ถูกต้อง', 'Minimum 2 participants required');
      return;
    }

    try {
      let coverUrl = undefined;
      if (formData.coverImage) {
        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('cover', formData.coverImage);

        try {
          const token = localStorage.getItem('token');
          const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '');
          const uploadResponse = await fetch(`${apiBase}/api/events/upload-cover`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          });

          if (!uploadResponse.ok) {
            const text = await uploadResponse.text().catch(() => uploadResponse.statusText || 'unknown');
            throw new Error(`Failed to upload image: ${uploadResponse.status} ${text}`);
          }

          const uploadData = await uploadResponse.json();
          coverUrl = uploadData.url;
          setProgress(100);
          if (previewImage) {
            setTimeout(() => {
              try {
                URL.revokeObjectURL(previewImage);
              } catch (err) {
                // ignore
              }
            }, 300);
            setPreviewImage('');
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          showWarning('อัปโหลดรูปไม่สำเร็จ', 'Creating activity without image...');
        } finally {
          setUploading(false);
          setProgress(0);
        }
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date: formData.date + 'T' + formData.time + ':00.000Z',
        time: formData.time,
        tags: formData.tags,
        maxParticipants: formData.maxParticipants,
        cover: coverUrl
      };

      await createEvent(eventData);
      showSuccess('สร้างกิจกรรมสำเร็จ!', 'ห้องกิจกรรมของคุณถูกเผยแพร่แล้ว');
      navigate('/explore');
    } catch (error) {
      console.error('Create event error:', error);
      showError('ไม่สามารถสร้างกิจกรรมได้', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <section className="min-h-screen py-10 bg-[#F3F5F4]">
      <div className="container-app max-w-4xl space-y-6">
        {/* Navigation Breadcrumb / Back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#858B89] hover:text-[#202124] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <span className="text-xs text-[#858B89]">
            Publishing as <strong className="text-[#147D70]">{userName}</strong>
          </span>
        </div>

        {/* Form Container Card */}
        <div className="card overflow-hidden shadow-xs">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 border-b border-[#E8EBE9] bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E0F3F1] text-[#147D70] flex items-center justify-center flex-shrink-0">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight">
                  Create an Activity Room
                </h1>
                <p className="text-xs sm:text-sm text-[#858B89] mt-0.5">
                  Host study sessions, creative workshops, or group collaborations.
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={onSubmit} className="p-6 sm:p-8 space-y-6 bg-white">
            {/* Cover Image Upload Dropzone */}
            <div>
              <label className="label">Cover Media (Optional)</label>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-60 h-40 rounded-xl border-2 border-dashed border-[#E8EBE9] hover:border-[#147D70] bg-[#F3F5F4] flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative group"
                >
                  {previewImage ? (
                    <>
                      <img
                        src={previewImage}
                        alt="Activity cover"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-[#202124]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                        Change Image
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 space-y-1 text-[#858B89]">
                      <UploadCloud className="w-8 h-8 mx-auto text-[#147D70]" />
                      <span className="text-xs font-semibold text-[#202124] block">Click to upload cover</span>
                      <span className="text-[10px] block">PNG, JPG, WebP up to 5MB</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary text-xs"
                      disabled={isLoading || uploading}
                    >
                      {previewImage ? 'Replace Image' : 'Choose Photo'}
                    </button>
                    {previewImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#858B89] leading-relaxed">
                    Recommended resolution: 1200×630px. High-quality imagery helps attract engaged participants to your session.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => handleImageSelect(e.target.files?.[0])}
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="label">Activity Title *</label>
              <input
                id="title"
                name="title"
                className="input"
                placeholder="e.g., Late Night Machine Learning Study Circle"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="label">Room Agenda & Description *</label>
              <textarea
                id="description"
                name="description"
                className="input min-h-[7rem] resize-none"
                placeholder="What will you work on? Any prerequisites or expectations for attendees?"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="label">Meeting Location or Online Link *</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#858B89]" />
                <input
                  id="location"
                  name="location"
                  className="input pl-10"
                  placeholder="e.g., Central Library 4th Floor Study Room 402 or Google Meet link"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="label">Scheduled Date *</label>
                <div className="relative">
                  <input
                    ref={dateInputRef}
                    type="date"
                    id="date"
                    name="date"
                    className="input input-with-icon calendar"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="time" className="label">Start Time *</label>
                <div className="relative">
                  <input
                    ref={timeInputRef}
                    type="time"
                    id="time"
                    name="time"
                    className="input input-with-icon clock"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Max Participants */}
            <div>
              <label htmlFor="maxParticipants" className="label">Maximum Participants (Capacity) *</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  id="maxParticipants"
                  name="maxParticipants"
                  className="input max-w-[12rem]"
                  min={2}
                  max={100}
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <span className="text-xs text-[#858B89]">
                  Minimum 2 members required. Organizer is included automatically.
                </span>
              </div>
            </div>

            {/* Tags Section */}
            <div>
              <label className="label">Tags & Classifications</label>
              <TagSelector
                value={formData.tags}
                onChange={(newTags) => setFormData((prev: FormData) => ({ ...prev, tags: newTags }))}
                disabled={isLoading}
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-[#E8EBE9] flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary text-xs"
                disabled={isLoading || uploading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading || uploading}
                className="btn-primary text-xs px-6 py-3 flex items-center gap-2"
              >
                {isLoading || uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing Activity Room...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D9F36A]" />
                    <span>Publish Activity Room</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
