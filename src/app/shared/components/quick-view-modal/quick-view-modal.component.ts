import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { QuickViewService } from '../../../core/services/quick-view.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LocalizePipe } from '../../pipes/localize.pipe';
import { EgpCurrencyPipe } from '../../pipes/egp-currency.pipe';
import { DiscountPricePipe } from '../../pipes/discount-price.pipe';
import { CldImagePipe } from '../../pipes/cld-image.pipe';

@Component({
  selector: 'app-quick-view-modal',
  standalone: true,
  imports: [AsyncPipe, TranslatePipe, LocalizePipe, EgpCurrencyPipe, DiscountPricePipe, CldImagePipe],
  templateUrl: './quick-view-modal.component.html',
  styleUrl: './quick-view-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickViewModalComponent {
  quickViewService = inject(QuickViewService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private router = inject(Router);

  close(): void {
    this.quickViewService.close();
  }

  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('quick-view-modal-backdrop')) {
      this.close();
    }
  }

  getImage(product: any): string {
    return product.images?.[0] || product.mainImages?.[0] || '';
  }

  hasDiscount(product: any): boolean {
    return product.discountPercentage > 0;
  }

  isInCart(product: any): boolean {
    return product.inCart || this.cartService.isInCart(product.id);
  }

  isInWishlist(product: any): boolean {
    return product.inFavorite || this.wishlistService.isInWishlist(product.id);
  }

  isWishlistProcessing(product: any): boolean {
    return this.wishlistService.isProcessing(product.id);
  }

  addToCart(product: any): void {
    this.cartService.addToCart(product);
  }

  toggleWishlist(product: any): void {
    if (this.isWishlistProcessing(product)) return;
    if (this.isInWishlist(product)) {
      this.wishlistService.removeFromWishlist(product.id);
    } else {
      this.wishlistService.addToWishlist(product);
    }
  }

  navigateToProduct(product: any): void {
    this.close();
    this.router.navigate(['/product', product.id]);
  }
}
