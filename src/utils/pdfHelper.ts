import { getMediaUrl } from '../api/apiClient';

export interface GoogleDriveInfo {
  isGoogleDrive: boolean;
  fileId?: string;
  embedUrl?: string;
  viewUrl?: string;
}

export function parseGoogleDriveUrl(url: string): GoogleDriveInfo {
  if (!url || typeof url !== 'string') {
    return { isGoogleDrive: false };
  }

  const cleanUrl = url.trim();
  const isDriveDomain =
    cleanUrl.includes('drive.google.com') || cleanUrl.includes('docs.google.com');

  if (!isDriveDomain) {
    return { isGoogleDrive: false };
  }

  let fileId: string | undefined;

  // Pattern 1: /file/d/FILE_ID/...
  const fileDMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  }

  // Pattern 2: id=FILE_ID
  if (!fileId) {
    const idParamMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      fileId = idParamMatch[1];
    }
  }

  if (fileId) {
    return {
      isGoogleDrive: true,
      fileId,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
    };
  }

  return {
    isGoogleDrive: true,
    embedUrl: cleanUrl.replace(/\/view(\?.*)?$/, '/preview'),
    viewUrl: cleanUrl,
  };
}

export function isLocalOrPrivateUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.startsWith('blob:') ||
    clean.startsWith('data:') ||
    clean.startsWith('file:') ||
    clean.includes('127.0.0.1') ||
    clean.includes('192.168.') ||
    clean.includes('10.') ||
    clean.includes('172.16.')
  );
}

export function convertDataUrlToBlobUrl(dataUrl: string): string {
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Failed to convert data URL to Blob URL:', e);
    return dataUrl;
  }
}

export function getPdfObjectUrl(
  url: string,
  preferredEngine: 'auto' | 'google' | 'pdfjs' | 'direct' = 'auto'
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  }
  const cleanUrl = getMediaUrl(url.trim());

  // 1. Google Drive URL -> Always use official Google Drive embedded preview
  const driveInfo = parseGoogleDriveUrl(cleanUrl);
  if (driveInfo.isGoogleDrive && driveInfo.embedUrl) {
    return driveInfo.embedUrl;
  }

  // 2. Data URL base64 -> Convert to Blob URL
  if (cleanUrl.startsWith('data:')) {
    return convertDataUrlToBlobUrl(cleanUrl);
  }

  // 3. Localhost or Private LAN URL -> Direct URL (Google Docs Viewer CANNOT access local machines)
  if (isLocalOrPrivateUrl(cleanUrl)) {
    return cleanUrl;
  }

  // 4. Engine selection for remote public URLs
  if (preferredEngine === 'pdfjs') {
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(cleanUrl)}`;
  }

  if (preferredEngine === 'direct') {
    return cleanUrl;
  }

  // Preferred 'google' or 'auto'
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    if (cleanUrl.toLowerCase().includes('.pdf') || cleanUrl.includes('/uploads/')) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(cleanUrl)}`;
    }
  }

  // 5. Placeholder domain fallback
  if (cleanUrl.includes('srisumanapirivena.lk') || cleanUrl === '/sample.pdf') {
    return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  }

  return cleanUrl;
}

export function openInAppFileViewer(fileInfo: {
  url: string;
  title?: string;
  subtitle?: string;
  fileType?: 'pdf' | 'image' | 'audio' | 'video' | 'text' | 'auto';
  downloadFileName?: string;
}): void {
  if (!fileInfo || !fileInfo.url) return;
  const fullUrl = getMediaUrl(fileInfo.url.trim());
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('open-in-app-file-viewer', {
        detail: {
          ...fileInfo,
          url: fullUrl,
        },
      })
    );
  }
}

export async function openPdfInBlobTab(pdfUrl: string, title?: string): Promise<void> {
  if (!pdfUrl) return;
  const fullUrl = getMediaUrl(pdfUrl.trim());
  openInAppFileViewer({
    url: fullUrl,
    title: title || 'PDF ලේඛනය (Document)',
    fileType: 'pdf',
  });
}

export function openInDevicePdfViewer(url: string, title?: string, fileName?: string): void {
  if (!url) return;
  const cleanUrl = getMediaUrl(url.trim());
  const safeName = fileName || (title ? `${title.replace(/[^a-zA-Z0-9_\u0D80-\u0DFF-]/g, '_')}.pdf` : 'document.pdf');

  // 1. If running inside Android APK (Native JavascriptInterface)
  if (typeof window !== 'undefined' && (window as any).AndroidPdfOpener) {
    try {
      if (cleanUrl.startsWith('data:')) {
        (window as any).AndroidPdfOpener.openPdfBase64(cleanUrl, safeName);
      } else {
        (window as any).AndroidPdfOpener.openPdf(cleanUrl, safeName);
      }
      return;
    } catch (e) {
      console.warn('AndroidPdfOpener bridge error, falling back:', e);
    }
  }

  // 2. If Google Drive URL
  const driveInfo = parseGoogleDriveUrl(cleanUrl);
  if (driveInfo.isGoogleDrive && driveInfo.viewUrl) {
    window.open(driveInfo.viewUrl, '_blank');
    return;
  }

  // 3. If base64 data URL on browser
  if (cleanUrl.startsWith('data:')) {
    downloadFileFromUrl(cleanUrl, safeName);
    return;
  }

  // 4. Remote URL on web browser -> download or open in new tab
  try {
    const win = window.open(cleanUrl, '_blank');
    if (!win) {
      downloadFileFromUrl(cleanUrl, safeName);
    }
  } catch {
    downloadFileFromUrl(cleanUrl, safeName);
  }
}

export function downloadFileFromUrl(url: string, fileName = 'study-material.pdf'): void {
  if (!url) return;
  const cleanUrl = getMediaUrl(url.trim());

  try {
    if (cleanUrl.startsWith('data:')) {
      const blobUrl = convertDataUrlToBlobUrl(cleanUrl);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName.endsWith('.pdf') || fileName.includes('.') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      return;
    }

    const driveInfo = parseGoogleDriveUrl(cleanUrl);
    if (driveInfo.isGoogleDrive && driveInfo.viewUrl) {
      window.open(driveInfo.viewUrl, '_blank');
      return;
    }

    const link = document.createElement('a');
    link.href = cleanUrl;
    link.download = fileName.endsWith('.pdf') || fileName.includes('.') ? fileName : `${fileName}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Download file error:', err);
    window.open(cleanUrl, '_blank');
  }
}

export function getEmbeddableUrl(url: string): string {
  return getPdfObjectUrl(url);
}

export function getMimeTypeFromUrl(url: string): string {
  if (!url) return 'application/pdf';
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);/);
    if (match) return match[1];
  }
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.txt')) return 'text/plain';
  return 'application/pdf';
}
