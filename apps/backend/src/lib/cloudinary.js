import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Ensure env vars are loaded when this module is imported (important for ESM import order)
dotenv.config();

// Initialize cloudinary
if (process.env.CLOUDINARY_URL) {
  // Parse CLOUDINARY_URL (format: cloudinary://<api_key>:<api_secret>@<cloud_name>) and configure explicitly
  try {
    const url = process.env.CLOUDINARY_URL;
    // simple parse
    const m = url.match(/^cloudinary:\/\/(?:(.+?):(.+?)@)?(.+)$/);
    if (m) {
      const api_key = m[1];
      const api_secret = m[2];
      const cloud_name = m[3];
      if (api_key && api_secret && cloud_name) {
        cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
      } else {
        // fallback to letting the library parse it
        cloudinary.config({ secure: true });
      }
    } else {
      cloudinary.config({ secure: true });
    }
  } catch (e) {
    console.warn('Warning: failed to configure Cloudinary from CLOUDINARY_URL:', e && e.message);
  }
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
} else {
  console.warn('Cloudinary not configured: set CLOUDINARY_URL or CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET');
}

// Debug: show whether env vars are present (do not print secret values)
try {
  const hasUrl = !!process.env.CLOUDINARY_URL;
  const hasKey = !!process.env.CLOUDINARY_API_KEY;
  const hasSecret = !!process.env.CLOUDINARY_API_SECRET;
  const hasCloud = !!process.env.CLOUDINARY_CLOUD_NAME;
  console.debug('Cloudinary env presence:', { hasUrl, hasCloud, hasKey, hasSecret });
} catch (err) {
  // ignore
}

function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

export { cloudinary, uploadBuffer };
