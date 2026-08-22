import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, map, of, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IProduct } from '../models/product.model';
import { ICartItem } from '../models/cart.model';
import { TranslationService } from './translation.service';
import { ProductService } from './product.service';
import { AlertService } from './alert.service';
import { AuthService } from './auth.service';
import { API_CONFIG } from '../config/api.config';
import { unitPriceAfterDiscount } from '../utils/pricing.util';

const SERVER_URL = API_CONFIG.baseUrl;

/**
 * CartService — uses its own BehaviorSubject for cart items.
 * loadCart() calls getcart API and is only triggered by cart/checkout pages.
 * Product pages rely on product.inCart flag from their own APIs.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private translationService = inject(TranslationService);
  private productService = inject(ProductService);
  private alertService = inject(AlertService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  private cartSubject = new BehaviorSubject<ICartItem[]>([]);

  /** Cart items */
  cart$ = this.cartSubject.asObservable();

  /** Promo/coupon code state — validated server-side (percentage discount). */
  promoApplied = signal(false);
  promoCode = signal('');
  promoPercentage = signal(0);
  private promoPercentage$ = toObservable(this.promoPercentage);

  private readonly BROWSER_ID_KEY = 'sz-browser-id';

  /** A stable per-browser id used to block coupon reuse across accounts. */
  getBrowserId(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    let id = localStorage.getItem(this.BROWSER_ID_KEY);
    if (!id) {
      id = (globalThis.crypto?.randomUUID?.() ?? `bid-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(this.BROWSER_ID_KEY, id);
    }
    return id;
  }

  /** Validates a coupon against the server and applies its percentage on success. */
  validatePromo(code: string): Observable<{ valid: boolean; error?: string }> {
    const trimmed = code.trim();
    if (!trimmed) return of({ valid: false, error: 'الكود مطلوب' });
    return this.http
      .post<{ valid: boolean; discountPercentage?: number; error?: string }>(
        `${API_CONFIG.couponsUrl}/validate`,
        { code: trimmed, browserId: this.getBrowserId() }
      )
      .pipe(
        tap(res => {
          if (res.valid) {
            this.promoCode.set(trimmed.toUpperCase());
            this.promoPercentage.set(res.discountPercentage || 0);
            this.promoApplied.set(true);
          }
        }),
        map(res => ({ valid: !!res.valid, error: res.error })),
        catchError(err => of({ valid: false, error: err?.error?.error || 'الكود غير صحيح' }))
      );
  }

  removePromo(): void {
    this.promoCode.set('');
    this.promoPercentage.set(0);
    this.promoApplied.set(false);
  }

  /** Coupon discount amount in EGP, derived from the cart total after product discounts. */
  promoDiscount$ = combineLatest([this.cartSubject, this.promoPercentage$]).pipe(
    map(([items, pct]) => {
      if (!pct) return 0;
      const total = items.reduce((sum, i) => sum + unitPriceAfterDiscount(i.product) * i.quantity, 0);
      return Math.round(total * pct / 100);
    })
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      let previousUser = this.auth.getCurrentUser();
      // A cart always exists: keyed by user id when signed in, by browser id when
      // not. Logging in folds the guest cart into the account's; logging out drops
      // the account's items and falls back to this browser's own cart.
      this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
        if (user && !previousUser) {
          this.mergeGuestCart();
        } else if (user) {
          this.cartLoaded = false;
          this.loadCart();
        } else {
          if (previousUser) {
            this.cartSubject.next([]);
            this.productService.clearAllCartState();
          }
          this.cartLoaded = false;
          this.loadCart();
        }
        previousUser = user;
      });
    }
  }

  /**
   * Cart count — derived from cart items or product inCart flags.
   */
  cartCount$ = combineLatest([
    this.cartSubject,
    this.productService.products$,
  ]).pipe(
    map(([cartItems, products]) => {
      if (products.length > 0) {
        return products
          .filter(p => p.inCart)
          .reduce((sum, p) => sum + (p.cartQuantity || 1), 0);
      }
      return cartItems.reduce((sum, i) => sum + i.quantity, 0);
    })
  );

  /** Total price after discounts */
  cartTotal$ = this.cart$.pipe(
    map(items => items.reduce((sum, i) => {
      const discounted = unitPriceAfterDiscount(i.product);
      return sum + discounted * i.quantity;
    }, 0))
  );

  /** Subtotal before discounts */
  cartSubtotal$ = this.cart$.pipe(
    map(items => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0))
  );

  /** Total discount amount */
  cartDiscount$ = this.cart$.pipe(
    map(items => items.reduce((sum, i) => {
      const discount = i.product.price - unitPriceAfterDiscount(i.product);
      return sum + discount * i.quantity;
    }, 0))
  );

  private cartLoaded = false;
  loading = signal(true);

  /** Load cart items from getcart API */
  loadCart(): void {
    if (this.cartLoaded) return;
    this.cartLoaded = true;
    this.loading.set(true);
    this.http.get<any[]>(`${SERVER_URL}/api/cart/getcart`).subscribe({
      next: (items) => {
        const mapped: ICartItem[] = items.map(item => ({
          product: this.productService.mapServerProduct(item.product),
          quantity: item.quantity,
        }));
        this.cartSubject.next(mapped);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load cart:', err);
        this.loading.set(false);
      },
    });
  }

  /** Adds to cart. Works for guests too — the browser id identifies their cart. */
  addToCart(product: IProduct, quantity: number = 1): boolean {
    this.http.post<any>(`${SERVER_URL}/api/cart/addtocart`, {
      productId: product.id,
      quantity,
      browserId: this.getBrowserId(),
    }).subscribe({
      next: () => {
        const cart = this.cartSubject.getValue();
        const existing = cart.find(i => i.product.id === product.id);

        if (existing) {
          const updated = cart.map(i =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
          this.cartSubject.next(updated);
        } else {
          this.cartSubject.next([...cart, { product, quantity }]);
        }

        const newQty = (existing ? existing.quantity : 0) + quantity;
        this.productService.updateProductCartState(product.id, true, newQty);

        const isAr = this.translationService.isArabic();
        const name = isAr && product.titleAr ? product.titleAr : product.title;
        this.alertService.toast({
          icon: 'success',
          title: isAr ? `تم إضافة "${name}" إلى السلة` : `"${name}" added to cart`,
          timer: 3500,
          customClass: { popup: 'cart-toast' },
        });
      },
      error: (err) => console.error('Failed to add to cart:', err),
    });
    return true;
  }

  mergeGuestCart(): void {
    this.http.post<any[]>(`${SERVER_URL}/api/cart/merge`, {
      browserId: this.getBrowserId(),
    }).subscribe({
      next: () => {
        this.cartLoaded = false;
        this.loadCart();
      },
      error: (err) => console.error('Failed to merge guest cart:', err),
    });
  }

  removeFromCart(productId: string): void {
    this.http.delete<any>(`${SERVER_URL}/api/cart/remove/${productId}`).subscribe({
      next: () => {
        const cart = this.cartSubject.getValue();
        this.cartSubject.next(cart.filter(i => i.product.id !== productId));
        this.productService.updateProductCartState(productId, false, 0);
      },
      error: (err) => console.error('Failed to remove from cart:', err),
    });
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity < 1) return;
    this.http.put<any>(`${SERVER_URL}/api/cart/update`, { productId, quantity }).subscribe({
      next: () => {
        const cart = this.cartSubject.getValue();
        const updated = cart.map(i =>
          i.product.id === productId ? { ...i, quantity } : i
        );
        this.cartSubject.next(updated);
        this.productService.updateProductCartState(productId, true, quantity);
      },
      error: (err) => console.error('Failed to update cart:', err),
    });
  }

  clearCart(): void {
    this.http.delete<any>(`${SERVER_URL}/api/cart/clear`).subscribe({
      next: () => {
        this.cartSubject.next([]);
        this.cartLoaded = false;
        this.productService.clearAllCartState();
      },
      error: (err) => console.error('Failed to clear cart:', err),
    });
  }

  isInCart(productId: string): boolean {
    return this.cartSubject.getValue().some(i => i.product.id === productId);
  }
}
