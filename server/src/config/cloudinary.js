import { v2 as cloudinary } from 'cloudinary';
import { env, cloudinaryEnabled } from './env.js';

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export function uploadBuffer(buffer, { folder = 'products' } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `${env.cloudinary.folder}/${folder}`, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

export async function destroyImage(publicId) {
  if (!cloudinaryEnabled || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.warn('Cloudinary delete failed for', publicId, err.message);
  }
}
