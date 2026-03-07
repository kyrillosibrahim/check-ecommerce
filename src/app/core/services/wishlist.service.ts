import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { IProduct } from '../models/product.model';
import { CartService } from './cart.service';
import { ProductService } from './product.service';
import { API_CONFIG } from '../config/api.config';

const SERVER_URL = API_CONFIG.baseUrl;

/**
 * WishlistService — uses server-side favorites API.
 * loadFavorites() calls getfavorit and is only triggered by the wishlist page.
 * Product pages rely on product.inFavorite flag from their own APIs.
 */
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private cartService = inject(CartService);
  private productService = inject(ProductService);

  private wishlistSubject = new BehaviorSubject<IProduct[]>([]);
  loading = signal(false);

  constructor() {
    this.loadFavorites();
  }

  /** Wishlist items (populated by loadFavorites on wishlist page) */
  wishlist$ = this.wishlistSubject.asObservable();

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
      return wishlistItems.length;
    })
  );

  /** Load favorites from getfavorit API. Called by wishlist page only. */
  loadFavorites(): void {
    this.loading.set(true);
    this.http.get<any[]>(`${SERVER_URL}/api/favorites/getfavorit`).subscribe({
      next: (items) => {
        const mapped = items.map(p => this.productService.mapServerProduct(p));
        this.wishlistSubject.next(mapped);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load favorites:', err);
        this.loading.set(false);
      },
    });
  }

  addToWishlist(product: IProduct): void {
    this.http.post<any>(`${SERVER_URL}/api/favorites/addtofavorit`, {
      productId: product.id,
    }).subscribe({
      next: () => {
        const current = this.wishlistSubject.getValue();
        if (!current.some(p => p.id === product.id)) {
          this.wishlistSubject.next([...current, product]);
        }
        this.productService.updateProductFavoriteState(product.id, true);
      },
      error: (err) => console.error('Failed to add to favorites:', err),
    });
  }

  removeFromWishlist(productId: string): void {
    this.http.delete<any>(`${SERVER_URL}/api/favorites/remove/${productId}`).subscribe({
      next: () => {
        const current = this.wishlistSubject.getValue();
        this.wishlistSubject.next(current.filter(p => p.id !== productId));
        this.productService.updateProductFavoriteState(productId, false);
      },
      error: (err) => console.error('Failed to remove from favorites:', err),
    });
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistSubject.getValue().some(p => p.id === productId);
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
        this.wishlistSubject.next([]);
        this.productService.clearAllFavoriteState();
      },
      error: (err) => console.error('Failed to clear favorites:', err),
    });
  }
}
