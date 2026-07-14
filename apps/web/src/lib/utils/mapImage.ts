const MAP_IMAGE_BASE_URL = 'https://cdn.xomnghien.com/maps';

export function getMapImage(map?: string | null) {
  const name = map?.trim();
  if (!name) return '';
  return `${MAP_IMAGE_BASE_URL}/${encodeURIComponent(name)}.webp`;
}
