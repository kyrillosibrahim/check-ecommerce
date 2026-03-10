import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, map, catchError, of } from 'rxjs';
import { IProduct } from '../models/product.model';
import { CartService } from './cart.service';
import { ProductService } from './product.service';
import { API_CONFIG } from '../config/api.config';
import Swal from 'sweetalert2';

const SERVER_URL = API_CONFIG.baseUrl;

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private cartService = inject(CartService);
  private productService = inject(ProductService);

  private wishlistSubject = new BehaviorSubject<IProduct[]>([]);
  loading = signal(false);

  /** IDs currently being toggled (to prevent double-clicks) */
  processingIds = signal<Set<string>>(new Set());

  /** Favorite IDs loaded on init — used for isInWishlist checks across all pages */
  private favoriteIdSet = new Set<string>();
  private idsLoaded = false;

  /** Wishlist items (populated by loadFavorites on wishlist page) */
  wishlist$ = this.wishlistSubject.asObservable();

  constructor() {
    this.loadFavoriteIds();
  }

  /** Load just the favorite IDs (lightweight, no full product data) */
  private loadFavoriteIds(): void {
    this.http.get<string[]>(`${SERVER_URL}/api/favorites/ids`).subscribe({
      next: (ids) => {
        this.favoriteIdSet = new Set(ids);
        this.idsLoaded = true;
      },
      error: () => { this.idsLoaded = true; },
    });
  }

  /**
   * Wishlist count — hybrid source:
   * If products are loaded, derive from inFavorite flags.
   * Otherwise fall back to wishlist data (loaded on wishlist page).
   */
  wishlistCount$ = combineLatest([
    this.wishlistSubject,
    this.productService.products$,
  ]).pipe(
    map(([wishlistItems, products]) => {
      if (products.length > 0) {
        return products.filter(p => p.inFavorite).length;
      }
      if (this.favoriteIdSet.size > 0) {
        return this.favoriteIdSet.size;
      }
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

  addToWishlist(product: IProduct): void {
    if (this.isProcessing(product.id)) return;
    this.markProcessing(product.id);

    // Optimistic update
    this.favoriteIdSet.add(product.id);
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
        this.favoriteIdSet.delete(product.id);
        this.productService.updateProductFavoriteState(product.id, false);
        this.unmarkProcessing(product.id);
        Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل إضافة المنتج للمفضلة', timer: 2000, showConfirmButton: false });
      },
    });
  }

  removeFromWishlist(productId: string): void {
    if (this.isProcessing(productId)) return;
    this.markProcessing(productId);

    // Optimistic update
    this.favoriteIdSet.delete(productId);
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
        this.favoriteIdSet.add(productId);
        this.productService.updateProductFavoriteState(productId, true);
        if (removed) {
          this.wishlistSubject.next([...this.wishlistSubject.getValue(), removed]);
        }
        this.unmarkProcessing(productId);
        Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل إزالة المنتج من المفضلة', timer: 2000, showConfirmButton: false });
      },
    });
  }

  isInWishlist(productId: string): boolean {
    return this.favoriteIdSet.has(productId) ||
      this.wishlistSubject.getValue().some(p => p.id === productId);
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
        this.favoriteIdSet.clear();
        this.wishlistSubject.next([]);
        this.productService.clearAllFavoriteState();
      },
      error: (err) => console.error('Failed to clear favorites:', err),
    });
  }
}
