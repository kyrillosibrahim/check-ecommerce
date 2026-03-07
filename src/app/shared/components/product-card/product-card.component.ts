import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IProduct } from '../../../core/models/product.model';
import { TranslationService } from '../../../core/services/translation.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { DiscountPricePipe } from '../../pipes/discount-price.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LocalizePipe } from '../../pipes/localize.pipe';
import { EgpCurrencyPipe } from '../../pipes/egp-currency.pipe';
import { TextLoopComponent } from '../text-loop/text-loop.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, EgpCurrencyPipe, DiscountPricePipe, TranslatePipe, LocalizePipe, TextLoopComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  translationService = inject(TranslationService);
  cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  @Input({ required: true }) product!: IProduct;
  @Output() addToCart = new EventEmitter<IProduct>();
  @Output() addToWishlist = new EventEmitter<IProduct>();

  get isInCart(): boolean {
    return this.product.inCart || this.cartService.isInCart(this.product.id);
  }

  get isInWishlist(): boolean {
    return this.product.inFavorite || this.wishlistService.isInWishlist(this.product.id);
  }

  toggleWishlist(event: Event): void {
    event.stopPropagation();
    if (this.isInWishlist) {
      this.wishlistService.removeFromWishlist(this.product.id);
    } else {
      this.wishlistService.addToWishlist(this.product);
    }
  }

  get hasDiscount(): boolean {
    return this.product.discountPercentage > 0;
  }

  get starsArray(): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  onAddToCart(): void {
    this.addToCart.emit(this.product);
  }

  onComingSoon(): void {
    const isAr = this.translationService.currentLang() === 'ar';
    Swal.fire({
      title: isAr ? 'قريبًا !' : 'Coming Soon!',
      text: isAr
        ? 'المنتج على وشك الوصول الى مخازننا ... كن مستعدًا للحصول عليه!'
        : 'This product is arriving soon... Stay tuned!',
      icon: 'info',
      confirmButtonText: isAr ? 'حسنًا' : 'OK',
    });
  }
}
