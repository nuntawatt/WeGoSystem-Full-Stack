import { useMemo, useState, useRef, useEffect } from 'react';
import { CreateActivitySchema } from '../lib/validators';
import { showSuccess, showError, showWarning } from '../lib/swal';
import TagSelector from '../components/TagSelector';
import { useEvents } from '../hooks/useEvents';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    tags: [],
    maxParticipants: 2,
    
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string>('');
  const navigate = useNavigate();

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cleanup preview image when component unmounts
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
        '') as string,
    [data?.name, user?.email]
  );

  const handleImageSelect = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('ไฟล์ไม่ถูกต้อง', 'Please select an image file');
      return;
    }

    const maxSize = 5; // 5MB
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxSize) {
      showError('ไฟล์ใหญ่เกินไป', `File too large (max ${maxSize} MB)`);
      return;
    }

    // Cleanup previous preview URL if exists
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }

    // Create new preview image
    const localUrl = URL.createObjectURL(file);
    setPreviewImage(localUrl);

    // Save file to form data
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
    
    // Validate form data (category is optional)
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
      // If there's a cover image, upload it first
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
          // Cleanup local preview blob after a short delay to avoid ERR_FILE_NOT_FOUND
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

      const newEvent = await createEvent(eventData);
      showSuccess('สร้างกิจกรรมสำเร็จ! 🎉', 'กิจกรรมถูกสร้างเรียบร้อยแล้ว');
      navigate('/explore');
    } catch (error: any) {
      console.error('Create event error:', error);
      showError('ไม่สามารถสร้างกิจกรรมได้', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <section className="min-h-screen py-8 bg-slate-50 dark:bg-slate-900">
      <div className="container-app px-4">
        {/* Professional Header */}
        <header className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-slate-800 dark:text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Create <span className="italic">Activity</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Share your interests and meet like-minded people</p>
        </header>

        <div className="w-full max-w-3xl mx-auto">
        {/* Professional Form Card */}
        <form
          onSubmit={onSubmit}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 space-y-6 shadow-sm"
        >
          {/* Form Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-800 dark:text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Activity Details
            </h3>
            <span className="text-sm text-slate-500 dark:text-slate-400 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-sm">
              Creator: <span className="font-medium text-teal-700 dark:text-teal-400">{userName}</span>
            </span>
          </div>

          {/* Cover Image Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3" htmlFor="coverImage">
              Cover Image
            </label>
            <div className="flex gap-4 items-start">
              <div className="relative w-44 h-44 rounded-sm overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Activity cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-slate-800 dark:bg-white dark:text-slate-900 rounded-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors duration-200"
                  disabled={isLoading}
                >
                  Choose Image
                </button>
                {previewImage && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    Remove
                  </button>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Recommended: 1200×800px<br />Max 5MB
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

          {/* Activity Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="title">
              Activity Name
            </label>
            <input
              id="title"
              name="title"
              className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
              placeholder="Enter a catchy activity name..."
              value={formData.title}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none resize-none h-28"
              placeholder="Briefly describe your activity..."
              value={formData.description}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              name="location"
              className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
              placeholder="Where will this happen?"
              value={formData.location}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="date">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                style={{ colorScheme: 'light dark' }}
                value={formData.date}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="time">
                Time
              </label>
              <input
                type="time"
                id="time"
                name="time"
                className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                style={{ colorScheme: 'light dark' }}
                value={formData.time}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tags
            </div>
            <TagSelector 
              value={formData.tags} 
              onChange={(newTags) => setFormData((prev: FormData) => ({ ...prev, tags: newTags }))}
              disabled={isLoading}
            />
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="maxParticipants">
              Max Participants
            </label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
              placeholder="ระบุจำนวนคนที่รับได้ (ขั้นต่ำ 2 คน)"
              min={2}
              max={100}
              value={formData.maxParticipants}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              ระบุจำนวนคนที่ต้องการรับเข้ากิจกรรม (ไม่นับรวมผู้สร้าง)
            </p>
          </div>

          {/* Submit Button */}
          <button 
            className="w-full py-3.5 text-base font-medium text-white bg-slate-800 dark:bg-white dark:text-slate-900 rounded-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Creating activity...
              </>
            ) : (
              <>Create Activity</>
            )}
          </button>
        </form>
       
        </div>
      </div>
    </section>
  );
}
