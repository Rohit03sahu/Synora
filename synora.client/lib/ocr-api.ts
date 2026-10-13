import { apiUpload } from '@/lib/api-client';
import type { OcrLabResult } from '@/lib/types';

const supportedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const maxImageSizeBytes = 10 * 1024 * 1024;

export async function extractLabResults(file: File): Promise<OcrLabResult[]> {
  if (!supportedImageTypes.has(file.type)) {
    throw new Error('Upload a PNG, JPEG, or WebP image.');
  }
  if (file.size === 0) {
    throw new Error('Choose a non-empty image file.');
  }
  if (file.size > maxImageSizeBytes) {
    throw new Error('Choose an image smaller than 10 MB.');
  }

  return apiUpload<OcrLabResult[]>('/labs/ocr', 'file', file);
}
