import { auth } from './firebase';

async function authHeader(): Promise<HeadersInit> {
  const u = auth.currentUser;
  if (!u) throw new Error('Not signed in');
  const token = await u.getIdToken();
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function uploadAdminImage(file: File, folder = 'admin'): Promise<string> {
  const u = auth.currentUser;
  if (!u) throw new Error('Not signed in');
  const token = await u.getIdToken();
  const safe = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const ts = Date.now();
  const filename = `${ts}_${safe}`;
  const res = await fetch(`/api/upload-image?filename=${encodeURIComponent(filename)}&folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const blob = await res.json();
  return blob.url as string;
}

export async function saveSiteConfig(key: string, value: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch('/api/admin/site-config', { method: 'POST', headers, body: JSON.stringify({ key, value }) });
  if (!res.ok) throw new Error(`saveSiteConfig failed (${res.status})`);
}

export async function saveHeroSlides(slides: Array<{id:string;title:string;subtitle:string;backgroundImage:string;order:number}>): Promise<void> {
  const headers = await authHeader();
  const res = await fetch('/api/admin/hero-slides', { method: 'POST', headers, body: JSON.stringify({ slides }) });
  if (!res.ok) throw new Error(`saveHeroSlides failed (${res.status})`);
}

export async function saveBanners(banners: Array<{id:string;title:string;description:string;buttonText:string;imageUrl:string;layout:string;linkUrl:string}>): Promise<void> {
  const headers = await authHeader();
  const res = await fetch('/api/admin/banners', { method: 'POST', headers, body: JSON.stringify({ banners }) });
  if (!res.ok) throw new Error(`saveBanners failed (${res.status})`);
}
