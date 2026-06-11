import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const API = 'http://localhost:3000';
const ADMIN_KEY = 'kaf-admin-key-2026';
const ORIGIN = 'http://localhost:4200';
const AUTH_DIR = join(__dirname, '.auth');

async function jpost(path: string, body: any, headers: Record<string, string> = {}) {
  const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const text = await r.text();
  try { return { status: r.status, data: JSON.parse(text) }; } catch { return { status: r.status, data: text }; }
}

export default async function globalSetup() {
  mkdirSync(AUTH_DIR, { recursive: true });

  // Unique phone per run so we never collide with real data.
  const phone = '0157' + Date.now().toString().slice(-7);
  const name = 'بلاي رايت';

  let reg = await jpost('/api/auth/register', { name, phone, password: 'test1234' });
  if (reg.status !== 201 && reg.status !== 200) {
    throw new Error('global-setup: register failed: ' + JSON.stringify(reg));
  }
  // Log in (this is what fires the welcome notification — state 2).
  const log = await jpost('/api/auth/login', { phone, password: 'test1234' });
  const user = log.data.user;
  const token = log.data.token;
  if (!token) throw new Error('global-setup: could not obtain auth token: ' + JSON.stringify(log));

  const auth = { Authorization: 'Bearer ' + token };

  // A real product to seed the cart with (for the coupon test).
  const prodRes = await fetch(`${API}/api/products?limit=1`).then(r => r.json());
  const product = Array.isArray(prodRes) ? prodRes[0] : (prodRes.products || prodRes.data || [])[0];
  const productId = product?.id;
  if (productId) await jpost('/api/cart/addtocart', { productId, quantity: 1 }, auth);

  // Admin sends this user a coupon + a general message with a link.
  await jpost('/api/notifications/admin/send', {
    type: 'coupon', title: 'كوبون اختبار', body: 'خصم خاص لك',
    coupon: { code: 'PWTEST10', discountPercentage: 10 }, target: { userIds: [user.id] },
  }, { 'x-admin-key': ADMIN_KEY });
  await jpost('/api/notifications/admin/send', {
    type: 'general', title: 'عرض اليوم', body: 'اضغط لمشاهدة العروض', link: '/offers', target: { userIds: [user.id] },
  }, { 'x-admin-key': ADMIN_KEY });

  // storageState: seed the storefront's auth key so tests start logged in.
  const storageState = {
    cookies: [],
    origins: [{ origin: ORIGIN, localStorage: [{ name: 'sz-current-user', value: JSON.stringify({ ...user, token }) }] }],
  };
  writeFileSync(join(AUTH_DIR, 'user.json'), JSON.stringify(storageState, null, 2));
  writeFileSync(join(AUTH_DIR, 'meta.json'), JSON.stringify({ userId: user.id, token, phone, productId }, null, 2));

  console.log(`[global-setup] test user ${user.id} (${phone}) ready, product=${productId}`);
}
