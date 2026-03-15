const cloudinary = require('../config/cloudinary');
const fse = require('fs-extra');

/**
 * Upload a local file to Cloudinary, then delete the temp file.
 * Returns the secure URL.
 */
async function uploadFile(filePath, folder) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
  });
  await fse.remove(filePath).catch(() => {});
  return result.secure_url;
}

/**
 * Delete an image from Cloudinary by its URL.
 * Extracts the public_id from the URL automatically.
 */
async function deleteFile(url) {
  if (!url || !url.startsWith('https://res.cloudinary.com')) return;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    if (match) {
      await cloudinary.uploader.destroy(match[1]);
    }
  } catch {}
}

module.exports = { uploadFile, deleteFile };
