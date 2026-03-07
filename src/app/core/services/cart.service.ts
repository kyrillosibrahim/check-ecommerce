import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import Swal from 'sweetalert2';
import { IProduct } from '../models/product.model';
import { ICartItem } from '../models/cart.model';
import { TranslationService } from './translation.service';
import { ProductService } from './product.service';
import { API_CONFIG } from '../config/api.config';

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

  private cartSubject = new BehaviorSubject<ICartItem[]>([]);

  constructor() {
    this.loadCart();
  }

  /** Cart items (populated by loadCart on cart/checkout pages) */
  cart$ = this.cartSubject.asObservable();

  /**
   * Cart count — hybrid source:
   * If products are loaded (home/products/offers pages), derive from inCart flags.
   * Otherwise fall back to cart data (loaded on cart/checkout pages).
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
      const discounted = i.product.price * (1 - i.product.discountPercentage / 100);
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
      const discount = i.product.price * (i.product.discountPercentage / 100);
      return sum + discount * i.quantity;
    }, 0))
  );

  private Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    customClass: { popup: 'cart-toast' },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  /** Load cart items from getcart API. Called by cart/checkout pages only. */
  loadCart(): void {
    this.http.get<any[]>(`${SERVER_URL}/api/cart/getcart`).subscribe({
      next: (items) => {
        const mapped: ICartItem[] = items.map(item => ({
          product: this.productService.mapServerProduct(item.product),
          quantity: item.quantity,
        }));
        this.cartSubject.next(mapped);
      },
      error: (err) => console.error('Failed to load cart:', err),
    });
  }

  addToCart(product: IProduct, quantity: number = 1): void {
    this.http.post<any>(`${SERVER_URL}/api/cart/addtocart`, {
      productId: product.id,
      quantity,
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
        this.Toast.fire({
          icon: 'success',
          title: isAr ? `تم إضافة "${name}" إلى السلة` : `"${name}" added to cart`,
        });
      },
      error: (err) => console.error('Failed to add to cart:', err),
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
        this.productService.clearAllCartState();
      },
      error: (err) => console.error('Failed to clear cart:', err),
    });
  }

  isInCart(productId: string): boolean {
    return this.cartSubject.getValue().some(i => i.product.id === productId);
  }
}
