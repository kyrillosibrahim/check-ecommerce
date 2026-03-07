import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { CartItemComponent } from './components/cart-item/cart-item.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { EgpCurrencyPipe } from '../../shared/pipes/egp-currency.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, AsyncPipe, EgpCurrencyPipe, CartItemComponent, TranslatePipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  translationService = inject(TranslationService);
  cartService = inject(CartService);

  constructor() {
    this.cartService.loadCart();
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
