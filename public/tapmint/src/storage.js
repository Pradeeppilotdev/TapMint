const fallback = new Map();
export function read(key, defaultValue) {
  try { const raw = localStorage.getItem('tapmint:' + key); return raw === null ? (fallback.get(key) ?? defaultValue) : JSON.parse(raw); }
  catch { return fallback.get(key) ?? defaultValue; }
}
export function write(key, value) {
  fallback.set(key, value);
  try { localStorage.setItem('tapmint:' + key, JSON.stringify(value)); } catch { /* Play remains available when storage is blocked. */ }
}
export function bestFor(id) {
  const value = read('best:' + id, 0);
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}
