export function getProxiedImageUrl(url: string | false | null | undefined) {
  if (!url) return null;
  return `/media/proxy-image?url=${encodeURIComponent(url)}`;
}
