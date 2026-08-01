export const ALLOWED_BANNER_MIME_TYPES = ['image/jpeg', 'image/png'] as const;
export const MAX_BANNER_BYTES = 5 * 1024 * 1024; // 5 MB

export function isAllowedBannerMimeType(type: string): boolean {
  return (ALLOWED_BANNER_MIME_TYPES as readonly string[]).includes(type);
}

const BANNER_DATA_URL_RE = /^data:(image\/jpeg|image\/png);base64,([a-zA-Z0-9+/]+={0,2})$/;

export function isValidBannerDataUrl(dataUrl: string): boolean {
  const match = BANNER_DATA_URL_RE.exec(dataUrl);
  if (!match) return false;
  const base64Length = match[2].length;
  const approxBytes = (base64Length * 3) / 4;
  return approxBytes <= MAX_BANNER_BYTES;
}
