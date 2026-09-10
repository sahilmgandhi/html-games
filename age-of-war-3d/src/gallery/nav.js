// Pure navigation helpers between battle and gallery. Both pages are the
// same index.html; only the showcase param differs. URL API works in node.
export function toGallery(href) {
  const u = new URL(href);
  u.searchParams.set('showcase', 'gallery');
  return u.toString();
}

export function toBattle(href) {
  const u = new URL(href);
  u.searchParams.delete('showcase');
  return u.toString();
}
