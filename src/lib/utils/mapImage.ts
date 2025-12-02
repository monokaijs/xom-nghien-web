export const getMapImage = (map?: string) => {
  if (!map) return '';
  return `https://cdn.xomnghien.com/maps/${map}.webp`
};