import { readFileSync } from 'fs';
import { join } from 'path';

const API = 'http://localhost:3000';

export default async function globalTeardown() {
  try {
    const meta = JSON.parse(readFileSync(join(__dirname, '.auth', 'meta.json'), 'utf-8'));
    const auth = { Authorization: 'Bearer ' + meta.token };

    // Delete this user's notifications, then the user itself.
    const mine = await fetch(`${API}/api/notifications/mine`, { headers: auth }).then(r => r.json()).catch(() => ({ notifications: [] }));
    for (const n of mine.notifications || []) {
      await fetch(`${API}/api/notifications/${n.id}`, { method: 'DELETE', headers: auth }).catch(() => {});
    }
    await fetch(`${API}/api/cart/clear`, { method: 'DELETE', headers: auth }).catch(() => {});
    await fetch(`${API}/api/auth/users/${meta.userId}`, { method: 'DELETE' }).catch(() => {});
    console.log('[global-teardown] removed test user', meta.userId);
  } catch (e: any) {
    console.warn('[global-teardown] skipped:', e?.message);
  }
}
