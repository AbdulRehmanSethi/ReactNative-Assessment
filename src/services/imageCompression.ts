import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface CompressedImage {
  base64: string;
  mime: 'image/jpeg';
}

const MAX_LONGEST_SIDE = 1000;
// Base64 encodes 3 raw bytes as 4 ASCII chars, so encoded size ~= raw size * 4/3.
// Each base64 character is one byte in `.length`, so the guard below is a direct
// string-length check against the ~700KB budget agreed for a single Firestore field.
const MAX_BASE64_BYTES = 700 * 1024;

export async function compressImage(
  uri: string,
  width: number,
  height: number
): Promise<CompressedImage> {
  const longestSide = Math.max(width, height);
  const actions =
    longestSide > MAX_LONGEST_SIDE
      ? [
          width >= height
            ? { resize: { width: MAX_LONGEST_SIDE } }
            : { resize: { height: MAX_LONGEST_SIDE } },
        ]
      : [];

  const result = await manipulateAsync(uri, actions, {
    compress: 0.5,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error('Could not process this photo. Please try again.');
  }

  return { base64: result.base64, mime: 'image/jpeg' };
}

export function checkImageSize(base64: string): void {
  if (base64.length > MAX_BASE64_BYTES) {
    throw new Error(
      'This photo is too large even after compression. Try retaking it with better lighting or less detail.'
    );
  }
}
