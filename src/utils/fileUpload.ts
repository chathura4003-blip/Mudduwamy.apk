import { uploadApi } from '../api';
import { getFullApiUrl } from '../api/apiClient';

export interface UploadProgressInfo {
  loaded: number;
  total: number;
  percentage: number;
  loadedFormatted: string;
  totalFormatted: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Client-side image compression to bypass PHP upload limits (post_max_size)
async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }
  // Only compress if larger than 800KB
  if (file.size <= 800 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Max dimensions 1920px (Perfect for High-Res widescreen displays)
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1080;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      if (height > MAX_HEIGHT) {
        width = Math.round((width * MAX_HEIGHT) / height);
        height = MAX_HEIGHT;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { 
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.80 // 80% compression ratio for excellent quality & tiny size
        );
      } else {
        resolve(file);
      }
    };
    img.onerror = () => resolve(file);
  });
}

export async function uploadFileWithProgress(
  file: File,
  onProgress?: (progress: UploadProgressInfo) => void
): Promise<string> {
  // Compress large camera photos dynamically
  const fileToUpload = await compressImageIfNeeded(file);

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', fileToUpload);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', getFullApiUrl('/api/upload'));

    const token = localStorage.getItem('pirivena_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const loaded = event.loaded;
          const total = event.total;
          const percentage = Math.round((loaded / total) * 100);
          onProgress({
            loaded,
            total,
            percentage,
            loadedFormatted: formatBytes(loaded),
            totalFormatted: formatBytes(total),
          });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const url =
            data.fileUrl ||
            data.url ||
            data.filePath ||
            (data.urls && data.urls[0]) ||
            '';
          if (url) {
            if (onProgress) {
              onProgress({
                loaded: fileToUpload.size,
                total: fileToUpload.size,
                percentage: 100,
                loadedFormatted: formatBytes(fileToUpload.size),
                totalFormatted: formatBytes(fileToUpload.size),
              });
            }
            resolve(url);
            return;
          }
        } catch (e) {
          console.warn('Could not parse upload JSON response:', e);
        }
      }
      // Fallback to Data URL if upload endpoint fails
      fallbackToDataUrl(fileToUpload, onProgress).then(resolve);
    };

    xhr.onerror = () => {
      fallbackToDataUrl(fileToUpload, onProgress).then(resolve);
    };

    xhr.send(formData);
  });
}

function fallbackToDataUrl(
  file: File,
  onProgress?: (progress: UploadProgressInfo) => void
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const loaded = event.loaded;
        const total = event.total;
        const percentage = Math.round((loaded / total) * 100);
        onProgress({
          loaded,
          total,
          percentage,
          loadedFormatted: formatBytes(loaded),
          totalFormatted: formatBytes(total),
        });
      }
    };
    reader.onload = () => {
      if (onProgress) {
        onProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100,
          loadedFormatted: formatBytes(file.size),
          totalFormatted: formatBytes(file.size),
        });
      }
      resolve((reader.result as string) || '');
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export async function uploadFile(file: File): Promise<string> {
  return uploadFileWithProgress(file);
}

export async function uploadMultipleFiles(files: FileList | File[]): Promise<string[]> {
  const fileArray = Array.from(files);
  const results: string[] = [];
  for (const f of fileArray) {
    const url = await uploadFile(f);
    if (url) results.push(url);
  }
  return results;
}
