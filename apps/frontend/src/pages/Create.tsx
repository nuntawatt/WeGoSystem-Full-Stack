import { useMemo, useState, useRef, useEffect } from 'react';
import { CreateActivitySchema } from '../lib/validators';
import { toast } from '../components/Toasts';
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
  category: string;
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
    category: ''
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string>('');
  const navigate = useNavigate();

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
      [name]: value
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
      toast('Please select an image file');
      return;
    }

    const maxSize = 5; // 5MB
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxSize) {
      toast(`File too large (max ${maxSize} MB)`);
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
    
    // Validate form data
    if (!formData.title || !formData.description || !formData.location || 
        !formData.date || !formData.time || !formData.category) {
      toast('Please fill in all required fields');
      return;
    }

    if (formData.maxParticipants < 2) {
      toast('Minimum 2 participants required');
      return;
    }

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date: formData.date + 'T' + formData.time + ':00.000Z',
        time: formData.time,
        tags: formData.tags,
        maxParticipants: formData.maxParticipants,
        category: formData.category,
        cover: formData.coverImage ? URL.createObjectURL(formData.coverImage) : undefined
      };

      const newEvent = await createEvent(eventData);
      navigate('/explore');
    } catch (error: any) {
      console.error('Create event error:', error);
    }
  };

  return (
    <section className="container-app flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-3xl space-y-8">
        
        <form
          onSubmit={onSubmit}
          className="card p-6 space-y-5 shadow-lg border border-white/10"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Create Activity</h3>
            <span className="text-sm text-gray-300">
              Creator: <span className="font-medium text-brand-gold">{userName}</span>
            </span>
          </div>

          <div>
            <label className="label" htmlFor="coverImage">Cover Image</label>
            <div className="flex gap-4 items-start">
              <div className="relative w-40 h-40 bg-white/5 rounded-lg overflow-hidden">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Activity cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary px-4 py-2"
                  disabled={isLoading}
                >
                  Choose Image
                </button>
                {previewImage && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-4 py-2 text-sm border border-white/15 rounded-lg hover:bg-white/5"
                  >
                    Remove
                  </button>
                )}
                <p className="text-xs text-white/60">
                  Recommended: 1200×800px • Max 5MB<br />
                  Supports: JPG, PNG, WebP
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

          <div>
            <label className="label" htmlFor="title">Activity Name</label>
            <input
              id="title"
              name="title"
              className="input"
              placeholder="e.g., Saturday Hiking"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="input h-24"
              placeholder="Briefly describe your activity"
              value={formData.description}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="label" htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              className="input"
              placeholder="e.g., Central Park, New York"
              value={formData.location}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                className="input"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="label" htmlFor="time">Time</label>
              <input
                type="time"
                id="time"
                name="time"
                className="input"
                value={formData.time}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              className="input bg-gray-800 text-white"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={isLoading}
            >
              <option value="">Select a category</option>
              <option value="sports">Sports</option>
              <option value="social">Social</option>
              <option value="education">Education</option>
              <option value="entertainment">Entertainment</option>
              <option value="food">Food & Dining</option>
              <option value="outdoor">Outdoor</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <div className="label">Tags</div>
            <TagSelector 
              value={formData.tags} 
              onChange={(newTags) => setFormData((prev: FormData) => ({ ...prev, tags: newTags }))}
              disabled={isLoading}
            />
          </div>

          <button 
            className="btn-primary w-full py-2 text-base font-semibold flex items-center justify-center gap-2" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating activity...
              </>
            ) : (
              <>🚀 Create Activity</>
            )}
          </button>
        </form>

        {/* Tips Section */}
        <aside className="card p-5 text-sm">
          <h3 className="text-lg font-bold text-white mb-2">💡 Activity Creation Tips</h3>
          <ul className="list-disc ml-5 space-y-1 text-gray-300">
            <li>Choose a clear and friendly activity name</li>
            <li>Add 1-3 relevant tags (#exercise #outdoors #social)</li>
            <li>Write a concise and helpful description</li>
            <li>Specify location, date, and time clearly</li>
            <li>Invite friends and share your activity</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
