/**
 * Helper to convert a File object to a Base64 encoded string.
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Uploads a file to Google Drive using the Google Apps Script Web App.
 * Returns the direct preview URL of the uploaded file.
 */
export async function uploadToGoogleDrive(file: File): Promise<string> {
  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  if (!scriptUrl || scriptUrl.includes('PLACEHOLDER')) {
    throw new Error('Google Apps Script URL is not configured. Please set VITE_GOOGLE_SCRIPT_URL in your .env file.');
  }

  const base64Data = await fileToBase64(file);
  const payload = {
    filename: file.name,
    mimeType: file.type,
    base64Data: base64Data,
  };

  // We use text/plain;charset=utf-8 to prevent CORS preflight OPTIONS requests,
  // which are not natively handled by Google Apps Script web apps.
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
    redirect: 'follow', // Crucial as Google Apps Scripts redirect on success
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script responded with status: ${response.status} - ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to upload to Google Drive.');
  }

  return result.url;
}
