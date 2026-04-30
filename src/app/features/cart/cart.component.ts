import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { CartItemComponent } from './components/cart-item/cart-item.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { EgpCurrencyPipe } from '../../shared/pipes/egp-currency.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, AsyncPipe, EgpCurrencyPipe, CartItemComponent, SkeletonLoaderComponent, TranslatePipe, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  translationService = inject(TranslationService);
  cartService = inject(CartService);

  promoCodeInput = '';
  promoError = signal(false);
  itemsCollapsed = signal(false);

  toggleItemsCollapsed(): void {
    this.itemsCollapsed.update(v => !v);
  }

  get promoApplied() { return this.cartService.promoApplied; }
  get PROMO_DISCOUNT() { return this.cartService.PROMO_DISCOUNT; }

  constructor() {
    this.cartService.loadCart();
  }

  applyPromo(): void {
    if (this.cartService.applyPromo(this.promoCodeInput)) {
      this.promoError.set(false);
    } else {
      this.promoError.set(true);
    }
  }

  removePromo(): void {
    this.promoCodeInput = '';
    this.cartService.removePromo();
    this.promoError.set(false);
  }

  clearAll(): void {
    const isAr = this.translationService.currentLang() === 'ar';
    Swal.fire({
      title: isAr ? 'حذف جميع المنتجات؟' : 'Remove all products?',
      text: isAr ? 'سيتم حذف جميع المنتجات من السلة' : 'All products will be removed from the cart',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: isAr ? 'نعم، احذف الكل' : 'Yes, clear all',
      cancelButtonText: isAr ? 'إلغاء' : 'Cancel',
    }).then(result => {
      if (result.isConfirmed) {
        this.cartService.clearCart();
      }
    });
  }
}
