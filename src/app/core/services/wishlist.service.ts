import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, map, catchError, of } from 'rxjs';
import { IProduct } from '../models/product.model';
import { CartService } from './cart.service';
import { ProductService } from './product.service';
import { API_CONFIG } from '../config/api.config';
import { AlertService } from './alert.service';
import { AuthService } from './auth.service';
import { AuthDrawerService } from './auth-drawer.service';

const SERVER_URL = API_CONFIG.baseUrl;

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private cartService = inject(CartService);
  private productService = inject(ProductService);
  private alertService = inject(AlertService);
  private auth = inject(AuthService);
  private authDrawer = inject(AuthDrawerService);
  private platformId = inject(PLATFORM_ID);

  private wishlistSubject = new BehaviorSubject<IProduct[]>([]);
  loading = signal(false);

  /** IDs currently being toggled (to prevent double-clicks) */
  processingIds = signal<Set<string>>(new Set());

  /** Favorite IDs as a signal — triggers CD in OnPush components */
  favoriteIds = signal<Set<string>>(new Set());
  private favoriteIds$ = toObservable(this.favoriteIds);

  /** Wishlist items (populated by loadFavorites on wishlist page) */
  wishlist$ = this.wishlistSubject.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Favorites are private — (re)load on login, clear on logout.
      this.auth.currentUser$.subscribe(user => {
        if (user) {
          this.loadFavoriteIds();
        } else {
          this.favoriteIds.set(new Set());
          this.wishlistSubject.next([]);
          this.productService.clearAllFavoriteState();
        }
      });
    }
  }

  /** Load favorites on init to get accurate count (auto-cleans stale IDs) */
  private loadFavoriteIds(): void {
    if (!this.auth.isLoggedIn()) return;
    this.http.get<any[]>(`${SERVER_URL}/api/favorites/getfavorit`).subscribe({
      next: (products) => {
        const ids = (products || []).map(p => p.id);
        this.favoriteIds.set(new Set(ids));
      },
      error: () => {},
    });
  }

  /**
   * Wishlist count — reacts to favoriteIds$, wishlist items, and products.
   */
  wishlistCount$ = combineLatest([
    this.wishlistSubject,
    this.productService.products$,
    this.favoriteIds$,
  ]).pipe(
    map(([wishlistItems, products, favIds]) => {
      if (products.length > 0) {
        return products.filter(p => p.inFavorite).length;
      }
      if (favIds.size > 0) return favIds.size;
      return wishlistItems.length;
    })
  );

  /** Load paginated favorites from API */
  loadFavoritesPaginated(page: number, limit: number): Observable<{ items: IProduct[]; total: number }> {
    this.loading.set(true);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${SERVER_URL}/api/favorites/getfavorit`, { params }).pipe(
      map(res => {
        const items = Array.isArray(res) ? res : (res.favorites || res.data || res.products || []);
        const total = Array.isArray(res) ? items.length : (res.total ?? res.count ?? items.length);
        const mapped = items.map((p: any) => this.productService.mapServerProduct(p));
        this.wishlistSubject.next(mapped);
        // Sync favoriteIds with actual products (removes stale IDs)
        this.favoriteIds.set(new Set(mapped.map((p: IProduct) => p.id)));
        this.loading.set(false);
        return { items: mapped, total };
      }),
      catchError(err => {
        console.error('Failed to load favorites:', err);
        this.loading.set(false);
        return of({ items: [], total: 0 });
      })
    );
  }

  isProcessing(productId: string): boolean {
    return this.processingIds().has(productId);
  }

  private markProcessing(id: string): void {
    const s = new Set(this.processingIds());
    s.add(id);
    this.processingIds.set(s);
  }

  private unmarkProcessing(id: string): void {
    const s = new Set(this.processingIds());
    s.delete(id);
    this.processingIds.set(s);
  }

  /** Check if product is in wishlist — reads favoriteIds signal (triggers CD) */
  isInWishlist(productId: string): boolean {
    return this.favoriteIds().has(productId) ||
      this.wishlistSubject.getValue().some(p => p.id === productId);
  }

  addToWishlist(product: IProduct): void {
    if (!this.auth.isLoggedIn()) { this.authDrawer.open('login'); return; }
    if (this.isProcessing(product.id)) return;
    this.markProcessing(product.id);

    // Optimistic update — new Set triggers signal
    this.favoriteIds.update(s => { const n = new Set(s); n.add(product.id); return n; });
    this.productService.updateProductFavoriteState(product.id, true);

    this.http.post<any>(`${SERVER_URL}/api/favorites/addtofavorit`, {
      productId: product.id,
    }).subscribe({
      next: () => {
        const current = this.wishlistSubject.getValue();
        if (!current.some(p => p.id === product.id)) {
          this.wishlistSubject.next([...current, product]);
        }
        this.unmarkProcessing(product.id);
      },
      error: () => {
        this.favoriteIds.update(s => { const n = new Set(s); n.delete(product.id); return n; });
        this.productService.updateProductFavoriteState(product.id, false);
        this.unmarkProcessing(product.id);
        this.alertService.fire({ icon: 'error', title: 'خطأ', text: 'فشل إضافة المنتج للمفضلة', timer: 2000, showConfirmButton: false });
      },
    });
  }

  removeFromWishlist(productId: string): void {
    if (this.isProcessing(productId)) return;
    this.markProcessing(productId);

    // Optimistic update
    this.favoriteIds.update(s => { const n = new Set(s); n.delete(productId); return n; });
    this.productService.updateProductFavoriteState(productId, false);
    const current = this.wishlistSubject.getValue();
    const removed = current.find(p => p.id === productId);
    this.wishlistSubject.next(current.filter(p => p.id !== productId));

    this.http.delete<any>(`${SERVER_URL}/api/favorites/remove/${productId}`).subscribe({
      next: () => {
        this.unmarkProcessing(productId);
      },
      error: () => {
        // Rollback
        this.favoriteIds.update(s => { const n = new Set(s); n.add(productId); return n; });
        this.productService.updateProductFavoriteState(productId, true);
        if (removed) {
          this.wishlistSubject.next([...this.wishlistSubject.getValue(), removed]);
        }
        this.unmarkProcessing(productId);
        this.alertService.fire({ icon: 'error', title: 'خطأ', text: 'فشل إزالة المنتج من المفضلة', timer: 2000, showConfirmButton: false });
      },
    });
  }

  /** Move item from wishlist to cart, then remove from wishlist */
  moveToCart(productId: string): void {
    const product = this.wishlistSubject.getValue().find(p => p.id === productId);
    if (product) {
      this.cartService.addToCart(product, 1);
      this.removeFromWishlist(productId);
    }
  }

  clearWishlist(): void {
    this.http.delete<any>(`${SERVER_URL}/api/favorites/clear`).subscribe({
      next: () => {
        this.favoriteIds.set(new Set());
        this.wishlistSubject.next([]);
        this.productService.clearAllFavoriteState();
      },
      error: (err) => console.error('Failed to clear favorites:', err),
    });
  }
}
