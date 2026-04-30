import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ICartItem } from '../../../../core/models/cart.model';
import { TranslationService } from '../../../../core/services/translation.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { DiscountPricePipe } from '../../../../shared/pipes/discount-price.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LocalizePipe } from '../../../../shared/pipes/localize.pipe';
import { EgpCurrencyPipe } from '../../../../shared/pipes/egp-currency.pipe';

@Component({
  selector: 'app-cart-item',
  imports: [RouterLink, EgpCurrencyPipe, DiscountPricePipe, TranslatePipe, LocalizePipe],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartItemComponent {
  translationService = inject(TranslationService);
  wishlistService = inject(WishlistService);
  @Input({ required: true }) item!: ICartItem;
  @Output() quantityChange = new EventEmitter<{ productId: string; quantity: number }>();
  @Output() remove = new EventEmitter<string>();

  get lineTotal(): number {
    const unitPrice = this.item.product.price * (1 - this.item.product.discountPercentage / 100);
    return unitPrice * this.item.quantity;
  }

  get isInWishlist(): boolean {
    return this.wishlistService.isInWishlist(this.item.product.id);
  }

  toggleWishlist(): void {
    if (this.isInWishlist) {
      this.wishlistService.removeFromWishlist(this.item.product.id);
    } else {
      this.wishlistService.addToWishlist(this.item.product);
    }
  }

  increment(): void {
    if (this.item.quantity < this.item.product.stock) {
      this.quantityChange.emit({ productId: this.item.product.id, quantity: this.item.quantity + 1 });
    }
  }

  decrement(): void {
    if (this.item.quantity > 1) {
      this.quantityChange.emit({ productId: this.item.product.id, quantity: this.item.quantity - 1 });
    }
  }
}
