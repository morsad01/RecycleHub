// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — UPLOAD & CLOUD STORAGE ENGINE
// ════════════════════════════════════════════════════════════════════════════════

import { CONFIG } from './config.js';

/**
 * Transforms any Google Drive URL into an embeddable raw image CDN URL.
 */
export function toDirectGoogleDriveUrl(url) {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.includes('googleusercontent.com') || url.includes('thumbnail?id=')) return url;

  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
  }

  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
  }

  return url;
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file.'));
      }
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Uploads file to Google Drive and returns direct CDN URL.
 */
export async function uploadToGoogleDrive(file) {
  const base64Data = await fileToBase64(file);
  const payload = {
    filename: file.name,
    mimeType: file.type,
    base64Data: base64Data,
  };

  const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Upload server responded with status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Upload to Google Drive failed.');
  }

  const fileId = result.id || result.fileId || result.docId;
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  const rawUrl = result.url || result.directUrl || '';
  return toDirectGoogleDriveUrl(rawUrl) || rawUrl;
}
