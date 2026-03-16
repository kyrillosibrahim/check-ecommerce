import { RenderMode } from '@angular/ssr';
import type { ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'products', renderMode: RenderMode.Server },
  { path: 'offers', renderMode: RenderMode.Server },
  { path: 'product/:id', renderMode: RenderMode.Server },
  { path: 'cart', renderMode: RenderMode.Client },
  { path: 'wishlist', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client },
  { path: 'profile', renderMode: RenderMode.Client },
  { path: 'dashboard/governorates', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
